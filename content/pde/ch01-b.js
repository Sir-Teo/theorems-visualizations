// Partial Differential Equations — Chapter 1: Where PDEs come from (part b: 1.7–1.12)
import { symbol, charDirs } from './ch01.shared.js';

/** Complex helpers for the Cauchy–Kovalevskaya example: F(z) = 1/(1 + z²). */
const sup10 = (x) => { const e = Math.floor(Math.log10(x)), m = x / 10 ** e, SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }; return `${m.toFixed(1)}×10${String(e).split('').map((c) => SUP[c]).join('')}`; };
const cmul = (p, q) => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
const cdiv = (p, q) => { const d = q[0] * q[0] + q[1] * q[1]; return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d]; };
const Fz = (z) => cdiv([1, 0], [1 + (z[0] * z[0] - z[1] * z[1]), 2 * z[0] * z[1]]);

export default {
  collection: 'pde',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Concept',
      name: 'Well-posed problems (Hadamard)',
      statement: String.raw`A boundary or initial value problem for a PDE is **well posed** (in Hadamard's sense), in a chosen pair of function spaces for data and solutions, if
(a) **existence:** for every admissible datum there is a solution;
(b) **uniqueness:** there is at most one solution;
(c) **stability:** the solution depends continuously on the data: there is a constant $C$ (for the time or region of interest) with $\|u-\tilde u\|\le C\,\|\text{data}-\widetilde{\text{data}}\|$.
A problem that fails one of these is **ill posed**. Physical problems are expected to be well posed because data are measured only approximately.`,
      idea: String.raw`On a periodic interval every datum is a sum of modes $\cos(nx+\varphi)$ and a linear problem multiplies mode $n$ by a factor $m_n(t)$ depending only on $n$. Stability in the sup norm then amounts to $\sup_nm_n(t)<\infty$: translation ($|m_n|=1$), diffusion ($e^{-n^2t}$), waves ($|\cos nt|$) and the Dirichlet problem for Laplace's equation on a strip all pass, whereas $\cosh nt$ (Cauchy data for Laplace) and $e^{+n^2t}$ (heat equation run backwards) are unbounded in $n$, so no constant $C$ exists.`,
      caption: String.raw`Choose a problem. The base datum is a smooth function; the perturbation is a random combination of modes up to frequency $K$, rescaled to have sup norm exactly $\varepsilon$. The top plot shows how far the solution moves at time (or height) $\tau$; the lower plot shows the factor $m_n(\tau)$ by which each frequency is amplified (green: well posed, red: ill posed). Raise $K$ or $\tau$: for the red problems the tiny perturbation takes over.`,
      deps: ['pde-1.6'],
      refs: ['Strauss §1.5'],
      tags: ['well-posedness', 'stability'],
      credit: 'Hadamard, 1902',
      scope: String.raw`Stated here for linear problems on the circle, in the sup norm; the same three requirements define well-posedness in general, with norms chosen to suit the problem.`,
      viz(v) {
        const M = v.M, TAU = 2 * Math.PI, Y = 2.5, NN = 24;
        const PROB = {
          transport: { label: 'transport', ok: true, m: () => 1, ph: (n, t) => -n * t, env: () => 1 },
          heat: { label: 'heat', ok: true, m: (n, t) => Math.exp(-n * n * t), env: (n, t) => Math.exp(-n * n * t) },
          wave: { label: 'wave', ok: true, m: (n, t) => Math.cos(n * t), env: () => 1 },
          dir: { label: 'Laplace: Dirichlet data', ok: true, m: (n, t) => Math.sinh(n * (Y - t)) / Math.sinh(n * Y), env: (n, t) => Math.sinh(n * (Y - t)) / Math.sinh(n * Y) },
          cauchy: { label: 'Laplace: Cauchy data', ok: false, m: (n, t) => Math.min(1e150, Math.cosh(n * t)), env: (n, t) => Math.min(1e150, Math.cosh(n * t)) },
          back: { label: 'backward heat', ok: false, m: (n, t) => Math.min(1e150, Math.exp(n * n * t)), env: (n, t) => Math.min(1e150, Math.exp(n * n * t)) },
        };
        const COL = { transport: 'teal', heat: 'green', wave: 'blue', dir: 'purple', cauchy: 'red', back: 'orange' };
        const which = v.select('problem', Object.entries(PROB).map(([value, o]) => ({ value, label: o.label })), 'heat');
        const eS = v.slider('perturbation size $\\varepsilon$', 1e-8, 0.1, 1e-3, { log: true, sig: 2 });
        const kS = v.slider('highest frequency $K$', 1, 16, 8, { int: true });
        const tS = v.slider('time / height $\\tau$', 0, 2, 1, { step: 0.02 });
        let seed = 5; v.button('New random perturbation', () => { seed++; });
        const base = [[1, 1, 0], [2, 0.45, -Math.PI / 2], [3, 0.2, 0.6]];
        const s = v.stage({ x: [0, TAU], y: [-1.5, 1.5], height: 270, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'u', title: 'solution at time $\\tau$: unperturbed and perturbed', weight: 1.35 });
        const sm = v.stage({ x: [1, NN], y: [1e-8, 1e8], ylog: true, height: 270, axes: 'box', gutter: true, xlabel: 'frequency n', ylabel: 'amplification  max |m_n(τ)|', title: 'what the problem does to frequency $n$', weight: 1, minWidth: 250 });
        let ck = '', modes = [];
        const getModes = () => {
          const k = `${seed}|${kS.value}`; if (k === ck) return modes; ck = k;
          const r = v.rng(seed), raw = M.range(kS.value).map((i) => [i + 1, 1, TAU * r()]);
          let sup = 0; for (let j = 0; j < 400; j++) { const x = (TAU * j) / 400; let z = 0; for (const [n, a, f] of raw) z += a * Math.cos(n * x + f); sup = Math.max(sup, Math.abs(z)); }
          modes = raw.map(([n, a, f]) => [n, a / sup, f]); return modes;
        };
        const evolve = (P, list, x, t, scale) => { let z = 0; for (const [n, a, f] of list) z += scale * a * P.m(n, t) * Math.cos(n * x + f + (P.ph ? P.ph(n, t) : 0)); return z; };
        let info = null;
        v.render(() => {
          const P = PROB[which.value], t = P === PROB.dir ? Math.min(tS.value, Y - 0.05) : tS.value, eps = eS.value, per = getModes();
          const u0 = (x, tt) => evolve(P, base, x, tt, 1), ut = (x) => u0(x, t) + evolve(P, per, x, t, eps);
          let dmax = 0, amax = 0; const pts = [], pts2 = [];
          for (let j = 0; j <= 400; j++) { const x = (TAU * j) / 400, a = u0(x, t), b = ut(x); dmax = Math.max(dmax, Math.abs(b - a)); amax = Math.max(amax, Math.abs(b)); pts.push([x, a]); pts2.push([x, b]); }
          const R = Math.max(1.5, 1.12 * amax), k = R / 1.5; s.setView([0, TAU], [-1.5, 1.5]);
          s.hline(0, { color: 'faint', width: 1 });
          s.fn((x) => u0(x, 0) / k, { color: 'muted', width: 1.3, dash: [5, 4], n: 300 });
          s.path(pts2.map(([x, y]) => [x, y / k]), { color: 'orange', width: 2.8 }); s.path(pts.map(([x, y]) => [x, y / k]), { color: 'accent', width: 2.4 });
          s.setLabels(undefined, k > 1.001 ? `u / ${sup10(k)}` : 'u');
          s.corner(k > 1.001 ? `plot scale: one unit = ${sup10(k)}` : '', 'tl', { color: 'ink', weight: 600 });
          // amplification panel
          for (const [key, Q] of Object.entries(PROB)) {
            if (Q === P) continue;
            sm.path(M.range(NN).map((i) => [i + 1, Math.max(1e-9, Q.env(i + 1, Q === PROB.dir ? Math.min(t, Y - 0.05) : t))]), { color: COL[key], width: 1.4, alpha: 0.4 });
          }
          sm.hline(1, { color: 'ink', width: 1.2, dash: [4, 4] });
          sm.path(M.range(NN).map((i) => [i + 1, Math.max(1e-9, P.env(i + 1, t))]), { color: COL[which.value], width: 3 });
          sm.vline(kS.value, { color: 'gold', width: 1.5 });
          let C = 0; for (let n = 1; n <= kS.value; n++) C = Math.max(C, Math.abs(P.env(n, t)));
          sm.dot(kS.value, Math.min(1e8, Math.max(1e-8, C)), { r: 5, color: 'gold' });
          sm.text('amplification 1', 15, 1, { color: 'ink', size: 11, dy: 8, align: 'center' });
          info = { P, dmax, eps, C, t, amax };
        });
        v.legend([['muted', 'initial datum', { dash: true }], ['accent', 'solution, exact data'], ['orange', 'solution, perturbed data'], ['gold', 'current $K$'], ...Object.entries(PROB).map(([k, q]) => [COL[k], q.label, { dot: true }])]);
        v.readout(() => {
          if (!info) return '';
          const { P, dmax, eps, C, t } = info, r = dmax / eps;
          return `**${P.label}** at $\\tau=${v.fix(t, 2)}$ · perturbation $\\|\\eta\\|_\\infty=${v.sci(eps, 2)}$ moves the solution by $\\|\\delta u\\|_\\infty=${v.sci(dmax, 2)}$, a factor ${r < 1e4 ? v.fix(r, 3) : '$' + v.sci(r, 2) + '$'} · stability constant for frequencies up to $K$: $C=${C < 1e4 ? v.fix(C, 3) : v.sci(C, 2)}$\n` +
            (P.ok ? 'Stable: $C$ stays bounded however large $K$ is, so the error is controlled by the data error.' : 'Unstable: $C$ grows without bound as $K$ increases (and with $\\tau$), so no constant works — the problem is ill posed.' + (P === PROB.back ? ' (It also fails existence: a solution at $\\tau=0$ exists only if the data decay fast enough in $n$.)' : ''));
        });
      },
    },

    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Paradox',
      name: 'Hadamard’s example: ill-posed Cauchy problem for Laplace',
      statement: String.raw`Consider Laplace's equation $u_{xx}+u_{yy}=0$ in the half-plane $y>0$ with Cauchy data on the $x$-axis,
$$u(x,0)=0,\qquad u_y(x,0)=\frac{\sin nx}{n}\quad(n=1,2,\dots).$$
The unique solution is $u_n(x,y)=\dfrac{\sin nx\,\sinh ny}{n^2}$. The data tend to $0$ uniformly as $n\to\infty$ (the data for $n=\infty$ is the zero datum, whose solution is $u\equiv0$), yet for every fixed $y>0$ we have $\sup_x|u_n(x,y)|=\sinh(ny)/n^2\to\infty$. Hence the Cauchy problem for an elliptic equation does **not** depend continuously on its data. In contrast, the Dirichlet problem with $u(x,0)=\sin(nx)/n$ and $u$ bounded has the solution $\sin(nx)\,e^{-ny}/n$, which tends to $0$ for $y>0$.`,
      idea: String.raw`For a separated solution $\sin(nx)\,Y(y)$, Laplace's equation gives $Y''=n^2Y$, so $Y$ is a combination of $e^{\pm ny}$. Cauchy data ($Y(0)$ and $Y'(0)$) pick the growing mode $\sinh$ as well as the decaying one, and the growth rate $e^{ny}$ increases with the frequency. Dirichlet data on a half-plane together with boundedness select only $e^{-ny}$. Elliptic equations smooth; asking them to run "forward" from the boundary asks them to anti-smooth.`,
      caption: String.raw`Slide the frequency $n$ and the height. The map shows $u_n(x,y)$ in a signed logarithmic colour scale (white: $|u|<10^{-4}$). In the plot, the size of the data (blue, falling like $1/n$) is compared with the size of the solution at height $y$ (red for the Cauchy problem, rising like $e^{ny}/n^2$; green for the Dirichlet problem). Switch the problem to see the stable alternative.`,
      deps: ['pde-1.7', 'pde-1.5'],
      refs: ['Strauss §1.5'],
      tags: ['ill-posed', 'Cauchy problem', 'elliptic'],
      credit: 'Hadamard, 1902',
      viz(v) {
        const M = v.M, NM = 24;
        const mode = v.select('problem', [{ value: 'cauchy', label: 'Cauchy data (ill posed)' }, { value: 'dir', label: 'Dirichlet data (well posed)' }], 'cauchy');
        const nS = v.slider('frequency $n$', 1, NM, 6, { int: true });
        const yS = v.slider('height $y$', 0.05, 1.5, 1, { step: 0.01 });
        const amp = (md, n, y) => (md === 'cauchy' ? Math.sinh(n * y) / (n * n) : Math.exp(-n * y) / n);
        const val = (md, n, x, y) => Math.sin(n * x) * amp(md, n, y);
        const s = v.stage({ x: [-Math.PI, Math.PI], y: [0, 1.5], height: 300, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', title: '$u_n(x,y)$', weight: 1.1 });
        const sp = v.stage({ x: [1, NM], y: [1e-4, 1e9], ylog: true, height: 300, axes: 'box', gutter: true, xlabel: 'frequency n', ylabel: 'size (sup norm)', title: 'data against solution', weight: 1, minWidth: 250 });
        let info = null;
        v.render(() => {
          const md = mode.value, n = nS.value, y0 = yS.value;
          const sl = (u) => Math.sign(u) * Math.min(1, Math.max(0, Math.log10(Math.abs(u) / 1e-4) / 8));
          s.heat((x, y) => sl(val(md, n, x, y)), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key: `${md}|${n}` });
          s.hline(y0, { color: 'gold', width: 2 });
          s.text('data on y = 0: u = 0,  u_y = sin(nx)/n', 0, 0.05, { color: 'ink', size: 11.5, align: 'center', plate: true });
          s.text('colour: sign(u)·log₁₀|u|', -Math.PI + 0.1, 1.42, { color: 'ink', size: 11, plate: true });
          const dat = M.range(NM).map((i) => [i + 1, 1 / (i + 1)]), sol = M.range(NM).map((i) => [i + 1, amp(md, i + 1, y0) * (md === 'cauchy' ? 1 : 1)]);
          sp.path(dat, { color: 'accent', width: 2.4 }); sp.dots(dat, { r: 2.4, color: 'accent' });
          sp.path(sol, { color: md === 'cauchy' ? 'red' : 'green', width: 2.4 }); sp.dots(sol, { r: 2.4, color: md === 'cauchy' ? 'red' : 'green' });
          sp.hline(1, { color: 'faint', width: 1, dash: [4, 4] });
          sp.vline(n, { color: 'gold', width: 1.4 });
          sp.dot(n, Math.max(1e-4, Math.min(1e9, amp(md, n, y0))), { r: 5.5, color: 'gold' });
          // noise level at which double precision data ruin the solution at this height
          let lo = 1, hi = 400; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (1e-16 * Math.sinh(m * y0) / m > 1) hi = m; else lo = m; }
          // residual check by finite differences at one point
          const h = 1e-3, xx = 0.7, yy = Math.max(0.1, y0 * 0.5), f = (a, b) => val(md, n, a, b);
          const lap = (f(xx + h, yy) + f(xx - h, yy) + f(xx, yy + h) + f(xx, yy - h) - 4 * f(xx, yy)) / (h * h);
          info = { md, n, y0, a: amp(md, n, y0), nstar: hi, rel: Math.abs(lap) / (n * n * Math.max(1e-300, Math.abs(f(xx, yy))) + 1e-300) };
        });
        v.legend([['accent', 'size of the data $\\sim1/n$'], ['red', 'Cauchy solution at height $y$'], ['green', 'Dirichlet solution at height $y$'], ['gold', 'current $n$']]);
        v.readout(() => {
          if (!info) return '';
          const I = info;
          return I.md === 'cauchy'
            ? `data: $\\|u_y(\\cdot,0)\\|_\\infty=1/n=${v.fix(1 / I.n, 3)}$ · solution at $y=${v.fix(I.y0, 2)}$: $\\sinh(ny)/n^2=${I.a < 1e4 ? v.fix(I.a, 3) : v.sci(I.a, 2)}$ · amplification $${v.sci(I.a * I.n, 2)}$ \nnoise of size $10^{-16}$ (double precision) on a component of frequency $n\\approx${v.fix(I.nstar, 0)}$ already grows to size 1 at $y=${v.fix(I.y0, 2)}$ · finite-difference check of $\\Delta u$ relative to $n^2|u|$: $${v.sci(Math.max(I.rel, 1e-12), 1)}$`
            : `data: $\\|u(\\cdot,0)\\|_\\infty=1/n=${v.fix(1 / I.n, 3)}$ · solution at $y=${v.fix(I.y0, 2)}$: $e^{-ny}/n=${v.sci(I.a, 2)}$ — smaller than the data: the Dirichlet problem is stable · finite-difference check of $\\Delta u$ relative to $n^2|u|$: $${v.sci(Math.max(I.rel, 1e-12), 1)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Theorem',
      name: 'Classification of second-order equations',
      statement: String.raw`A linear second-order equation in two variables, $a\,u_{xx}+2b\,u_{xy}+c\,u_{yy}+(\text{lower-order terms})=0$ with real coefficients (not all of $a,b,c$ zero), is called, at a point,
- **hyperbolic** if $b^2-ac>0$,
- **parabolic** if $b^2-ac=0$,
- **elliptic** if $b^2-ac<0$.
Equivalently the symmetric matrix $A=\begin{pmatrix}a&b\\b&c\end{pmatrix}$ has eigenvalues of opposite signs, one zero eigenvalue, or the same sign. The characteristic curves, along which $dy/dx$ solves $a\,(dy)^2-2b\,dx\,dy+c\,(dx)^2=0$, are real and distinct for hyperbolic equations, coincide for parabolic ones, and do not exist (they are complex) for elliptic ones. The type is invariant under changes of coordinates. The model cases are the wave equation $u_{xx}-u_{yy}=0$, the heat equation $u_{xx}-u_t=0$ and Laplace's equation $u_{xx}+u_{yy}=0$.`,
      idea: String.raw`The principal part $a\xi^2+2b\xi\eta+c\eta^2$ is a quadratic form: its level set $\{Q=1\}$ is an ellipse, a hyperbola or a pair of parallel lines according to the sign of $b^2-ac$. A change of variables $\xi=\xi(x,y),\eta=\eta(x,y)$ transforms the matrix by $A\mapsto JAJ^{T}$ with $J$ the Jacobian, which by Sylvester's law of inertia keeps the signs of its eigenvalues. The directions $(\xi,\eta)$ with $Q=0$ are the normals of the characteristics.`,
      caption: String.raw`Edit $a,b,c$ (constant coefficients), or switch to variable coefficients and type your own functions $a(x,y),b,c$ (the default is Tricomi's equation $y\,u_{xx}+u_{yy}=0$, which changes type across $y=0$). The left map colours the plane by type and draws the two characteristic directions at a grid of points. On the right, the conic $Q=\pm1$ of the principal symbol at the gold point (drag it): ellipse, hyperbola or parallel lines, with the dashed normals to the characteristics.`,
      deps: ['pde-1.1', 'ladr-9.23'],
      refs: ['Strauss §1.6'],
      tags: ['classification', 'characteristics', 'elliptic', 'hyperbolic'],
      viz(v) {
        const M = v.M;
        const EX = { tricomi: ['y', '0', '1'], circle: ['1', '0', 'x^2 + y^2 - 1'], shear: ['1', 'x', '0.2'] };
        const md = v.select('coefficients', [{ value: 'const', label: 'constant' }, { value: 'var', label: 'functions of $(x,y)$' }], 'const');
        const ex = v.select('example', [{ value: 'tricomi', label: 'Tricomi' }, { value: 'circle', label: 'type changes on a circle' }, { value: 'shear', label: 'a, b, c = 1, x, 0.2' }], 'tricomi', { onChange: (k) => { aI.set(EX[k][0]); bI.set(EX[k][1]); cI.set(EX[k][2]); } });
        const aS = v.slider('$a$', -2, 2, 1, { step: 0.05 }), bS = v.slider('$b$', -2, 2, 0, { step: 0.05 }), cS = v.slider('$c$', -2, 2, -1, { step: 0.05 });
        const aI = v.input('$a(x,y)=$', 'y', { vars: ['x', 'y'], width: 120 }), bI = v.input('$b(x,y)=$', '0', { vars: ['x', 'y'], width: 120 }), cI = v.input('$c(x,y)=$', '1', { vars: ['x', 'y'], width: 120 });
        const s = v.stage({ x: [-2.1, 2.1], y: [-2.1, 2.1], equal: true, height: 330, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', title: 'type of the equation and its characteristics', weight: 1.1 });
        const sq = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 330, axes: true, ticks: false, title: 'symbol $Q(\\xi,\\eta)=a\\xi^2+2b\\xi\\eta+c\\eta^2=\\pm1$ at the gold point', weight: 1, minWidth: 250 });
        const P = s.handle(0.9, 0.7, { color: 'gold', r: 8, label: 'P', labelPos: 'ne', constrain: { x: [-1.9, 1.9], y: [-1.9, 1.9] } });
        const coef = (x, y) => (md.value === 'const' ? [aS.value, bS.value, cS.value] : [aI.fn ? aI.fn(x, y) : 0, bI.fn ? bI.fn(x, y) : 0, cI.fn ? cI.fn(x, y) : 0]);
        const tyc = { hyperbolic: 'orange', elliptic: 'accent', parabolic: 'green', degenerate: 'muted' };
        const TNAME = { hyperbolic: 'hyperbolic', elliptic: 'elliptic', parabolic: 'parabolic', degenerate: 'degenerate' };
        const typeAt = (x, y) => {
          const [a, b, c] = coef(x, y); if (![a, b, c].every(isFinite)) return null;
          if (md.value === 'const') return symbol(a, b, c).type;
          const D = b * b - a * c, sc = b * b + Math.abs(a * c) + 1e-9; return Math.abs(D) < 0.03 * sc ? 'parabolic' : D > 0 ? 'hyperbolic' : 'elliptic';
        };
        let info = null;
        v.render(() => {
          const isC = md.value === 'const';
          ex.el.hidden = isC; aS.el.hidden = bS.el.hidden = cS.el.hidden = !isC; aI.el.hidden = bI.el.hidden = cI.el.hidden = isC; P.visible = !isC;
          s.raster((x, y) => { const t = typeAt(x, y); return t ? v.rgb(tyc[t]).slice(0, 3).concat([0.3]) : null; }, { res: 4, rect: [-2, -2, 2, 2], key: `${md.value}|${aS.value}|${bS.value}|${cS.value}|${aI.value}|${bI.value}|${cI.value}` });
          s.path([[-2, -2], [2, -2], [2, 2], [-2, 2]], { close: true, color: 'ink', width: 1, alpha: 0.3 });
          const L = 0.26;
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
            const x = i * 0.8, y = j * 0.8, [a, b, c] = coef(x, y);
            if (![a, b, c].every(isFinite)) continue;
            const ds = charDirs(a, b, c, md.value === 'const' ? 1e-9 : 2e-2);
            ds.forEach((d, k) => s.line(x - L * d[0], y - L * d[1], x + L * d[0], y + L * d[1], { color: k ? 'purple' : 'ink', width: 2 }));
            if (!ds.length) s.dot(x, y, { r: 2.4, color: 'muted', hollow: true });
          }
          const [a, b, c] = coef(P.x, P.y), sy = symbol(a, b, c), ds = charDirs(a, b, c);
          if (md.value === 'var') ds.forEach((d) => s.line(P.x - 0.5 * d[0], P.y - 0.5 * d[1], P.x + 0.5 * d[0], P.y + 0.5 * d[1], { color: 'gold', width: 2.6 }));
          // symbol conic and normals of characteristics
          const Q = (x, y) => a * x * x + 2 * b * x * y + c * y * y;
          sq.contour(Q, [1], { color: 'accent', width: 2.6, res: 240 }); sq.contour(Q, [-1], { color: 'red', width: 2.2, res: 240 });
          for (const d of ds) { const nx = -d[1], ny = d[0]; sq.line(-3 * nx, -3 * ny, 3 * nx, 3 * ny, { color: 'muted', width: 1.4, dash: [6, 4] }); }
          sq.text('Q = 1', -2.9, 2.7, { color: 'accent', size: 12 }); sq.text('Q = −1', -2.9, 2.35, { color: 'red', size: 12 });
          info = { a, b, c, sy, ds, at: typeAt(P.x, P.y) };
        });
        v.legend([['orange', 'hyperbolic region', { area: true }], ['accent', 'elliptic region', { area: true }], ['green', 'parabolic', { area: true }], ['ink', 'characteristic directions (two families)']]);
        v.readout(() => {
          if (!info) return '';
          const { a, b, c, sy, ds, at } = info, isC = md.value === 'const';
          const model = { hyperbolic: 'like the wave equation', elliptic: 'like Laplace’s equation', parabolic: 'like the heat equation', degenerate: 'no second-order part' }[at];
          const sl = ds.map((d) => (Math.abs(d[0]) < 1e-9 ? '∞' : v.fix(d[1] / d[0], 3))).join('\\;\\text{and}\\;');
          return `${isC ? 'Coefficients' : 'At $P=(' + v.fix(P.x, 2) + ',' + v.fix(P.y, 2) + ')$'}: $a=${v.fix(a, 2)}$, $b=${v.fix(b, 2)}$, $c=${v.fix(c, 2)}$ → $b^2-ac=${v.fix(b * b - a * c, 3)}$, eigenvalues of $A$: $${v.fix(sy.l1, 3)},\\ ${v.fix(sy.l2, 3)}$ → **${TNAME[at] ?? '—'}** (${model})\n${ds.length ? `characteristic slopes $dy/dx=${sl}$` : 'no real characteristics (the roots of $a\\,m^2-2b\\,m+c=0$ are complex)'}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Theorem',
      name: 'Reduction to canonical form',
      statement: String.raw`Let $a\,u_{xx}+2b\,u_{xy}+c\,u_{yy}+\dots=0$ have constant coefficients. There is an invertible linear change of variables $(\xi,\eta)^T=P\,(x,y)^T$, with $P$ built from the eigen-decomposition $A=Q\Lambda Q^T$ of $A=\begin{pmatrix}a&b\\b&c\end{pmatrix}$, such that, with $u(x,y)=w(\xi,\eta)$, the principal part becomes
- $w_{\xi\xi}+w_{\eta\eta}$ if $A$ is definite (elliptic),
- $w_{\xi\xi}-w_{\eta\eta}$ (equivalently $w_{\xi\eta}$ after a further rotation) if $A$ is indefinite (hyperbolic),
- $w_{\xi\xi}$ if $A$ is semidefinite of rank one (parabolic),
up to an overall sign. In general (variable coefficients) the reduction is possible near a point by integrating the characteristic equation.`,
      idea: String.raw`If $u(x)=w(Px)$ then the Hessians are related by $D^2u=P^TD^2w\,P$, so $\operatorname{tr}(A\,D^2u)=\operatorname{tr}(PAP^T\,D^2w)$. Choosing $P=S\,Q^T$ with $S=\operatorname{diag}(|\lambda_i|^{-1/2})$ (entries $1$ for a zero eigenvalue) makes $PAP^T=\operatorname{diag}(\operatorname{sgn}\lambda_1,\operatorname{sgn}\lambda_2)$: rotate to the eigenvectors, then rescale. The number of $+$, $-$, $0$ signs, i.e. the type, cannot change (Sylvester).`,
      caption: String.raw`Pick a type or edit $a,b,c$. A solution $w$ of the canonical equation (right panel, with a frequency you can change) is mapped back to the original variables, $u(x,y)=w(P(x,y))$ (left panel), and the coordinate lines $\xi=$ const, $\eta=$ const are drawn as a skewed grid. The readout evaluates $a\,u_{xx}+2b\,u_{xy}+c\,u_{yy}$ on a grid by finite differences: it vanishes, so the transformed function really solves the original equation.`,
      deps: ['pde-1.9', 'pma-9.24'],
      refs: ['Strauss §1.6'],
      tags: ['canonical form', 'change of variables'],
      viz(v) {
        const M = v.M;
        const PRE = { hyp: [1, 0.8, 0.2], ell: [1, 0.5, 1.5], par: [1, 1, 1], wave: [1, 0, -1] };
        const ty = v.select('preset', [{ value: 'hyp', label: 'hyperbolic' }, { value: 'ell', label: 'elliptic' }, { value: 'par', label: 'parabolic' }, { value: 'wave', label: 'wave $u_{xx}-u_{yy}$' }], 'hyp', { onChange: (k) => { aS.set(PRE[k][0]); bS.set(PRE[k][1]); cS.set(PRE[k][2]); } });
        const aS = v.slider('$a$', -2, 2, 1, { step: 0.05 }), bS = v.slider('$b$', -2, 2, 0.8, { step: 0.05 }), cS = v.slider('$c$', -2, 2, 0.2, { step: 0.05 });
        const mS = v.slider('frequency of $w$', 1, 5, 2, { int: true });
        const s = v.stage({ x: [-2, 2], y: [-2, 2], equal: true, height: 320, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', title: '$u(x,y)=w(\\xi,\\eta)$ with the coordinate grid $\\xi,\\eta=$ const', weight: 1.1 });
        const sw = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, height: 320, axes: 'box', gutter: true, xlabel: 'ξ', ylabel: 'η', title: 'canonical variables: $w(\\xi,\\eta)$', weight: 1.1, minWidth: 250 });
        const build = () => {
          const a = aS.value, b = bS.value, c = cS.value, sy = symbol(a, b, c);
          let l = [sy.l1, sy.l2], vv = [sy.v1, sy.v2];
          if (sy.type === 'parabolic' && Math.abs(l[0]) < Math.abs(l[1])) { l = [l[1], l[0]]; vv = [vv[1], vv[0]]; }
          const S = l.map((q) => (Math.abs(q) < 1e-9 * Math.max(1, Math.abs(l[0]), Math.abs(l[1])) ? 1 : 1 / Math.sqrt(Math.abs(q))));
          const P = [[S[0] * vv[0][0], S[0] * vv[0][1]], [S[1] * vv[1][0], S[1] * vv[1][1]]];
          return { a, b, c, sy, l, P, Pi: M.inverse(P) };
        };
        const wfun = (type, m, sgn) => {
          const k = m / 2;
          if (type === 'elliptic') return (xi, eta) => Math.exp(k * xi) * Math.cos(k * eta);
          if (type === 'hyperbolic') return (xi, eta) => Math.sin(k * (xi + eta)) + 0.6 * Math.cos(k * (xi - eta));
          return (xi, eta) => (1 + 0.5 * xi) * Math.sin(k * eta);
        };
        let info = null;
        v.render(() => {
          const B = build(), { a, b, c, sy, P, Pi } = B;
          if (sy.type === 'degenerate') { info = { B, deg: true }; return; }
          const w = wfun(sy.type, mS.value), u = (x, y) => w(P[0][0] * x + P[0][1] * y, P[1][0] * x + P[1][1] * y);
          const key = `${a}|${b}|${c}|${mS.value}`;
          const sc = (z) => Math.max(-1, Math.min(1, z / 2));
          s.heat((x, y) => sc(u(x, y)), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'orange', res: 3, key });
          sw.heat((xi, eta) => sc(w(xi, eta)), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'orange', res: 3, key });
          // coordinate lines: xi = k/2 (accent) and eta = k/2 (purple) drawn in (x, y)
          const E = (xi, eta) => [Pi[0][0] * xi + Pi[0][1] * eta, Pi[1][0] * xi + Pi[1][1] * eta];
          for (let k = -12; k <= 12; k++) {
            const q = k * 0.5, p1 = E(q, -12), p2 = E(q, 12), r1 = E(-12, q), r2 = E(12, q);
            s.line(p1[0], p1[1], p2[0], p2[1], { color: 'accent', alpha: 0.7, width: 1.2 }); s.line(r1[0], r1[1], r2[0], r2[1], { color: 'purple', alpha: 0.7, width: 1.2 });
            sw.line(q, -3, q, 3, { color: 'accent', alpha: 0.5, width: 1 }); sw.line(-3, q, 3, q, { color: 'purple', alpha: 0.5, width: 1 });
          }
          const box = [[-2, -2], [2, -2], [2, 2], [-2, 2]].map(([x, y]) => [P[0][0] * x + P[0][1] * y, P[1][0] * x + P[1][1] * y]);
          sw.path(box, { close: true, color: 'gold', width: 2.2 });
          s.path([[-2, -2], [2, -2], [2, 2], [-2, 2]], { close: true, color: 'gold', width: 2.2 });
          // residual of the original operator and the transformed matrix
          const h = 1e-3; let mx = 0, mu = 0;
          for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) {
            const x = -2 + 0.5 * i + 0.13, y = -2 + 0.5 * j - 0.07, uxx = (u(x + h, y) - 2 * u(x, y) + u(x - h, y)) / (h * h), uyy = (u(x, y + h) - 2 * u(x, y) + u(x, y - h)) / (h * h), uxy = (u(x + h, y + h) - u(x + h, y - h) - u(x - h, y + h) + u(x - h, y - h)) / (4 * h * h);
            mx = Math.max(mx, Math.abs(a * uxx + 2 * b * uxy + c * uyy)); mu = Math.max(mu, Math.abs(uxx) + Math.abs(uyy) + Math.abs(uxy));
          }
          const PAP = M.matMul(M.matMul(P, [[a, b], [b, c]]), M.transpose(P));
          info = { B, mx, mu, PAP, deg: false };
        });
        v.legend([['accent', 'lines $\\xi=$ const'], ['purple', 'lines $\\eta=$ const'], ['gold', 'the square $|x|,|y|\\le2$ and its image']]);
        v.readout(() => {
          if (!info) return '';
          const { B, mx, mu, PAP, deg } = info;
          if (deg) return 'All of $a,b,c$ are zero: there is no second-order part to reduce.';
          const f = (z) => (Math.abs(z) < 1e-9 ? '0' : v.fix(z, 3));
          const canon = { elliptic: String.raw`w_{\xi\xi}+w_{\eta\eta}`, hyperbolic: String.raw`w_{\xi\xi}-w_{\eta\eta}`, parabolic: String.raw`w_{\xi\xi}` }[B.sy.type];
          return `**${B.sy.type}**: eigenvalues $${v.fix(B.l[0], 3)},\\ ${v.fix(B.l[1], 3)}$; $P=\\begin{pmatrix}${f(B.P[0][0])}&${f(B.P[0][1])}\\\\${f(B.P[1][0])}&${f(B.P[1][1])}\\end{pmatrix}$ and $PAP^T=\\begin{pmatrix}${f(PAP[0][0])}&${f(PAP[0][1])}\\\\${f(PAP[1][0])}&${f(PAP[1][1])}\\end{pmatrix}$ → principal part $\\pm(${canon})$\n$\\max|a\\,u_{xx}+2b\\,u_{xy}+c\\,u_{yy}|=${v.sci(Math.max(mx, 1e-12), 2)}$ on a $9\\times9$ grid, against derivative sizes up to $${v.fix(mu, 1)}$ — the pulled-back function solves the original equation`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Theorem',
      name: 'Cauchy–Kovalevskaya theorem',
      statement: String.raw`Consider a PDE that can be solved for the highest normal derivative, $\partial_r^mu=G\big(s,r,u,\dots\big)$, with $G$ real analytic in its arguments: $s$, $r$, $u$ and all derivatives of $u$ of order $\le m$ other than $\partial_r^mu$ itself. Let the Cauchy data $u=f_0(s),\ \partial_ru=f_1(s),\dots,\partial_r^{m-1}u=f_{m-1}(s)$ be real analytic on a non-characteristic curve $\{r=0\}$. Then there is a unique analytic solution in a neighbourhood of the curve. "Non-characteristic" means that the coefficient of $\partial_r^mu$ in the principal part does not vanish; for $a\,u_{ss}+2b\,u_{sr}+c\,u_{rr}=0$ it says $c\neq0$ (in the coordinates where the curve is $r=0$).`,
      idea: String.raw`If $c\ne0$ the equation determines every Taylor coefficient: $u_{rr}$ from the data on the curve, then by differentiating the equation all higher $r$-derivatives. The theorem's content is that this formal power series converges, which Kovalevskaya (1874–75) proved by majorants: dominate the coefficients by those of a simple explicitly solvable problem. At a characteristic curve the coefficient $c$ vanishes, the recursion is impossible, and the data are either inconsistent or leave the solution undetermined. The theorem is local, analytic and gives no stability: for the heat equation and data $1/(1+x^2)$ the series in $t$ diverges, because $t=$ const is characteristic.`,
      caption: String.raw`The Taylor series of the solution is built coefficient by coefficient from the data $f(s)=1/(1+s^2)$, $g=0$ on a line through the origin whose angle $\theta$ you rotate, by the recursion that solves for $u_{rr}$. Left: the partial sum of degree $N$; right: $\log_{10}$ of its error against the exact solution. Choose Laplace's equation (never characteristic: the series converges inside the unit disc) or the wave equation (characteristic at $\theta=45^\circ,135^\circ$): there the recursion divides by $c$, so the disc of convergence shrinks to nothing as the line turns characteristic.`,
      deps: ['pde-1.9', 'ode-4.1'],
      refs: ['Evans §4.6'],
      tags: ['Cauchy–Kovalevskaya', 'power series', 'characteristic'],
      credit: 'Cauchy, 1842; Kovalevskaya, 1875',
      scope: String.raw`Analytic equation and analytic data on a non-characteristic hypersurface; the solution is local and only unique among analytic functions.`,
      viz(v) {
        const M = v.M, NMAX = 40;
        const eq = v.select('equation', [{ value: 'lap', label: 'Laplace $u_{xx}+u_{yy}=0$' }, { value: 'wave', label: 'wave $u_{xx}-u_{yy}=0$' }], 'wave');
        const thS = v.slider('angle $\\theta$ of the data line (°)', 0, 180, 20, { step: 1 });
        const nS = v.slider('degree $N$', 2, NMAX, 16, { int: true });
        const s = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, height: 330, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', title: 'partial sum $S_N$ (blank where $|S_N|>4$: diverged)', weight: 1.1 });
        const se = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, height: 330, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', title: '$\\log_{10}|S_N-u|$', weight: 1.1, minWidth: 250 });
        const sc = v.stage({ x: [0, NMAX], y: [1e-12, 1e8], ylog: true, height: 330, axes: 'box', gutter: true, xlabel: 'degree N', ylabel: 'max error on circle', title: 'error against degree', weight: 0.9, minWidth: 220 });
        const f = (z) => Fz(z);
        // geometry of the data line: x = s d + r ν
        const setup = () => {
          const th = (thS.value * Math.PI) / 180, d = [Math.cos(th), Math.sin(th)], nu = [-Math.sin(th), Math.cos(th)], A = eq.value === 'lap' ? [[1, 0], [0, 1]] : [[1, 0], [0, -1]];
          const ap = d[0] * (A[0][0] * d[0] + A[0][1] * d[1]) + d[1] * (A[1][0] * d[0] + A[1][1] * d[1]);
          const bp = d[0] * (A[0][0] * nu[0] + A[0][1] * nu[1]) + d[1] * (A[1][0] * nu[0] + A[1][1] * nu[1]);
          const cp = nu[0] * (A[0][0] * nu[0] + A[0][1] * nu[1]) + nu[1] * (A[1][0] * nu[0] + A[1][1] * nu[1]);
          return { th, d, nu, ap, bp, cp };
        };
        // exact solution with data f(s) = 1/(1+s²), g = 0: u = Re[(λ2 F(s+λ1 r) − λ1 F(s+λ2 r))/(λ2 − λ1)]
        const exactFn = (G) => {
          const { ap, bp, cp } = G, D = bp * bp - ap * cp; if (Math.abs(cp) < 1e-9) return null;
          const sq = Math.sqrt(Math.abs(D));
          const l1 = D >= 0 ? [(-bp + sq) / cp, 0] : [-bp / cp, sq / cp], l2 = D >= 0 ? [(-bp - sq) / cp, 0] : [-bp / cp, -sq / cp];
          return (x, y) => {
            const s0 = x * G.d[0] + y * G.d[1], r = x * G.nu[0] + y * G.nu[1];
            const z1 = [s0 + l1[0] * r, l1[1] * r], z2 = [s0 + l2[0] * r, l2[1] * r];
            const t1 = cmul(l2, Fz(z1)), t2 = cmul(l1, Fz(z2)), den = [l2[0] - l1[0], l2[1] - l1[1]];
            return cdiv([t1[0] - t2[0], t1[1] - t2[1]], den)[0];
          };
        };
        // Taylor coefficients in (s, r) by the recursion  c_{i,j+2} = −[a'(i+2)(i+1)c_{i+2,j} + 2b'(i+1)(j+1)c_{i+1,j+1}] / (c'(j+2)(j+1))
        const coeffs = (G) => {
          const { ap, bp, cp } = G, C = M.range(NMAX + 1).map(() => new Float64Array(NMAX + 3));
          // f(s) = Σ (−1)^k s^{2k}
          for (let i = 0; i <= NMAX; i += 2) C[0][i] = 0; // placeholder rows filled below (C[j][i] = coefficient of s^i r^j)
          for (let i = 0; i <= NMAX; i += 2) C[0][i] = (i / 2) % 2 ? -1 : 1;
          for (let j = 0; j + 2 <= NMAX; j++) for (let i = 0; i + j + 2 <= NMAX; i++) {
            C[j + 2][i] = -(ap * (i + 2) * (i + 1) * C[j][i + 2] + 2 * bp * (i + 1) * (j + 1) * C[j + 1][i + 1]) / (cp * (j + 2) * (j + 1));
          }
          return C;
        };
        const evalN = (C, N, sv, rv) => {
          let tot = 0, pw = 1;
          for (let j = 0; j <= N; j++) { let inner = 0; for (let i = N - j; i >= 0; i--) inner = inner * sv + C[j][i]; tot += inner * pw; pw *= rv; }
          return tot;
        };
        let info = null;
        v.render(() => {
          const G = setup(), N = nS.value, ex = exactFn(G), char = Math.abs(G.cp) < 1e-9;
          // data line and characteristic directions
          const drawLines = (st) => {
            st.line(-3 * G.d[0], -3 * G.d[1], 3 * G.d[0], 3 * G.d[1], { color: 'gold', width: 2.6 });
            if (eq.value === 'wave') for (const a of [Math.PI / 4, (3 * Math.PI) / 4]) st.line(-3 * Math.cos(a), -3 * Math.sin(a), 3 * Math.cos(a), 3 * Math.sin(a), { color: 'red', width: 1.4, dash: [6, 4] });
          };
          if (char) { drawLines(s); drawLines(se); s.text('characteristic data line: the recursion divides by 0', 0, 1.5, { align: 'center', color: 'red', size: 13, plate: true }); info = { G, char }; return; }
          const C = coeffs(G), key = `${eq.value}|${thS.value}|${N}`;
          const S = (x, y) => evalN(C, N, x * G.d[0] + y * G.d[1], x * G.nu[0] + y * G.nu[1]);
          s.heat((x, y) => { const z = S(x, y); return Math.abs(z) > 4 ? NaN : Math.max(-1.5, Math.min(1.5, z)); }, { range: [-1.5, 1.5], cmap: 'theme-diverging', neg: 'blue', pos: 'orange', res: 4, key });
          se.heat((x, y) => { const e = Math.abs(S(x, y) - ex(x, y)); return Math.max(-12, Math.min(6, Math.log10(e + 1e-300))); }, { range: [-12, 6], cmap: 'magma', res: 4, key: key + 'e' });
          drawLines(s); drawLines(se);
          for (const st of [s, se]) st.circle(0, 0, 1, { color: 'ink', width: 1.2, alpha: 0.5, dash: [3, 4], fill: false });
          // error against degree on three circles
          const rads = [0.4, 0.8, 1.2], cols = ['green', 'orange', 'red'], curves = rads.map(() => []);
          rads.forEach((rho, q) => {
            const pts = M.range(24).map((i) => [rho * Math.cos((2 * Math.PI * i) / 24 + 0.3), rho * Math.sin((2 * Math.PI * i) / 24 + 0.3)]);
            for (let n = 1; n <= NMAX; n += 1) { let e = 0; for (const [x, y] of pts) e = Math.max(e, Math.abs(evalN(C, n, x * G.d[0] + y * G.d[1], x * G.nu[0] + y * G.nu[1]) - ex(x, y))); curves[q].push([n, Math.max(1e-12, e)]); }
          });
          curves.forEach((cv, q) => { sc.path(cv, { color: cols[q], width: 2.2 }); });
          sc.vline(N, { color: 'gold', width: 1.4 });
          info = { G, char, curves, rads, N, ex, S };
        });
        v.legend([['gold', 'data line (where $u$ and $u_r$ are given)'], ['red', 'characteristic directions', { dash: true }], ['ink', 'unit circle', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const { G, char } = info;
          if (char) return `$\\theta=${v.fix(thS.value, 0)}^\\circ$: the coefficient of $u_{rr}$ is $c'=\\nu^TA\\nu=${v.fix(G.cp, 4)}=0$ — the data line is **characteristic**; the equation no longer determines $u_{rr}$ from the data, so the Cauchy problem has no unique (or no) solution.`;
          const e = info.curves.map((cv) => cv[info.N - 1][1]);
          const growing = info.curves.map((cv) => cv[NMAX - 1][1] > cv[19][1] * 10);
          return `$\\theta=${v.fix(thS.value, 0)}^\\circ$: $c'=\\nu^TA\\nu=${v.fix(G.cp, 3)}$ (${Math.abs(G.cp) < 0.1 ? 'nearly characteristic: the recursion divides by a small number' : 'non-characteristic'}) · error of $S_{${info.N}}$ on circles of radius 0.4, 0.8, 1.2: $${v.sci(e[0], 1)},\\ ${v.sci(e[1], 1)},\\ ${v.sci(e[2], 1)}$\n${growing[2] ? 'On the largest circle the error grows with the degree: that point lies outside the disc of convergence.' : 'The error keeps falling with the degree on all three circles.'}${growing[0] ? ' Even the small circle is outside the disc of convergence.' : ''}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Definition',
      name: 'Characteristic surfaces',
      statement: String.raw`For a second-order operator $Lu=\sum a_{ij}\,\partial_i\partial_ju+\dots$ with symmetric coefficient matrix $A=(a_{ij})$, a hypersurface $\Gamma$ with unit normal $\nu$ at a point is **characteristic** there if $\nu^TA\,\nu=\sum a_{ij}\nu_i\nu_j=0$. For $a\,u_{xx}+2b\,u_{xy}+c\,u_{yy}$ a curve with tangent $(dx,dy)$ is characteristic where $a\,(dy)^2-2b\,dx\,dy+c\,(dx)^2=0$. Along a non-characteristic curve, the data $u$ and $\partial_\nu u$ determine all second derivatives (in particular $\partial_\nu^2u$) there; along a characteristic curve they do not: the equation becomes a compatibility condition on the data. Characteristics exist (two real families) exactly for hyperbolic equations, one family for parabolic, none for elliptic equations.`,
      idea: String.raw`Write the equation in coordinates $(s,r)$ along and across $\Gamma$: the coefficient of $u_{rr}$ is $\nu^TA\nu$. If it is nonzero we can solve for $u_{rr}$; if it is zero the only second derivatives the data fix, $u_{ss}$ and $u_{sr}$, enter on their own and $u_{rr}$ is free. For a hyperbolic equation, curves not tangent to a characteristic carry data whose influence fills a region bounded by the two characteristics through the ends; as the curve turns characteristic that region collapses to the curve.`,
      caption: String.raw`Choose an equation and a data curve and rotate it. The curve is coloured by how non-characteristic it is, $|\nu^TA\nu|$ (green: good, red: characteristic); the red dots mark where the tangent is a characteristic direction. For a straight segment and a hyperbolic equation the shaded region is where $u$ is fixed by the data: points whose two backward/forward characteristics both land on the segment. Its area dies as the line turns characteristic.`,
      deps: ['pde-1.9'],
      refs: ['Evans §4.6'],
      tags: ['characteristics', 'Cauchy problem', 'domain of determinacy'],
      viz(v) {
        const M = v.M, LH = 1.1;
        const EQ = { wave: [1, 0, -1], skew: [1, 0.6, -0.5], heat: [1, 0, 0], lap: [1, 0, 1] };
        const eq = v.select('equation', [{ value: 'wave', label: 'wave $u_{xx}-u_{yy}$' }, { value: 'skew', label: 'hyperbolic, skewed' }, { value: 'heat', label: 'parabolic $u_{xx}$' }, { value: 'lap', label: 'Laplace' }], 'wave');
        const cv = v.select('data curve', [{ value: 'line', label: 'segment' }, { value: 'circle', label: 'circle' }, { value: 'parab', label: 'parabola' }, { value: 'wavy', label: 'wavy curve' }], 'line');
        const thS = v.slider('rotation $\\theta$ (°)', 0, 180, 30, { step: 1 });
        const s = v.stage({ x: [-2.2, 2.2], y: [-2.2, 2.2], equal: true, height: 330, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'y', title: 'data curve and its domain of determinacy', weight: 1.1 });
        const sq = v.stage({ x: [0, 1], y: [-1.2, 1.2], height: 330, axes: 'box', gutter: true, xlabel: 'θ / 180°', ylabel: 'νᵀAν', title: 'the coefficient of $u_{\\nu\\nu}$', weight: 1, minWidth: 250 });
        const curveFn = (name, t) => { // t in [0,1], centred at origin before rotation
          if (name === 'line') return [(2 * t - 1) * LH, 0];
          if (name === 'circle') return [1.2 * Math.cos(2 * Math.PI * t), 1.2 * Math.sin(2 * Math.PI * t)];
          if (name === 'parab') { const u = (2 * t - 1) * 1.4; return [u, 0.55 * u * u - 0.6]; }
          const u = (2 * t - 1) * 1.8; return [u, 0.5 * Math.sin(2.2 * u)];
        };
        const rot = (p, th) => [p[0] * Math.cos(th) - p[1] * Math.sin(th), p[0] * Math.sin(th) + p[1] * Math.cos(th)];
        const pt = (name, t, th) => rot(curveFn(name, t), th);
        const qOf = (A, tx, ty) => { const n = Math.hypot(tx, ty) || 1, nx = -ty / n, ny = tx / n; return A[0] * nx * nx + 2 * A[1] * nx * ny + A[2] * ny * ny; };
        let info = null;
        v.render(() => {
          const A = EQ[eq.value], [a, b, c] = A, th = (thS.value * Math.PI) / 180, name = cv.value, sy = symbol(a, b, c), ds = charDirs(a, b, c), sca = Math.hypot(a, b, c);
          const line = name === 'line';
          sq.setLabels(line ? 'θ / 180°' : 'position along the curve', 'νᵀAν');
          // determinacy region of a segment (hyperbolic only)
          let area = null;
          if (line && sy.type === 'hyperbolic') {
            const d = [Math.cos(th), Math.sin(th)];
            const hitS = (z, e) => { const det = d[0] * e[1] - d[1] * e[0]; if (Math.abs(det) < 1e-9) return null; return (z[0] * e[1] - z[1] * e[0]) / det; };
            let cnt = 0, tot = 0;
            s.raster((x, y) => { const z = [x, y], s1 = hitS(z, ds[0]), s2 = hitS(z, ds[1]); tot++; const inn = s1 != null && s2 != null && Math.abs(s1) <= LH && Math.abs(s2) <= LH; if (inn) cnt++; return inn ? v.rgb('green').slice(0, 3).concat([0.32]) : null; }, { res: 3, key: `det|${eq.value}|${thS.value}` });
            area = cnt / tot;
          }
          if (ds.length) for (const dd of ds) s.line(-4 * dd[0], -4 * dd[1], 4 * dd[0], 4 * dd[1], { color: 'muted', width: 1.2, dash: [6, 4] });
          const NP = 160, pts = M.range(NP + 1).map((i) => pt(name, i / NP, th)); const q = []; const chars = [];
          for (let i = 0; i < NP; i++) {
            const tx = pts[i + 1][0] - pts[i][0], ty = pts[i + 1][1] - pts[i][1], qq = qOf(A, tx, ty), t = Math.min(1, Math.abs(qq) / (0.5 * Math.max(sca, 1e-9)));
            s.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], { color: v.mix('green', 'red', 1 - t), width: 4.2 });
            q.push([i / NP, qq]); if (i > 0 && q[i - 1][1] * qq < 0) chars.push(pts[i]);
          }
          for (const p of chars) s.dot(p[0], p[1], { r: 6, color: 'red' });
          s.dot(0, 0, { r: 2.5, color: 'ink' });
          // q panel
          if (line) {
            const g = (t) => { const tt = t * Math.PI; return qOf(A, Math.cos(tt), Math.sin(tt)); };
            sq.setView([0, 1], [-1.15 * Math.max(sca, 0.5), 1.15 * Math.max(sca, 0.5)]);
            sq.hline(0, { color: 'ink', width: 1.2 }); sq.fn(g, { color: 'accent', width: 2.6, n: 400 });
            for (const dd of ds) { const ang = (Math.atan2(dd[1], dd[0]) + Math.PI) % Math.PI; sq.dot(ang / Math.PI, 0, { r: 6, color: 'red' }); }
            sq.vline(thS.value / 180, { color: 'gold', width: 1.6 }); sq.dot(thS.value / 180, g(thS.value / 180), { r: 5.5, color: 'gold' });
          } else {
            sq.setView([0, 1], [-1.15 * Math.max(sca, 0.5), 1.15 * Math.max(sca, 0.5)]);
            sq.hline(0, { color: 'ink', width: 1.2 }); sq.path(q, { color: 'accent', width: 2.6 });
            for (const p of chars) { const i = pts.indexOf(p); sq.dot(i / NP, 0, { r: 5.5, color: 'red' }); }
          }
          const qNow = line ? qOf(A, Math.cos(th), Math.sin(th)) : null;
          info = { sy, ds, area, qNow, chars: chars.length, sca, name, A };
        });
        v.legend([['green', 'data determine $u_{\\nu\\nu}$'], ['red', 'characteristic points'], ['muted', 'characteristic directions', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const I = info, angs = I.ds.map((d) => v.fix((((Math.atan2(d[1], d[0]) * 180) / Math.PI) % 180 + 180) % 180, 1) + '°').join(' and ');
          const head = I.ds.length ? `characteristic directions at ${angs} to the $x$-axis` : 'no real characteristic directions (elliptic): every curve is non-characteristic';
          if (I.name === 'line') {
            const bad = Math.abs(I.qNow) < 0.02 * Math.max(I.sca, 1e-9);
            return `${head}\n$\\nu^TA\\nu=${v.fix(I.qNow, 3)}$ for this segment — ${bad ? '**characteristic**: $u,u_\\nu$ do not determine $u_{\\nu\\nu}$; the Cauchy problem breaks down' : 'non-characteristic: $u_{\\nu\\nu}=-(\\ldots)/\\nu^TA\\nu$ is determined'}${I.area != null ? ` · determinacy region covers ${v.fix(100 * I.area, 1)}% of the window` : ''}`;
          }
          return `${head}\nthe curve is characteristic at ${I.chars} point${I.chars === 1 ? '' : 's'} (red dots), exactly where its tangent lines up with a characteristic direction; elsewhere the Cauchy data determine the second derivatives`;
        });
      },
    },
  ],
};
