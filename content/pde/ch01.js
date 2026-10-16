// Partial Differential Equations — Chapter 1: Where PDEs come from (part a: 1.1–1.6)
import { derivs, makeRod } from './ch01.shared.js';

export default {
  collection: 'pde',
  chapter: 1,
  title: 'Where PDEs come from',
  summary: String.raw`Partial differential equations describe quantities that vary in space and time: a density carried by a flow, a vibrating string, heat spreading through a rod, an electrostatic potential at rest. Conservation laws and constitutive relations produce the transport, wave, diffusion and Laplace equations. A problem is well posed when a solution exists, is unique and depends continuously on the data, and second-order equations split into elliptic, parabolic and hyperbolic types with very different behaviour.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1',
      kind: 'Definition',
      name: 'PDEs: order, linearity and superposition',
      statement: String.raw`A partial differential equation for an unknown $u(x,t)$ (or $u(x_1,\dots,x_n)$) is a relation $F\big(x,t,u,u_x,u_t,u_{xx},u_{xt},u_{tt},\dots\big)=0$ among $u$ and finitely many of its partial derivatives. Its **order** is the highest derivative that occurs. It is **linear** when $F$ is an affine function of $u$ and its derivatives, i.e. $\mathcal L u=g$ with $\mathcal L(\alpha u+\beta w)=\alpha\mathcal Lu+\beta\mathcal Lw$; it is **homogeneous** when $g=0$, and **nonlinear** otherwise.
**Superposition:** if $\mathcal L$ is linear and homogeneous and $u_1,u_2$ solve $\mathcal Lu=0$, so does every combination $\alpha u_1+\beta u_2$. For $\mathcal Lu=g$ with $g\ne0$ only differences of solutions solve the homogeneous equation. For a nonlinear equation, sums of solutions are in general not solutions.`,
      idea: String.raw`Every derivative is a linear operation, so an equation built from derivatives multiplied by coefficients that do not involve $u$ gives $\mathcal L(\alpha u_1+\beta u_2)=\alpha\mathcal Lu_1+\beta\mathcal Lu_2$ at once. A term such as $u\,u_x$ or $u^2$ multiplies the unknown by itself, which produces cross terms $u_1\partial_xu_2+u_2\partial_xu_1$ that nothing cancels. Superposition is what later lets us build solutions from modes (Fourier series, Green's functions).`,
      caption: String.raw`Pick an equation; the fields below hold two solutions $u_1,u_2$ that you can edit (any formula in $x$ and $t$; $t$ plays the role of $y$ for Laplace's equation). Each panel colours the residual of the equation, computed by finite differences, for $u_1$, $u_2$ and the combination $\alpha u_1+\beta u_2$ (white means zero). For the linear homogeneous equations all three are white; for Burgers' equation or the inhomogeneous heat equation the sum lights up. The readout also classifies the operator numerically by testing it on two random smooth functions.`,
      deps: ['pma-9.16'],
      refs: ['Strauss §1.1'],
      tags: ['order', 'linearity', 'superposition'],
      viz(v) {
        const M = v.M;
        const PDES = {
          transport: { label: '$u_t+2u_x$', tex: 'u_t+2u_x=0', order: 1, F: (d) => d.ut + 2 * d.ux, u1: 'sin(x - 2t)', u2: 'exp(-(x - 2t)^2)' },
          wave: { label: '$u_{tt}-u_{xx}$', tex: 'u_{tt}-u_{xx}=0', order: 2, F: (d) => d.utt - d.uxx, u1: 'sin(x) cos(t)', u2: 'exp(-(x + t)^2)' },
          heat: { label: '$u_t-u_{xx}$', tex: 'u_t-u_{xx}=0', order: 2, F: (d) => d.ut - d.uxx, u1: 'exp(-t) sin(x)', u2: 'exp(-4t) cos(2x)' },
          laplace: { label: '$u_{xx}+u_{tt}$', tex: 'u_{xx}+u_{tt}=0', order: 2, F: (d) => d.uxx + d.utt, u1: 'exp(x) cos(t)', u2: 'x t' },
          inhom: { label: '$u_t-u_{xx}+2$', tex: 'u_t-u_{xx}=-2', order: 2, F: (d) => d.ut - d.uxx + 2, u1: 'x^2', u2: 'x^2 + 3 sin(x) exp(-t)' },
          burgers: { label: '$u_t+uu_x$', tex: 'u_t+u\\,u_x=0', order: 1, F: (d) => d.ut + d.u * d.ux, u1: 'x/(1 + t)', u2: '1' },
        };
        const which = v.select('equation', Object.entries(PDES).map(([value, o]) => ({ value, label: o.label })), 'heat', {
          onChange: (k) => { u1In.set(PDES[k].u1); u2In.set(PDES[k].u2); },
        });
        const u1In = v.input('$u_1(x,t)=$', PDES.heat.u1, { vars: ['x', 't'], width: 190 });
        const u2In = v.input('$u_2(x,t)=$', PDES.heat.u2, { vars: ['x', 't'], width: 190 });
        const al = v.slider('$\\alpha$', -2, 2, 1, { step: 0.05 });
        const be = v.slider('$\\beta$', -2, 2, 1, { step: 0.05 });
        const mk = (title) => v.stage({ x: [-3, 3], y: [0, 2], height: 230, axes: 'box', gutter: true, xlabel: 'x', ylabel: 't', title, minWidth: 190 });
        const S1 = mk('residual of $u_1$'), S2 = mk('residual of $u_2$'), S3 = mk('residual of $\\alpha u_1+\\beta u_2$');
        // numerical classification of F on two fixed test functions
        const g1 = (x, t) => Math.sin(1.3 * x + 0.7 * t) + 0.2 * x * t, g2 = (x, t) => Math.exp(-0.3 * x) * Math.cos(0.9 * t) + 0.1 * x * x;
        const classify = (P) => {
          const pts = [[0.4, 0.3], [-1.1, 0.8], [1.7, 1.2]]; let hom = 0, add = 0;
          for (const [x, t] of pts) {
            const F0 = P.F(derivs(() => 0, x, t)), F1 = P.F(derivs(g1, x, t)), F2 = P.F(derivs(g2, x, t));
            const F12 = P.F(derivs((a, b) => g1(a, b) + g2(a, b), x, t));
            hom = Math.max(hom, Math.abs(F0)); add = Math.max(add, Math.abs(F12 - F1 - F2 + F0));
          }
          return add > 1e-4 ? 'nonlinear' : hom > 1e-9 ? 'linear, inhomogeneous' : 'linear, homogeneous';
        };
        let info = null;
        const resid = (P, g) => (x, t) => P.F(derivs(g, x, t));
        const signedLog = (r) => Math.sign(r) * Math.min(1, Math.max(0, Math.log10(Math.abs(r) / 1e-3) / 3));
        v.render(() => {
          const P = PDES[which.value], f1 = u1In.fn, f2 = u2In.fn, a = al.value, b = be.value;
          if (!f1 || !f2) return;
          const gs = [f1, f2, (x, t) => a * f1(x, t) + b * f2(x, t)], st = [S1, S2, S3], mx = [0, 0, 0];
          st.forEach((s, i) => {
            const R = resid(P, gs[i]);
            s.heat((x, t) => signedLog(R(x, t)), { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 4, key: `${which.value}|${u1In.value}|${u2In.value}|${a}|${b}|${i}` });
            for (let p = 0; p <= 20; p++) for (let q = 0; q <= 14; q++) { const r = Math.abs(R(-3 + 0.3 * p, 2 * q / 14)); if (isFinite(r)) mx[i] = Math.max(mx[i], r); }
            let lo = 1e9, hi = -1e9; for (let p = 0; p <= 12; p++) for (let q = 0; q <= 8; q++) { const z = gs[i](-3 + 0.5 * p, 0.25 * q); if (isFinite(z)) { lo = Math.min(lo, z); hi = Math.max(hi, z); } }
            if (hi - lo > 1e-9 && hi - lo < 1e6) s.contour(gs[i], M.range(9).map((k) => lo + ((hi - lo) * (k + 0.5)) / 9), { color: 'ink', alpha: 0.45, width: 1, res: 60 });
          });
          info = { P, mx, kind: classify(P) };
        });
        v.readout(() => {
          if (!info) return String.raw`Enter two formulas in $x$ and $t$.`;
          const { P, mx, kind } = info, z = (r) => (r < 1e-4 ? String.raw`<10^{-4}` : '=' + v.sci(r, 2));
          const ok = mx[2] < 1e-4, base = mx[0] < 1e-4 && mx[1] < 1e-4;
          return `**$${P.tex}$** has order ${P.order}; applied to two test functions it behaves as **${kind}**.\n$\\max|\\mathrm{res}(u_1)|${z(mx[0])}$, $\\max|\\mathrm{res}(u_2)|${z(mx[1])}$, $\\max|\\mathrm{res}(\\alpha u_1+\\beta u_2)|${z(mx[2])}$ (finite-difference error is below $10^{-5}$).\n` +
            (!base ? 'At least one of the two formulas is not a solution of this equation.' : ok ? 'Both are solutions, and so is the combination: superposition holds here.' : 'Both are solutions, but the combination is not: superposition fails.');
        });
      },
    },

    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2',
      kind: 'Theorem',
      name: 'Transport equation and its solution',
      statement: String.raw`Let $c$ be a constant. Every $C^1$ solution of the transport equation $u_t+c\,u_x=0$ on $\mathbb R\times\mathbb R$ has the form $u(x,t)=f(x-ct)$ for a $C^1$ function $f$, and the initial value problem $u(x,0)=u_0(x)$ has exactly the solution $u(x,t)=u_0(x-ct)$. The solution is constant along each **characteristic line** $x-ct=\text{const}$: the profile slides rigidly at speed $c$, to the right if $c>0$. (It also arises from conservation of mass, $\rho_t+q_x=0$, with flux $q=c\rho$ for a medium moving at speed $c$.)`,
      idea: String.raw`Along the line $x=x_0+ct$ the chain rule gives $\frac{d}{dt}u(x_0+ct,t)=u_t+c\,u_x=0$, so $u$ is constant on that line, and each line crosses $t=0$ exactly once, at $x_0$. This turns a PDE into the family of ODEs $\dot x=c$ that the later characteristic method generalises. Conversely $f(x-ct)$ satisfies the equation by the chain rule.`,
      caption: String.raw`Draw an initial profile on the left panel (drag over it) or pick a preset, and set the speed $c$. In the $(x,t)$ plane each line $x-ct=x_0$ is coloured by the value $u_0(x_0)$ it carries; the gold line follows the point you drag with the gold handle. Switch on the numerical scheme to see what a first-order upwind method does with the same equation: it translates the profile but smears it, the more so the fewer cells it uses.`,
      deps: ['pde-1.1', 'vcalc-2.7'],
      refs: ['Evans §2.1', 'Strauss §1.2'],
      tags: ['transport', 'characteristics'],
      scope: String.raw`Constant speed $c$, no source or loss. With $c=c(x,t)$ the characteristics become curves; with $c=u$ they cross (chapter 8).`,
      viz(v) {
        const M = v.M, N = 400, XL = 10, dx = XL / N, TT = 4;
        let U0 = new Float64Array(N + 1), ver = 0;
        const gauss = (x, m, w) => Math.exp(-(((x - m) / w) ** 2));
        const presets = {
          mix: (x) => gauss(x, 2.2, 0.45) + (x > 3.6 && x < 4.6 ? 0.55 : 0),
          tri: (x) => Math.max(0, 1 - Math.abs(x - 2.5) / 1.2),
          step: (x) => (x > 1.5 && x < 3.5 ? 1 : 0),
          zero: () => 0,
        };
        const load = (k) => { for (let i = 0; i <= N; i++) U0[i] = presets[k](i * dx); ver++; };
        load('mix');
        const prof = v.select('profile', [{ value: 'mix', label: 'bump + box' }, { value: 'tri', label: 'tent' }, { value: 'step', label: 'box' }, { value: 'zero', label: 'blank' }], 'mix', { onChange: load });
        const cS = v.slider('speed $c$', -2, 2, 1, { step: 0.05 });
        const useNum = v.toggle('numerical upwind scheme', false);
        const nc = v.slider('scheme cells', 25, 200, 50, { int: true });
        const u0 = (x) => { if (x < 0 || x > XL) return 0; const p = x / dx, i = Math.min(N - 1, Math.floor(p)), f = p - i; return U0[i] * (1 - f) + U0[i + 1] * f; };
        const s = v.stage({ x: [0, XL], y: [-0.35, 1.45], height: 270, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'u', title: '$u(x,t)=u_0(x-ct)$   (drag to draw $u_0$)', weight: 1.25 });
        const s2 = v.stage({ x: [0, XL], y: [0, TT], height: 270, axes: 'box', gutter: true, xlabel: 'x', ylabel: 't', title: 'characteristics $x-ct=x_0$', weight: 1 });
        const H = s.handle(2.2, 1, { color: 'gold', r: 7, label: '$x_0$', labelPos: 'n', constrain: (x) => { const X = M.clamp(x, 0.05, XL - 0.05); return [X, u0(X)]; } });
        let last = null;
        s.onDrag((x, y, ph) => {
          if (Math.abs(x - H.x) < 0.3 && Math.abs(y - H.y) < 0.12) return;
          const i = Math.round(M.clamp(x, 0, XL) / dx), val = M.clamp(y, -0.3, 1.4);
          if (ph === 'start' || last == null) last = [i, val];
          const [i0, v0] = last, a = Math.min(i0, i), b = Math.max(i0, i);
          for (let j = a; j <= b; j++) U0[j] = b === a ? val : v0 + ((val - v0) * (j - i0)) / (i - i0);
          last = ph === 'end' ? null : [i, val]; ver++; H.set(H.x, u0(H.x)); v.invalidate();
        });
        v.button('Smooth', () => { for (let r = 0; r < 4; r++) { const W = U0.slice(); for (let i = 1; i < N; i++) U0[i] = (W[i - 1] + 2 * W[i] + W[i + 1]) / 4; } ver++; });
        nc.el.hidden = true;
        const upwind = (c, tt, cells) => {
          const h = XL / cells, nu = 0.9, dt = (nu * h) / Math.max(1e-9, Math.abs(c)), steps = Math.ceil(tt / dt - 1e-9);
          let w = new Float64Array(cells + 1); for (let i = 0; i <= cells; i++) w[i] = u0(i * h);
          for (let k = 0; k < steps; k++) {
            const d = k === steps - 1 ? tt - k * dt : dt, r = (Math.abs(c) * d) / h, n = w.slice();
            for (let i = 0; i <= cells; i++) { const up = c > 0 ? (i > 0 ? w[i - 1] : 0) : (i < cells ? w[i + 1] : 0); n[i] = w[i] - r * (w[i] - up); }
            w = n;
          }
          return w;
        };
        let info = null;
        v.animate((t) => {
          const c = cS.value, tt = Math.min(t, TT), x0 = H.x, u0x = u0(x0);
          nc.el.hidden = !useNum.value;
          s.hline(0, { color: 'faint', width: 1 });
          s.path(M.range(N + 1).map((i) => [i * dx, U0[i]]), { color: 'muted', width: 1.4, dash: [5, 4] });
          const sh = c * tt;
          s.fn((x) => u0(x - sh), { n: 600, color: 'accent', width: 2.8 });
          let numErr = null;
          if (useNum.value) {
            const cells = nc.value, w = upwind(c, tt, cells), h = XL / cells;
            s.path(M.range(cells + 1).map((i) => [i * h, w[i]]), { color: 'orange', width: 2 });
            s.dots(M.range(cells + 1).map((i) => [i * h, w[i]]), { r: cells > 100 ? 1.6 : 2.6, color: 'orange' });
            let e = 0, n0 = 0; for (let i = 0; i <= cells; i++) { e += (w[i] - u0(i * h - sh)) ** 2; n0 += u0(i * h - sh) ** 2; } numErr = Math.sqrt(e / Math.max(n0, 1e-12));
          }
          s.dot(x0, u0x, { r: 4, color: 'muted' });
          const xn = x0 + sh;
          s.arrow(x0, u0x + 0.1, Math.min(xn, XL - 0.05), u0x + 0.1, { color: 'gold', width: 1.6 });
          s.dot(xn, u0x, { r: 6, color: 'gold' });
          s.corner(`t = ${v.fix(tt, 2)}`, 'tr', { color: 'ink', weight: 600 });
          // space-time picture
          s2.heat((x, y) => u0(x - c * y), { range: [-1.2, 1.2], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key: `${c}|${ver}` });
          for (let x00 = -TT * 2; x00 <= XL + TT * 2; x00 += 0.5) s2.line(x00, 0, x00 + c * TT, TT, { color: 'ink', alpha: 0.22, width: 1 });
          s2.line(x0, 0, x0 + c * TT, TT, { color: 'gold', width: 2.6 });
          s2.hline(tt, { color: 'gold', width: 1.4, dash: [6, 4] });
          s2.dot(xn, tt, { r: 5.5, color: 'gold' });
          // checks
          const xs = M.range(160).map((i) => 0.1 + (XL - 0.2) * (i / 159)), hh = 0.004, res = [];
          for (const x of xs) { const ut = (u0(x - c * (tt + hh)) - u0(x - c * (tt - hh))) / (2 * hh), ux = (u0(x - sh + hh) - u0(x - sh - hh)) / (2 * hh); res.push(Math.abs(ut + c * ux)); }
          res.sort((p, q) => p - q);
          let mass = 0, mx = -1e9, m0 = 0, mx0 = -1e9; for (let i = 0; i <= N; i++) { const q = u0(i * dx - sh); mass += q * dx; mx = Math.max(mx, q); m0 += U0[i] * dx; mx0 = Math.max(mx0, U0[i]); }
          info = { sh, med: res[80], mass, m0, mx, mx0, numErr, tt, u0x };
        }, { period: 5, still: 2.4 });
        v.legend([['muted', 'initial profile $u_0$', { dash: true }], ['accent', 'exact $u_0(x-ct)$'], ['gold', 'a characteristic and the point riding it'], ['orange', 'upwind scheme']]);
        v.readout(() => {
          if (!info) return '';
          const I = info;
          return `shift $ct=${v.fix(I.sh, 2)}$ · the value carried by the gold characteristic is $u_0(x_0)=${v.fix(I.u0x, 3)}$ at every time · $\\max u$: ${v.fix(I.mx0, 3)} → ${v.fix(I.mx, 3)}, $\\int u\\,dx$: ${v.fix(I.m0, 3)} → ${v.fix(I.mass, 3)} (unchanged while the profile stays in the window)\nmedian of $|u_t+c\\,u_x|$ on a grid of 160 points $=${v.sci(Math.max(I.med, 1e-12), 2)}$ (finite-difference level; kinks of a drawn profile are the only exceptions)` +
            (I.numErr != null ? `\nupwind scheme: relative $L^2$ error against the exact solution $=${v.fix(100 * I.numErr, 1)}\\%$` : '');
        });
      },
    },

    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3',
      kind: 'Model',
      name: 'The vibrating string and the wave equation',
      statement: String.raw`Model a taut string of length $L$, tension $T$ and mass per unit length $\mu$ by $N$ beads of mass $m=\mu L/N$ spaced $a=L/N$ apart, joined by straight, massless, taut segments. For small transverse displacements $y_j$ the force on bead $j$ is $\frac Ta(y_{j+1}-y_j)-\frac Ta(y_j-y_{j-1})$, so
$$m\,\ddot y_j=\frac Ta\big(y_{j+1}-2y_j+y_{j-1}\big).$$
Dividing by $a$ and letting $N\to\infty$ with $T,\mu$ fixed, $y_j(t)\to u(x,t)$ with
$$\mu\,u_{tt}=T\,u_{xx},\qquad\text{i.e.}\qquad u_{tt}=c^2u_{xx},\quad c=\sqrt{T/\mu},$$
the one-dimensional wave equation, with $u=0$ at the fixed ends.`,
      idea: String.raw`The second difference is $y_{j+1}-2y_j+y_{j-1}=a^2u_{xx}+O(a^4)$ by Taylor's theorem, so after dividing by $m=\mu a$ the discrete equation is $u_{tt}=(T/\mu)\,u_{xx}$ plus an error of relative size $(a/\text{wavelength})^2$. The chain is an ODE system we can solve exactly in normal modes; the picture compares its motion with d'Alembert's continuum solution, which is the odd $2L$-periodic extension of the initial shape moving in both directions.`,
      caption: String.raw`A string of beads is simulated live (velocity-Verlet, slowed down 100 times). Add beads and watch the dots converge to the dashed continuum solution; tension and density only change the wave speed $c=\sqrt{T/\mu}$, i.e. how fast it plays. The right panel is the exact error of the bead chain against the continuum solution at $ct/L=1/2$, as a function of $N$ (smooth shapes converge like $N^{-2}$, a kinked pluck more slowly).`,
      deps: ['pde-1.1'],
      refs: ['Strauss §1.3'],
      tags: ['wave equation', 'string', 'continuum limit'],
      credit: 'Johann Bernoulli (beaded string), 1727; d’Alembert, 1746–47',
      scope: String.raw`Small transverse displacements ($|u_x|\ll1$) of a perfectly flexible string with uniform tension and density; no damping or stiffness.`,
      viz(v) {
        const M = v.M, SLOW = 100, H = 0.01, NMAX = 120;
        const rs = () => v.restart();
        const nS = v.slider('beads $N$', 3, NMAX, 8, { int: true, onChange: rs });
        const Ts = v.slider('tension $T$ (N)', 5, 80, 20, { step: 1, onChange: rs });
        const ms = v.slider('density $\\mu$ (g/m)', 2, 40, 10, { step: 1, onChange: rs });
        const shp = v.select('initial shape', [{ value: 'pluck', label: 'plucked' }, { value: 'smooth', label: 'smooth bump' }], 'pluck', { onChange: rs });
        const ps = v.slider('position $p$', 0.1, 0.5, 0.3, { step: 0.01, onChange: rs });
        const f0 = (x) => {
          const p = ps.value;
          if (shp.value === 'pluck') return x < p ? (H * x) / p : (H * (1 - x)) / (1 - p);
          const hw = Math.min(0.2, p, 1 - p); return Math.abs(x - p) < hw ? (H * (1 + Math.cos((Math.PI * (x - p)) / hw))) / 2 : 0;
        };
        const fext = (x) => { const r = ((x % 2) + 2) % 2; return r <= 1 ? f0(r) : -f0(2 - r); };
        const cont = (x, s) => 0.5 * (fext(x - s) + fext(x + s));
        const s = v.stage({ x: [0, 1], y: [-1.2, 1.2], height: 270, axes: 'box', gutter: true, xlabel: 'position x / L', ylabel: 'displacement (cm)', title: 'beaded string against the wave equation', weight: 1.5 });
        const ep = v.stage({ x: [3, 200], y: [1e-4, 1], xlog: true, ylog: true, height: 270, axes: 'box', gutter: true, xlabel: 'beads N', ylabel: 'rms error', title: 'error of the chain at $ct/L=\\tfrac12$', weight: 1, minWidth: 250 });
        const DT = 1 / (10 * NMAX);
        const S = v.sim(() => { const N = nS.value, y = new Float64Array(N + 1), w = new Float64Array(N + 1), ac = new Float64Array(N + 1); for (let i = 1; i < N; i++) y[i] = f0(i / N); return { N, y, w, ac, first: true }; }, (st, dt) => {
          const { N, y, w, ac } = st, a2 = (N * N);
          const acc = () => { for (let i = 1; i < N; i++) ac[i] = a2 * (y[i + 1] - 2 * y[i] + y[i - 1]); };
          if (st.first) { acc(); st.first = false; }
          for (let i = 1; i < N; i++) { w[i] += 0.5 * dt * ac[i]; y[i] += dt * w[i]; }
          acc(); for (let i = 1; i < N; i++) w[i] += 0.5 * dt * ac[i];
        }, { dt: DT, maxSteps: 40000 });
        // exact discrete (normal-mode) solution at s
        const chainExact = (N, sT) => {
          const y = new Float64Array(N + 1), fi = M.range(N + 1).map((i) => f0(i / N));
          for (let n = 1; n < N; n++) {
            let B = 0; for (let i = 1; i < N; i++) B += fi[i] * Math.sin((n * Math.PI * i) / N); B *= 2 / N;
            const om = 2 * N * Math.sin((n * Math.PI) / (2 * N)), cs = Math.cos(om * sT);
            for (let i = 1; i < N; i++) y[i] += B * cs * Math.sin((n * Math.PI * i) / N);
          }
          return y;
        };
        let cKey = '', curve = [];
        const errCurve = () => {
          const k = shp.value + ps.value; if (k === cKey) return curve; cKey = k;
          const Ns = [...new Set(M.range(30).map((i) => Math.round(3 * (200 / 3) ** (i / 29))))];
          let nrm = 0; for (let j = 0; j < 400; j++) nrm += f0(j / 400) ** 2; nrm = Math.sqrt(nrm / 400);
          curve = Ns.map((N) => { const y = chainExact(N, 0.5); let e = 0; for (let i = 1; i < N; i++) e += (y[i] - cont(i / N, 0.5)) ** 2; return [N, Math.sqrt(e / (N - 1)) / nrm]; });
          return curve;
        };
        let info = null;
        v.animate((t) => {
          const c = Math.sqrt(Ts.value / (ms.value / 1000)), sT = (t * c) / SLOW;
          S.advance(sT);
          const st = S.state, N = st.N;
          s.hline(0, { color: 'faint', width: 1 });
          s.fn((x) => 100 * cont(x, sT), { n: 500, color: 'green', width: 2.2, dash: [7, 5] });
          const pts = M.range(N + 1).map((i) => [i / N, 100 * st.y[i]]);
          s.path(pts, { color: 'accent', width: 1.6 });
          s.dots(pts.slice(1, N), { r: N > 60 ? 2.4 : N > 25 ? 3.4 : 5.5, color: 'accent' });
          s.dots([pts[0], pts[N]], { r: 4, color: 'ink' });
          let e = 0, nrm = 0; for (let i = 1; i < N; i++) { e += (st.y[i] - cont(i / N, sT)) ** 2; nrm += H * H; }
          info = { c, f1: c / 2, err: Math.sqrt(e / nrm) * 100, N, sT, st };
          s.corner(`${N} beads · ct/L = ${v.fix(sT, 2)}`, 'tr', { color: 'ink', weight: 600 });
          const cv = errCurve();
          ep.path(cv, { color: 'accent', width: 2 }); ep.dots(cv, { r: 2.2, color: 'accent' });
          const tail = cv.filter((p) => p[0] >= 20), fit = M.linreg(tail.map((p) => Math.log(p[0])), tail.map((p) => Math.log(p[1])));
          info.slope = fit.slope;
          if (shp.value === 'smooth') { const g = (n) => cv[cv.length - 1][1] * (200 / n) ** 2; ep.line(20, g(20), 200, g(200), { color: 'muted', dash: [4, 4], width: 1.2 }); ep.text('slope −2', 40, g(40), { color: 'muted', size: 11.5, dy: -8 }); }
          const cur = cv.reduce((b, p) => (Math.abs(Math.log(p[0] / N)) < Math.abs(Math.log(b[0] / N)) ? p : b), cv[0]);
          ep.vline(N, { color: 'gold', width: 1.4 }); ep.dot(cur[0], cur[1], { r: 5, color: 'gold' });
        }, { still: 2.6 });
        v.legend([['accent', 'bead chain (simulated)'], ['green', 'wave equation: d’Alembert', { dash: true }], ['gold', 'current $N$']]);
        v.readout(() => {
          if (!info) return '';
          const I = info;
          return `$c=\\sqrt{T/\\mu}=\\sqrt{${v.fix(Ts.value, 0)}\\,\\mathrm N/${v.fix(ms.value / 1000, 3)}\\,\\mathrm{kg/m}}=${v.fix(I.c, 1)}$ m/s, fundamental $f_1=c/2L=${v.fix(I.f1, 1)}$ Hz ($L=1$ m), played ${SLOW} times slower\nrms deviation of the beads from the continuum solution now: ${v.fix(I.err, 2)}% of the pluck height · fitted slope of the error curve for $N\\ge20$: ${v.fix(I.slope, 2)}`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4',
      kind: 'Model',
      name: 'Diffusion and the heat equation',
      statement: String.raw`**Conservation law plus Fick/Fourier law.** If $u(x,t)$ is a density (heat content, concentration) that is only moved around, then $\frac{d}{dt}\int_a^bu\,dx=q(a,t)-q(b,t)$ for the flux $q$, hence $u_t=-q_x$. If the flux runs down the gradient, $q=-k\,u_x$ with $k>0$ (Fick's law; Fourier's law for heat), we get the **heat (diffusion) equation** $u_t=k\,u_{xx}$.
**Random walk.** A particle that every $\Delta t$ jumps by $\pm\delta$ with probability $\tfrac12$ each has a probability density $p(x,t)$ that satisfies the same equation with $k=\delta^2/(2\Delta t)$ as $\delta,\Delta t\to0$ with $k$ fixed; started at $0$ it is $p(x,t)=(4\pi kt)^{-1/2}e^{-x^2/4kt}$, with variance $\mathbb E x^2=2kt$.`,
      idea: String.raw`The conservation law is a bookkeeping identity, so all the physics sits in the constitutive law $q=-ku_x$. The random walk gives a second route to the same equation: $p(x,t+\Delta t)=\tfrac12p(x-\delta,t)+\tfrac12p(x+\delta,t)$, and Taylor expansion gives $p_t\Delta t\approx\tfrac12\delta^2p_{xx}$. Because independent steps add, the variance grows linearly in time, which is the signature of diffusion.`,
      caption: String.raw`Walkers all start at $0$ and take a step $\pm\delta$ every $\Delta t$ (run starts again when you change a slider). The histogram is the empirical density; the green curve is the heat-equation solution with $k=\delta^2/2\Delta t$, and the gold dots are the exact master-equation (binomial) probabilities. The lower panel records the sample variance, which follows the line $2kt$.`,
      deps: ['pde-1.1', 'vcalc-8.11'],
      refs: ['Strauss §1.3'],
      tags: ['heat equation', 'random walk', 'conservation law'],
      credit: 'Fourier, 1822; Fick, 1855; Einstein, 1905',
      scope: String.raw`Isotropic, homogeneous medium with constant conductivity (diffusivity) $k$; the random-walk derivation needs independent steps with finite variance.`,
      viz(v) {
        const M = v.M, TM = 4;
        const rs = () => v.restart();
        const nW = v.select('walkers', [{ value: 300, label: '300' }, { value: 3000, label: '3 000' }, { value: 30000, label: '30 000' }], 3000, { onChange: rs });
        const dS = v.slider('step $\\delta$', 0.04, 0.2, 0.1, { step: 0.01, onChange: rs });
        const tS = v.slider('time step $\\Delta t$', 0.004, 0.04, 0.02, { step: 0.002, onChange: rs });
        const kk = () => dS.value ** 2 / (2 * tS.value), Xm = () => Math.max(0.9, 3.4 * Math.sqrt(2 * kk() * TM));
        const s = v.stage({ x: [-2, 2], y: [0, 1], height: 270, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'density', title: 'walkers against the heat equation', weight: 1.4 });
        const sv = v.stage({ x: [0, TM], y: [0, 1], height: 270, axes: 'box', gutter: true, xlabel: 'time t', ylabel: 'variance', title: 'sample variance', weight: 1, minWidth: 240 });
        const S = v.sim(() => ({ j: new Int32Array(nW.value), n: 0, acc: 0, rng: v.rng(11), vr: [[0, 0]] }), (st, dt) => {
          st.acc += dt;
          while (st.acc >= tS.value - 1e-12) {
            st.acc -= tS.value; const J = st.j, r = st.rng;
            for (let i = 0; i < J.length; i++) J[i] += r() < 0.5 ? -1 : 1;
            st.n++; let sm = 0; for (let i = 0; i < J.length; i++) sm += J[i] * J[i];
            st.vr.push([st.n * tS.value, (sm / J.length) * dS.value ** 2]);
          }
        }, { dt: 0.002 });
        let info = null;
        v.animate((t) => {
          const tt = Math.min(t, TM); S.advance(tt);
          const st = S.state, d = dS.value, k = kk(), X = Xm(), n = st.n, tm = n * tS.value, nw = st.j.length;
          s.setView([-X, X], [0, 1.2 / Math.sqrt(4 * Math.PI * k * 0.6)]);
          const m = Math.max(1, Math.round(0.28 / (2 * d))), par = n % 2, counts = new Map();
          for (let i = 0; i < nw; i++) { const b = Math.floor((st.j[i] - par) / (2 * m)); counts.set(b, (counts.get(b) || 0) + 1); }
          const w = 2 * m * d;
          for (const [b, cnt] of counts) { const x0 = d * (par + 2 * b * m - 1), dens = cnt / (nw * w); s.rect(x0, 0, x0 + w, dens, { fill: 'accent', fillAlpha: 0.32, color: 'accent', width: 1 }); }
          if (n > 0) {
            s.fn((x) => Math.exp(-(x * x) / (4 * k * tm)) / Math.sqrt(4 * Math.PI * k * tm), { n: 500, color: 'green', width: 2.4 });
            const dots = [], lg = M.lgamma;
            for (let j = -n + (n % 2 ? 0 : 0); j <= n; j += 2) { const x = j * d; if (Math.abs(x) > X) continue; const a = (n + j) / 2; dots.push([x, Math.exp(lg(n + 1) - lg(a + 1) - lg(n - a + 1) - n * Math.LN2) / (2 * d)]); }
            s.dots(dots, { r: 2.2, color: 'gold' });
          } else s.vline(0, { color: 'green', width: 2.4 });
          s.corner(`t = ${v.fix(tm, 2)}   (${n} steps)`, 'tr', { color: 'ink', weight: 600 });
          // variance panel
          sv.setView([0, TM], [0, 2 * k * TM * 1.12]);
          sv.line(0, 0, TM, 2 * k * TM, { color: 'green', width: 2, dash: [7, 5] });
          sv.path(st.vr, { color: 'accent', width: 2.2 });
          sv.dot(tm, st.vr[st.vr.length - 1][1], { r: 5, color: 'gold' });
          sv.text('slope 2k', TM * 0.62, 2 * k * TM * 0.62 + 0.0, { color: 'green', size: 12, dx: 8, dy: 14 });
          let sl = null; if (st.vr.length > 8) { const fit = M.linreg(st.vr.map((p) => p[0]), st.vr.map((p) => p[1])); sl = fit.slope; }
          info = { k, sl, tm, n, nw, d, vr: st.vr[st.vr.length - 1][1] };
        }, { period: TM + 0.8, still: 3.4 });
        v.legend([['accent', 'walker histogram', { area: true }], ['green', 'heat equation $u_t=ku_{xx}$'], ['gold', 'exact random-walk probabilities', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const I = info;
          return `$k=\\delta^2/(2\\Delta t)=${v.fix(I.k, 3)}$ · after $t=${v.fix(I.tm, 2)}$: sample variance $${v.fix(I.vr, 3)}$ against $2kt=${v.fix(2 * I.k * I.tm, 3)}$ · fitted slope of variance against time ${I.sl == null ? '—' : v.fix(I.sl, 3)} (theory $2k=${v.fix(2 * I.k, 3)}$)`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Model',
      name: 'Laplace’s and Poisson’s equations as steady states',
      statement: String.raw`Let a plate occupy a region $\Omega\subset\mathbb R^2$ with temperature $u(x,y,t)$ obeying $u_t=k\,\Delta u+f$, where $f$ is a heat source per unit heat capacity. If the boundary temperature and the source do not depend on time and the solution settles, the limit $u_\infty(x,y)$ has $u_t=0$, i.e. it solves **Poisson's equation** $-\Delta u=f/k$ (and **Laplace's equation** $\Delta u=0$ when $f=0$), with the prescribed boundary values. The equation is the same in electrostatics ($-\Delta\varphi=\rho/\varepsilon_0$) and for the equilibrium height of a stretched membrane.`,
      idea: String.raw`Setting $u_t=0$ in the heat equation removes time, leaving the pure space operator $\Delta$. The balance has a mean-value reading: at equilibrium each point sits at the average of its neighbours plus the local source, and the finite-difference stencil $\tfrac{1}{h^2}(u_{N}+u_S+u_E+u_W-4u)$ is exactly the discrete form of that. That the transient really dies out is the energy decay proved later (the lowest Dirichlet eigenvalue of the unit square is $2\pi^2$, so the residual decays like $e^{-2\pi^2kt}$).`,
      caption: String.raw`A square plate is simulated with the heat equation (explicit finite differences, $k=1$). Set the four wall temperatures and the heater strength and drag the heater. Move a slider while it runs: the plate relaxes to a new equilibrium. The middle panel shows $\Delta u+f$ at every node, which equals $u_t$; it fades to zero, and the bottom panel shows its decay on a log scale at the predicted rate $2\pi^2$.`,
      deps: ['pde-1.4', 'vcalc-9.4'],
      refs: ['Strauss §1.3'],
      tags: ['laplace equation', 'poisson equation', 'steady state'],
      scope: String.raw`Constant boundary data and source, $u_t=k\Delta u+f$ on a bounded region; the transient decays because the Dirichlet Laplacian has a positive lowest eigenvalue.`,
      viz(v) {
        const M = v.M, NP = 40, h = 1 / NP, W = NP + 1, DT = 0.2 * h * h, RATE = 0.22;
        const top = v.slider('top wall', -1, 1, 0, { step: 0.05 }), bot = v.slider('bottom wall', -1, 1, 0, { step: 0.05 });
        const lef = v.slider('left wall', -1, 1, 1, { step: 0.05 }), rig = v.slider('right wall', -1, 1, 0, { step: 0.05 });
        const qS = v.slider('heater strength', 0, 200, 100, { step: 1 });
        const s = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 300, title: 'temperature $u$', weight: 1.1, minWidth: 250 });
        const sr = v.stage({ x: [0, 1], y: [0, 1], equal: true, axes: false, height: 300, title: '$\\Delta u+f$ at every node (= $u_t$)', weight: 1.1, minWidth: 250 });
        const sh = v.stage({ x: [0, 1.4], y: [1e-6, 1e3], ylog: true, height: 300, axes: 'box', gutter: true, xlabel: 'time', ylabel: 'max |Δu + f|', title: 'residual of Poisson’s equation', weight: 1, minWidth: 250 });
        const HT = s.handle(0.62, 0.35, { color: 'gold', r: 8, label: 'heater', labelPos: 'n', constrain: { x: [0.08, 0.92], y: [0.08, 0.92] } });
        const src = (x, y) => qS.value * Math.exp(-((x - HT.x) ** 2 + (y - HT.y) ** 2) / (2 * 0.07 ** 2));
        const bc = (u) => {
          for (let i = 0; i <= NP; i++) { u[i * W] = lef.value; u[i * W + NP] = rig.value; }
          for (let j = 0; j <= NP; j++) { u[j] = bot.value; u[NP * W + j] = top.value; }
          u[0] = (lef.value + bot.value) / 2; u[NP] = (rig.value + bot.value) / 2; u[NP * W] = (lef.value + top.value) / 2; u[NP * W + NP] = (rig.value + top.value) / 2;
        };
        const F = new Float64Array(W * W); let fKey = '';
        const fill = () => { const k = `${HT.x}|${HT.y}|${qS.value}`; if (k === fKey) return; fKey = k; for (let i = 0; i <= NP; i++) for (let j = 0; j <= NP; j++) F[i * W + j] = src(j * h, i * h); };
        const resid = (u, i, j) => (u[(i + 1) * W + j] + u[(i - 1) * W + j] + u[i * W + j + 1] + u[i * W + j - 1] - 4 * u[i * W + j]) / (h * h) + F[i * W + j];
        const S = v.sim(() => ({ u: new Float64Array(W * W), w: new Float64Array(W * W), n: 0, hist: [] }), (st) => {
          fill(); bc(st.u);
          const u = st.u, w = st.w;
          for (let i = 1; i < NP; i++) for (let j = 1; j < NP; j++) { const k = i * W + j; w[k] = u[k] + DT * resid(u, i, j); }
          for (let i = 1; i < NP; i++) for (let j = 1; j < NP; j++) u[i * W + j] = w[i * W + j];
          st.n++;
          if (st.n % 25 === 0) { let m = 0; for (let i = 1; i < NP; i++) for (let j = 1; j < NP; j++) m = Math.max(m, Math.abs(resid(u, i, j))); st.hist.push([st.n * DT, m]); }
        }, { dt: DT, maxSteps: 4000 });
        const at = (u, x, y) => { const p = Math.min(NP - 1e-9, Math.max(0, x * NP)), q = Math.min(NP - 1e-9, Math.max(0, y * NP)), j = Math.floor(p), i = Math.floor(q), fx = p - j, fy = q - i; return (u[i * W + j] * (1 - fx) + u[i * W + j + 1] * fx) * (1 - fy) + (u[(i + 1) * W + j] * (1 - fx) + u[(i + 1) * W + j + 1] * fx) * fy; };
        const signedLog = (r) => Math.sign(r) * Math.min(1, Math.max(0, Math.log10(Math.abs(r) / 0.01) / 4));
        let info = null;
        v.animate((t) => {
          S.advance(t * RATE);
          const st = S.state, u = st.u; fill();
          let lo = 1e9, hi = -1e9; for (let i = 0; i < u.length; i++) { lo = Math.min(lo, u[i]); hi = Math.max(hi, u[i]); }
          lo = Math.min(lo, -0.1); hi = Math.max(hi, 0.1);
          s.heat((x, y) => at(u, x, y), { range: [lo, hi], cmap: 'magma', res: 3, rect: [0, 0, 1, 1], key: `${st.n}|${lo}|${hi}|${fKey}` });
          const lv = []; for (let k = 1; k < 12; k++) lv.push(lo + ((hi - lo) * k) / 12);
          s.contour((x, y) => at(u, x, y), lv, { color: 'ink', alpha: 0.35, width: 1, res: 50 });
          s.path([[0, 0], [1, 0], [1, 1], [0, 1]], { close: true, color: 'ink', width: 1.5 });
          s.colorbar([lo, hi], 'magma', { pos: 'bottom', fmt: (x) => v.fix(x, 1) });
          const rmap = (x, y) => { const i = Math.round(y * NP), j = Math.round(x * NP); return i < 1 || j < 1 || i > NP - 1 || j > NP - 1 ? NaN : resid(u, i, j); };
          sr.heat((x, y) => { const r = rmap(x, y); return isFinite(r) ? signedLog(r) : NaN; }, { range: [-1, 1], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, rect: [0, 0, 1, 1], key: `${st.n}|${fKey}` });
          sr.path([[0, 0], [1, 0], [1, 1], [0, 1]], { close: true, color: 'ink', width: 1.5 });
          sr.text('white: |Δu+f| < 0.01   deep colour: > 100', 0.5, 0.02, { color: 'ink', size: 11, align: 'center', plate: true });
          let mx = 0; for (let i = 1; i < NP; i++) for (let j = 1; j < NP; j++) mx = Math.max(mx, Math.abs(resid(u, i, j)));
          const hs = st.hist; sh.setView([0, 1.4], [1e-6, 1e3]);
          if (hs.length > 1) sh.path(hs.map((p) => [p[0], Math.max(p[1], 1e-6)]), { color: 'accent', width: 2.2 });
          // decay-rate check on the late part of the history
          let rate = null; const late = hs.filter((p) => p[1] > 1e-5 && p[0] > 0.12);
          if (late.length > 5) { const fit = M.linreg(late.map((p) => p[0]), late.map((p) => Math.log(p[1]))); rate = -fit.slope; const t0 = late[0][0]; sh.line(t0, Math.exp(fit.intercept + fit.slope * t0), 1.4, Math.exp(fit.intercept + fit.slope * 1.4), { color: 'green', width: 1.6, dash: [6, 4] }); }
          sh.dot(st.n * DT, Math.max(mx, 1e-6), { r: 5, color: 'gold' });
          info = { mx, rate, t: st.n * DT, mid: at(u, 0.5, 0.5) };
        }, { still: 0.9 });
        v.button('Restart cold', () => v.restart());
        v.legend([['accent', 'residual history'], ['green', 'fitted decay', { dash: true }]]);
        v.readout(() => {
          if (!info) return '';
          const I = info, done = I.mx < 0.05;
          return `time $kt=${v.fix(I.t, 2)}$ · $\\max|\\Delta u+f|=${v.sci(Math.max(I.mx, 1e-9), 2)}$ — ${done ? 'the plate is at equilibrium: $-\\Delta u=f$ holds at every node' : 'still evolving: $u_t\\neq0$'} · fitted decay rate ${I.rate == null ? '—' : v.fix(I.rate, 1)} (theory $2\\pi^2=${v.fix(2 * Math.PI ** 2, 1)}$ for the slowest mode)\ncentre temperature $u(\\tfrac12,\\tfrac12)=${v.fix(I.mid, 3)}$; the maximum principle keeps interior values between the extremes of the walls unless the heater adds heat`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Definition',
      name: 'Initial and boundary conditions: Dirichlet, Neumann, Robin',
      statement: String.raw`A PDE on a region $\Omega$ has many solutions; a problem specifies extra data. For evolution equations one gives an **initial condition** $u(x,0)=\phi(x)$ (and $u_t(x,0)=\psi(x)$ for the wave equation). On the boundary $\partial\Omega$ one prescribes
- **Dirichlet:** $u=g$ (the value, e.g. a temperature held fixed),
- **Neumann:** $\partial u/\partial n=g$ (the normal derivative, e.g. a given heat flux; $g=0$ means insulated),
- **Robin:** $\partial u/\partial n+a\,u=g$ with $a\ge0$ (Newton's law of cooling: flux proportional to the temperature difference with the surroundings, $\partial u/\partial n=-a(u-u_{\rm env})$).
Here $n$ is the outward unit normal. A boundary condition is **homogeneous** when $g=0$.`,
      idea: String.raw`Each condition is a statement about the heat balance at the boundary. By Fourier's law the outward heat flux is $-k\,\partial u/\partial n$: Dirichlet fixes the temperature whatever flux that needs, Neumann fixes the flux, Robin makes it proportional to the temperature jump to the surroundings. In the limit $a\to\infty$ Robin becomes Dirichlet with $u=u_{\rm env}$, and for $a=0$ it becomes Neumann.`,
      caption: String.raw`A rod with a hot spot, heated by $u_t=ku_{xx}$ and solved by implicit finite differences. Choose the condition at each end. The gold tangent at an end shows $u_x$ there: horizontal for an insulated end, pinned to a prescribed value for Dirichlet, and for Robin it passes through the point $(\mp1/a,\,u_{\rm env})$ outside the rod, which is the geometric meaning of the coefficient $a$. The lower panel is the space–time picture.`,
      deps: ['pde-1.4'],
      refs: ['Strauss §1.4'],
      tags: ['boundary conditions', 'initial conditions'],
      viz(v) {
        const M = v.M, N = 100, DT = 0.0005, TH = 0.5, RATE = 0.1;
        const opts = [{ value: 'D', label: 'Dirichlet' }, { value: 'N', label: 'Neumann' }, { value: 'R', label: 'Robin' }];
        const lS = v.select('left end', opts, 'D', { onChange: () => v.restart() }), rS = v.select('right end', opts, 'N', { onChange: () => v.restart() });
        const gL = v.slider('left temperature $g_L$', -1, 1, 0, { step: 0.05 }), gR = v.slider('right temperature $g_R$', -1, 1, 0.5, { step: 0.05 });
        const aS = v.slider('Robin coefficient $a$', 0.5, 40, 6, { log: true, sig: 2 });
        const eS = v.slider('surroundings $u_{\\rm env}$', -1, 1, -0.5, { step: 0.05 });
        const s = v.stage({ x: [-0.55, 1.55], y: [-1.05, 1.25], height: 290, axes: 'box', gutter: true, xlabel: 'x', ylabel: 'u', title: 'temperature along the rod', weight: 1.2 });
        const st2 = v.stage({ x: [0, 1], y: [0, TH], height: 290, axes: 'box', gutter: true, xlabel: 'x', ylabel: 't', title: 'space–time', weight: 1, minWidth: 250 });
        const u0 = (x) => 1.1 * Math.exp(-(((x - 0.5) / 0.14) ** 2));
        const spec = (E, g) => (E === 'D' ? { type: 'D', g } : E === 'N' ? { type: 'N' } : { type: 'R', a: aS.value, T: eS.value });
        const S = v.sim(() => { const R = makeRod(N, 1, spec(lS.value, gL.value), spec(rS.value, gR.value)); for (let i = 0; i <= N; i++) R.u[i] = u0(R.x[i]); R.hist = [R.u.slice()]; R.n = 0; return R; }, (R) => {
          R.left = spec(lS.value, gL.value); R.right = spec(rS.value, gR.value);
          if (R.left.type === 'D') R.u[0] = R.left.g; if (R.right.type === 'D') R.u[N] = R.right.g;
          R.step(DT); R.n++; if (R.n % 20 === 0) R.hist.push(R.u.slice());
        }, { dt: DT, maxSteps: 3000 });
        let info = null;
        const xsN = M.range(N + 1).map((i) => i / N);
        v.animate((t) => {
          aS.el.hidden = lS.value !== 'R' && rS.value !== 'R'; eS.el.hidden = aS.el.hidden; gL.el.hidden = lS.value !== 'D'; gR.el.hidden = rS.value !== 'D';
          S.advance(Math.min(t * RATE, TH));
          const R = S.state, u = R.u, h = R.h;
          s.rect(0, -1.05, 1, 1.25, { fill: 'orange', fillAlpha: 0.05, stroke: false });
          s.vline(0, { color: 'faint', width: 1 }); s.vline(1, { color: 'faint', width: 1 });
          s.fn(u0, { domain: [0, 1], color: 'muted', width: 1.3, dash: [5, 4] });
          if (lS.value === 'R' || rS.value === 'R') s.hline(eS.value, { color: 'green', width: 1.3, dash: [3, 4] });
          s.path(xsN.map((x, i) => [x, u[i]]), { color: 'accent', width: 3 });
          const ux0 = (-3 * u[0] + 4 * u[1] - u[2]) / (2 * h), ux1 = (3 * u[N] - 4 * u[N - 1] + u[N - 2]) / (2 * h);
          const tang = (x, ux, col) => { const L = 0.28; s.line(x - L, u[x === 0 ? 0 : N] - L * ux, x + L, u[x === 0 ? 0 : N] + L * ux, { color: col, width: 2.2 }); };
          tang(0, ux0, 'gold'); tang(1, ux1, 'gold');
          s.dot(0, u[0], { r: 5.5, color: 'gold' }); s.dot(1, u[N], { r: 5.5, color: 'gold' });
          if (lS.value === 'R') { const x = -1 / aS.value; if (x > -0.55) { s.line(0, u[0], x, eS.value, { color: 'gold', width: 1.2, alpha: 0.6, dash: [2, 3] }); s.dot(x, eS.value, { r: 4, color: 'green' }); } }
          if (rS.value === 'R') { const x = 1 + 1 / aS.value; if (x < 1.55) { s.line(1, u[N], x, eS.value, { color: 'gold', width: 1.2, alpha: 0.6, dash: [2, 3] }); s.dot(x, eS.value, { r: 4, color: 'green' }); } }
          if (lS.value === 'D') s.dot(0, gL.value, { r: 9, hollow: true, color: 'red', width: 2 });
          if (rS.value === 'D') s.dot(1, gR.value, { r: 9, hollow: true, color: 'red', width: 2 });
          s.corner(`t = ${v.fix(R.t, 3)}`, 'tr', { color: 'ink', weight: 600 });
          const hs = R.hist; const rows = hs.length;
          st2.heat((x, y) => { const r = Math.min(rows - 1, Math.max(0, y / (20 * DT))), k0 = Math.floor(r), k1 = Math.min(rows - 1, k0 + 1), f = r - k0, p = Math.min(N - 1e-9, x * N), i = Math.floor(p), g = p - i; const a = hs[k0], b = hs[k1]; return y > R.t + 1e-9 ? NaN : (a[i] * (1 - g) + a[i + 1] * g) * (1 - f) + (b[i] * (1 - g) + b[i + 1] * g) * f; }, { range: [-1, 1.1], cmap: 'magma', res: 3, key: `${rows}|${R.n}` });
          st2.hline(R.t, { color: 'gold', width: 1.4 });
          const nl = lS.value === 'R' ? ux0 - aS.value * (u[0] - eS.value) : lS.value === 'N' ? ux0 : u[0] - gL.value;
          const nr = rS.value === 'R' ? ux1 + aS.value * (u[N] - eS.value) : rS.value === 'N' ? ux1 : u[N] - gR.value;
          info = { ux0, ux1, nl, nr, mass: R.mass(), u0: u[0], u1: u[N], t: R.t };
        }, { period: TH / RATE + 1.2, still: 3.2 });
        v.legend([['muted', 'initial temperature', { dash: true }], ['accent', 'temperature now'], ['gold', 'tangent at the ends'], ['green', 'surroundings', { dash: true }], ['red', 'prescribed value', { dot: true }]]);
        v.readout(() => {
          if (!info) return '';
          const I = info, desc = (E, side, ux, res) => ({ D: `${side} Dirichlet: $u=${v.fix(side === 'left' ? I.u0 : I.u1, 3)}$, residual $u-g=${v.sci(Math.max(Math.abs(res), 1e-9), 1)}$`, N: `${side} Neumann: $u_x=${v.fix(ux, 4)}$ (target 0)`, R: `${side} Robin: $u_n+a(u-u_{\\rm env})=${v.fix(res, 4)}$ (target 0)` })[E];
          return `${desc(lS.value, 'left', I.ux0, I.nl)} · ${desc(rS.value, 'right', I.ux1, I.nr)}\ntotal heat $\\int_0^1u\\,dx=${v.fix(I.mass, 4)}$ (initially ${v.fix(1.1 * 0.14 * Math.sqrt(Math.PI), 4)}) — it is conserved only if both ends are insulated`;
        });
      },
    },
  ],
};
