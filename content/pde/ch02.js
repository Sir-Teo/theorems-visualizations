// Partial Differential Equations — Chapter 2: The wave equation in one dimension (part a: 2.1–2.4)
import { gaussSum, dAlembert, makeWave } from './ch02.shared.js';

export default {
  collection: 'pde',
  chapter: 2,
  title: 'The wave equation in one dimension',
  summary: String.raw`The one-dimensional wave equation factors into two transport equations, so every solution is a pair of profiles moving left and right at speed $c$; d’Alembert’s formula writes the solution down from the initial data. Information travels at finite speed along characteristics, energy is conserved, and kinks in the data persist instead of smoothing out. Reflections handle boundaries and Duhamel’s principle handles sources.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Theorem',
      name: 'General solution u = f(x + ct) + g(x − ct)',
      statement: String.raw`Let $c>0$. For any twice differentiable functions $f,g:\R\to\R$, the function $u(x,t)=f(x+ct)+g(x-ct)$ solves the wave equation $u_{tt}=c^2u_{xx}$ on the whole plane. Conversely, every $C^2$ solution on $\R\times\R$ is of this form: there are $C^2$ profiles $f,g$, unique up to an additive constant $\pm k$ that cancels in the sum, with $u=f(x+ct)+g(x-ct)$. So a solution is a *left-moving* wave $f$ plus a *right-moving* wave $g$, each rigidly translated at speed $c$.`,
      idea: String.raw`The operator factors, $\partial_t^2-c^2\partial_x^2=(\partial_t-c\partial_x)(\partial_t+c\partial_x)$, so $v=u_t+cu_x$ solves the transport equation $v_t-cv_x=0$ and is therefore a function of $x+ct$ (the transport theorem 1.2). In the characteristic coordinates $\xi=x+ct,\ \eta=x-ct$ the equation becomes $u_{\xi\eta}=0$, which says $u_\xi$ does not depend on $\eta$ and integrates to $f(\xi)+g(\eta)$. For the converse, integrate once in each variable; the chain rule gives the first direction directly.`,
      caption: String.raw`Drag the nine handles of the **blue** profile $f$ and of the **orange** profile $g$ (each is a smooth sum of Gaussians) and let time run. The blue wave slides left, the orange one slides right, and their sum (black) is the solution; the space–time picture shows the two families of straight characteristics. Switch on *wrong speed* to move the right-mover at $1.5c$ instead: the residual of $u_{tt}-c^2u_{xx}$ jumps from rounding level to order one, because only the speed $c$ fits the equation.`,
      deps: ['pde-1.3', 'pde-1.2'],
      refs: ['Strauss §2.1'],
      credit: 'd’Alembert, 1747',
      tags: ['wave equation', 'characteristics', 'travelling waves'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/D%27Alembert%27s_formula' },
      viz(v) {
        const M = v.M, XS = Array.from({ length: 9 }, (_, i) => -5 + 1.25 * i), WID = 0.8;
        const Pf = v.stage({ x: [-6.5, 6.5], y: [-1.7, 1.7], axes: 'box', gutter: true, height: 210, xlabel: 'ξ', title: 'left-mover profile $f(\\xi)$', minWidth: 280 });
        const Pg = v.stage({ x: [-6.5, 6.5], y: [-1.7, 1.7], axes: 'box', gutter: true, height: 210, xlabel: 'ξ', title: 'right-mover profile $g(\\xi)$', minWidth: 280 });
        const U = v.stage({ x: [-6.5, 6.5], y: [-2.4, 2.4], axes: 'box', gutter: true, height: 260, xlabel: 'x', title: 'the solution $u(x,t)=f(x+ct)+g(x-ct)$', minWidth: 280 });
        const ST = v.stage({ x: [-6.5, 6.5], y: [0, 6], axes: 'box', gutter: true, height: 260, xlabel: 'x', ylabel: 't', title: 'space–time: characteristics and $u$', minWidth: 280 });
        const cS = v.slider('$c$', 0.5, 2, 1, { step: 0.05 });
        const wrong = v.toggle('wrong speed: right-mover at $1.5\\,c$', false);
        const fInit = [0, 0, 0.25, 1, 0.55, 0, 0, 0, 0], gInit = [0, 0, 0, 0, 0, 0.5, 1, 0.3, 0];
        const mk = (S, init, color) => init.map((a, i) => S.handle(XS[i], a, { color, r: 5, constrain: (x, y) => [XS[i], M.clamp(y, -1.6, 1.6)] }));
        const hf = mk(Pf, fInit, 'accent'), hg = mk(Pg, gInit, 'orange');
        let info = null;
        v.animate((t) => {
          const A = hf.map((h) => h.y), B = hg.map((h) => h.y), f = gaussSum(A, XS, WID), g = gaussSum(B, XS, WID), c = cS.value, c2 = wrong.value ? 1.5 * c : c;
          const u = (x, tt) => f(x + c * tt) + g(x - c2 * tt);
          Pf.fn(f, { color: 'accent', width: 2.6 }); Pg.fn(g, { color: 'orange', width: 2.6 });
          U.hline(0, { color: 'faint', width: 1 });
          U.fn((x) => u(x, t), { color: 'ink', width: 3.2 });
          U.fn((x) => f(x + c * t), { color: 'accent', width: 2, dash: [6, 4] });
          U.fn((x) => g(x - c2 * t), { color: 'orange', width: 2, dash: [6, 4] });
          U.corner(`t = ${v.fix(t, 2)}`, 'tr', { color: 'ink', weight: 600 });
          ST.heat((x, y) => M.clamp(u(x, y) / 2, -1, 1), { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key: `${A.map((a) => a.toFixed(3))}|${B.map((a) => a.toFixed(3))}|${c}|${wrong.value}` });
          for (let x0 = -14; x0 <= 14; x0 += 1.25) { ST.line(x0, 0, x0 - 6 / c, 6, { color: 'accent', alpha: 0.18, width: 1 }); ST.line(x0, 0, x0 + 6 / c2, 6, { color: 'orange', alpha: 0.18, width: 1 }); }
          ST.hline(t, { color: 'ink', width: 1.6, dash: [6, 4] });
          // residual of the wave equation by central differences (independent of the formula)
          const h = 0.01; let mx = 0;
          for (let x = -5; x <= 5; x += 0.25) { const r = (u(x, t + h) - 2 * u(x, t) + u(x, t - h)) / (h * h) - c * c * (u(x + h, t) - 2 * u(x, t) + u(x - h, t)) / (h * h); mx = Math.max(mx, Math.abs(r)); }
          info = { mx, t, c };
        }, { period: 6, still: 2.5 });
        v.legend([['accent', '$f(x+ct)$ (moves left)', { dash: true }], ['orange', '$g(x-ct)$ (moves right)', { dash: true }], ['ink', '$u$ = sum']]);
        v.readout(() => info && `$\\max_x\\big|u_{tt}-c^2u_{xx}\\big|=${v.sci(Math.max(info.mx, 1e-12), 2)}$ over 41 points at $t=${v.fix(info.t, 2)}$ (second differences of $u$ with step $0.01$) — ${info.mx < 1e-3 ? 'the equation holds for arbitrary profiles' : 'the equation fails: the right-mover has the wrong speed'}`);
      },
    },
    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Theorem',
      name: 'd’Alembert’s formula',
      statement: String.raw`Let $\varphi\in C^2(\R)$ and $\psi\in C^1(\R)$ and $c>0$. The initial-value problem $u_{tt}=c^2u_{xx}$ for $x\in\R,\ t\in\R$, with $u(x,0)=\varphi(x)$ and $u_t(x,0)=\psi(x)$, has exactly one $C^2$ solution:
$$u(x,t)=\tfrac12\big[\varphi(x+ct)+\varphi(x-ct)\big]+\frac1{2c}\int_{x-ct}^{x+ct}\psi(s)\,ds .$$
Data that are only continuous (a plucked string) or bounded (a struck one) still define $u$ by the same formula, a weak solution.`,
      idea: String.raw`By 2.1 any solution is $f(x+ct)+g(x-ct)$. Setting $t=0$ gives $f+g=\varphi$, and differentiating in $t$ at $t=0$ gives $c(f'-g')=\psi$; integrating the second relation (fundamental theorem of calculus, 6.21 of Rudin) and solving the $2\times2$ linear system gives $f=\tfrac12\varphi+\tfrac1{2c}\int^\xi\psi$ and $g=\tfrac12\varphi-\tfrac1{2c}\int^\eta\psi$. Substituting back produces the formula; the same computation read backwards shows the formula solves the problem, so existence and uniqueness come together.`,
      caption: String.raw`Choose a *pluck* ($\varphi$ a triangle, $\psi=0$), a *strike* ($\varphi=0$, $\psi$ a box) or *both*; drag the orange or blue handles to change heights, then play time. A pluck splits into two half-height copies running apart; a strike leaves a growing plateau between two fronts, the shaded integral term. The readout compares the formula with an independent finite-difference solution of the PDE, and the space–time map shows the same solution as colour.`,
      deps: ['pde-2.1', 'pma-6.21'],
      refs: ['Strauss §2.1', 'Evans §2.4'],
      credit: 'd’Alembert, 1747',
      tags: ['initial value problem', 'd’Alembert formula'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/D%27Alembert%27s_formula' },
      viz(v) {
        const M = v.M;
        const mode = v.select('initial data', [{ value: 'pluck', label: 'pluck ($u_t=0$)' }, { value: 'strike', label: 'strike ($u=0$)' }, { value: 'both', label: 'both' }], 'pluck');
        const cS = v.slider('$c$', 0.5, 2, 1, { step: 0.05 });
        const wP = v.slider('pluck half-width', 0.3, 2, 1, { step: 0.05 });
        const wS = v.slider('strike half-width', 0.2, 2, 0.8, { step: 0.05 });
        const D = v.stage({ x: [-6, 6], y: [-0.55, 1.75], axes: 'box', gutter: true, height: 230, xlabel: 'x', title: 'initial data: $\\varphi$ (blue) and $\\psi$ (orange)', minWidth: 280 });
        const U = v.stage({ x: [-6, 6], y: [-0.55, 1.75], axes: 'box', gutter: true, height: 230, xlabel: 'x', title: '$u(x,t)$ from the formula', minWidth: 280 });
        const ST = v.stage({ x: [-6, 6], y: [0, 5], axes: 'box', gutter: true, height: 230, xlabel: 'x', ylabel: 't', title: 'space–time', minWidth: 280 });
        const hP = D.handle(-1.5, 1, { color: 'accent', r: 6, constrain: (x, y) => [M.clamp(x, -4.5, 4.5), M.clamp(y, 0.1, 1.6)], label: 'pluck' });
        const hS = D.handle(1.8, 0.6, { color: 'orange', r: 6, constrain: (x, y) => [M.clamp(x, -4.5, 4.5), M.clamp(y, 0.1, 1.6)], label: 'strike' });
        let info = null;
        v.animate((t) => {
          const m = mode.value, c = cS.value, hp = hP.y, xp = hP.x, wp = wP.value, hs = hS.y, xs = hS.x, ws = wS.value;
          const pl = m !== 'strike', st = m !== 'pluck';
          hP.visible = pl; hS.visible = st;
          const phi = (x) => (pl ? Math.max(0, hp * (1 - Math.abs(x - xp) / wp)) : 0);
          const psi = (x) => (st && Math.abs(x - xs) <= ws ? hs : 0);
          const u = dAlembert(phi, psi, c, -60, 60, 6000);
          const cum = (x) => (st ? hs * M.clamp(x - (xs - ws), 0, 2 * ws) : 0);
          D.fn(phi, { color: 'accent', width: 2.6, n: 800 }); D.fn(psi, { color: 'orange', width: 2.6, n: 800 });
          D.vband(-c * t, c * t, { color: 'ink', alpha: 0.05 });
          U.fn((x) => 0.5 * phi(x + c * t), { color: 'accent', width: 1.6, alpha: 0.7, dash: [6, 4], n: 800 });
          U.fn((x) => 0.5 * phi(x - c * t), { color: 'accent', width: 1.6, alpha: 0.7, dash: [6, 4], n: 800 });
          U.fn((x) => (cum(x + c * t) - cum(x - c * t)) / (2 * c), { color: 'orange', width: 1.4, fill: true, fillAlpha: 0.18, n: 800 });
          U.fn((x) => u(x, t), { color: 'ink', width: 3, n: 800 });
          U.corner(`t = ${v.fix(t, 2)}`, 'tr', { color: 'ink', weight: 600 });
          const key = `${m}|${c}|${hp.toFixed(3)}|${xp.toFixed(3)}|${wp}|${hs.toFixed(3)}|${xs.toFixed(3)}|${ws}`;
          ST.heat((x, y) => M.clamp(u(x, y) / 1.2, -1, 1), { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key });
          for (const [x0, col] of [[xp, 'accent'], [xs, 'orange']]) { if ((col === 'accent' && !pl) || (col === 'orange' && !st)) continue; ST.line(x0, 0, x0 + c * 5, 5, { color: 'ink', alpha: 0.35, width: 1.2 }); ST.line(x0, 0, x0 - c * 5, 5, { color: 'ink', alpha: 0.35, width: 1.2 }); }
          ST.hline(t, { color: 'ink', width: 1.6, dash: [6, 4] });
          // independent finite-difference solution on [-14, 14] (Courant number 0.8)
          const W = makeWave(1400, 28, c, 0.8, (x) => phi(x - 14), (x) => psi(x - 14));
          while (W.t + W.dt <= t + 1e-12) W.step();
          let err = 0, mx = 0;
          for (let i = 0; i <= W.N; i++) { const x = i * W.dx - 14; if (Math.abs(x) > 8) continue; err = Math.max(err, Math.abs(W.u[i] - u(x, W.t))); mx = Math.max(mx, Math.abs(u(x, W.t))); }
          info = { err, mx, t, tn: W.t };
        }, { period: 5, still: 2.5 });
        v.legend([['accent', '$\\tfrac12\\varphi(x\\pm ct)$', { dash: true }], ['orange', '$\\tfrac1{2c}\\int\\psi$', { area: true }], ['ink', '$u$']]);
        v.readout(() => info && `at $t=${v.fix(info.t, 2)}$: largest $|u|=${v.fix(info.mx, 3)}$ · finite-difference solution of $u_{tt}=c^2u_{xx}$ vs formula: $\\max|u_{\\rm num}-u|=${v.sci(Math.max(info.err, 1e-12), 2)}$ (the scheme is only first-order accurate at kinks and jumps, so a small residue there is expected)`);
      },
    },
    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Theorem',
      name: 'Domain of dependence and region of influence',
      statement: String.raw`For the initial-value problem of 2.2, the value $u(x_0,t_0)$ (with $t_0>0$) depends only on the data on the interval $[x_0-ct_0,\,x_0+ct_0]$ of the line $t=0$ (its *domain of dependence*, the base of the backward characteristic triangle): if two pairs of data agree there, the two solutions agree at $(x_0,t_0)$. Dually, data supported in $[a,b]$ influence $u$ only in the *region of influence* $\{(x,t):a-ct\le x\le b+ct,\ t\ge0\}$, a cone widening at speed $c$. Signals travel at speed at most $c$.`,
      idea: String.raw`In d'Alembert's formula (2.2) the point $(x_0,t_0)$ sees $\varphi$ only at the two endpoints $x_0\pm ct_0$ and $\psi$ only through its integral over the interval between them. Changing the data outside the interval therefore changes nothing; by linearity the effect of a perturbation of the data is itself a solution, which is nonzero only where its own backward triangle meets the support.`,
      caption: String.raw`Drag the green point $P=(x_0,t_0)$: its backward triangle (green) has base $[x_0-ct_0,x_0+ct_0]$ on the initial line. The colours show the *change* $\Delta u$ caused by adding a bump to $\varphi$ at the orange handle (slide it along the line, change its height); the orange lines bound the bump’s region of influence. As long as the bump’s support stays outside the base, $\Delta u(x_0,t_0)$ is exactly zero; push it inside and the point feels it. Change $c$ to widen or narrow both cones.`,
      deps: ['pde-2.2'],
      refs: ['Strauss §2.2'],
      tags: ['finite speed', 'causality', 'characteristics'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Domain_of_dependence' },
      viz(v) {
        const M = v.M, WB = 0.6;
        const cS = v.slider('$c$', 0.5, 2, 1, { step: 0.05 });
        const aS = v.slider('bump height $A$', -1.2, 1.2, 0.9, { step: 0.05 });
        const phi0 = (x) => 0.8 * Math.exp(-(((x + 2.5) / 0.8) ** 2)) + 0.5 * Math.exp(-(((x - 2) / 0.6) ** 2));
        const D = v.stage({ x: [-7, 7], y: [-1.4, 2.7], axes: 'box', gutter: true, height: 300, xlabel: 'x', title: 'initial position $\\varphi$ (with and without the bump)', minWidth: 300 });
        const ST = v.stage({ x: [-7, 7], y: [0, 4.5], axes: 'box', gutter: true, height: 300, xlabel: 'x', ylabel: 't', title: 'change $\\Delta u$ caused by the bump', minWidth: 300 });
        const P = ST.handle(0.5, 2.2, { color: 'green', r: 7, label: 'P', constrain: (x, y) => [M.clamp(x, -6.5, 6.5), M.clamp(y, 0.3, 4.3)] });
        const Q = D.handle(-3.5, 2.0, { color: 'orange', r: 7, label: 'bump', constrain: (x) => [M.clamp(x, -6.4, 6.4), 2.0] });
        const bump = (p, A) => (x) => (Math.abs(x - p) < WB ? A * Math.cos((Math.PI * (x - p)) / (2 * WB)) ** 2 : 0);
        v.render(() => {
          const c = cS.value, A = aS.value, p = Q.x, x0 = P.x, t0 = P.y, eta = bump(p, A);
          const du = (x, t) => 0.5 * (eta(x + c * t) + eta(x - c * t));
          D.fn(phi0, { color: 'muted', width: 1.8, dash: [6, 4], n: 800 });
          D.fn((x) => phi0(x) + eta(x), { color: 'accent', width: 2.6, n: 800 });
          D.vband(x0 - c * t0, x0 + c * t0, { color: 'green', alpha: 0.16 });
          D.vline(x0 - c * t0, { color: 'green', width: 1.5 }); D.vline(x0 + c * t0, { color: 'green', width: 1.5 });
          ST.heat((x, y) => M.clamp(du(x, y) / Math.max(0.3, Math.abs(A)), -1, 1), { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key: `${c}|${A}|${p.toFixed(3)}` });
          ST.poly([[x0 - c * t0, 0], [x0 + c * t0, 0], [x0, t0]], { fill: 'green', fillAlpha: 0.22, color: 'green', width: 2 });
          ST.line(p - WB, 0, p - WB - c * 4.5, 4.5, { color: 'orange', width: 1.6, dash: [6, 4] });
          ST.line(p + WB, 0, p + WB + c * 4.5, 4.5, { color: 'orange', width: 1.6, dash: [6, 4] });
          ST.line(p - WB, 0, p - WB + c * 4.5, 4.5, { color: 'orange', width: 1.6, dash: [6, 4] });
          ST.line(p + WB, 0, p + WB - c * 4.5, 4.5, { color: 'orange', width: 1.6, dash: [6, 4] });
          ST.segment([p - WB, 0], [p + WB, 0], { color: 'orange', width: 4 });
        });
        v.legend([['green', 'domain of dependence of $P$'], ['orange', 'region of influence of the bump', { dash: true }], ['accent', '$\\varphi$ + bump']]);
        v.readout(() => {
          const c = cS.value, A = aS.value, p = Q.x, x0 = P.x, t0 = P.y;
          const eta = bump(p, A), d = 0.5 * (eta(x0 + c * t0) + eta(x0 - c * t0));
          const dist = Math.abs(p - x0), reach = c * t0 + WB;
          return `$P=(${v.fix(x0, 2)},\\,${v.fix(t0, 2)})$, base $[${v.fix(x0 - c * t0, 2)},\\,${v.fix(x0 + c * t0, 2)}]$ · bump support $[${v.fix(p - WB, 2)},\\,${v.fix(p + WB, 2)}]$ · distance $|p-x_0|=${v.fix(dist, 2)}$ vs $ct_0+${WB}=${v.fix(reach, 2)}$\n$\\Delta u(x_0,t_0)=${v.fix(d, 4)}$ — ${dist >= reach ? 'the bump lies outside the domain of dependence, so $u(x_0,t_0)$ is unchanged (exactly zero)' : 'the bump meets the domain of dependence, so $P$ feels it'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Theorem',
      name: 'Conservation of energy for the wave equation',
      statement: String.raw`Let $u$ be a $C^2$ solution of $u_{tt}=c^2u_{xx}$ on an interval $[0,\ell]$ with fixed ends $u(0,t)=u(\ell,t)=0$ (or on $\R$ with $u,u_t,u_x$ vanishing fast enough at infinity). The energy
$$E(t)=\tfrac12\int\big(u_t^2+c^2u_x^2\big)\,dx$$
is constant in time: $E(t)=E(0)$. Here $\tfrac12u_t^2$ is the kinetic and $\tfrac12c^2u_x^2$ the potential energy (per unit density) of the string; individually they are not conserved, they exchange energy.`,
      idea: String.raw`Differentiate under the integral: $E'(t)=\int(u_tu_{tt}+c^2u_xu_{xt})\,dx$. Integrate the second term by parts (the boundary term $c^2u_xu_t$ vanishes because $u_t=0$ at fixed ends), giving $E'(t)=\int u_t\,(u_{tt}-c^2u_{xx})\,dx=0$ by the equation. The proof uses only the equation and the boundary condition, never the explicit solution, which is why the same argument works for sources, variable coefficients and numerical schemes.`,
      caption: String.raw`A string with fixed ends is solved by the leapfrog scheme (second differences in $x$ and $t$). The top panel shows the shape; below it the kinetic density (orange) and potential density (blue) sloshing back and forth; the right panel records $E_k$, $E_p$ and their sum $E$ in time. Try *standing mode*, *plucked*, and a *pulse*; the sum stays flat. At $\nu=1$ the scheme reproduces d’Alembert’s solution exactly; lower the Courant number $\nu=c\Delta t/\Delta x$ and ripples appear behind every kink (numerical dispersion) while the energy test still passes. Push $\nu$ above 1, where the scheme leaves its stability region: the discrete energy still obeys its own conservation law but it is no longer positive, and $u$ blows up.`,
      deps: ['pde-2.1'],
      refs: ['Strauss §2.2'],
      tags: ['energy', 'conservation', 'integration by parts'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave_equation' },
      viz(v) {
        const N = 200, L = 1, c = 1, TT = 4;
        const modeSel = v.select('initial state', [{ value: 'mode', label: 'standing mode' }, { value: 'pluck', label: 'plucked, at rest' }, { value: 'pulse', label: 'right-moving pulse' }], 'pluck', { onChange: () => S.reset() });
        const nS = v.slider('mode number $n$', 1, 5, 2, { int: true, onChange: () => S.reset() });
        const nuS = v.slider('$\\nu=c\\Delta t/\\Delta x$', 0.3, 1.2, 1, { step: 0.01, onChange: () => S.reset() });
        const data = () => {
          if (modeSel.value === 'mode') { const n = nS.value; return [(x) => 0.3 * Math.sin(n * Math.PI * x), () => 0]; }
          if (modeSel.value === 'pluck') return [(x) => (x < 0.3 ? 0.3 * (x / 0.3) : 0.3 * ((1 - x) / 0.7)), () => 0];
          const w = 0.06, p = (x) => 0.4 * Math.exp(-(((x - 0.3) / w) ** 2));
          return [p, (x) => (c * p(x) * 2 * (x - 0.3)) / (w * w)];
        };
        const S = v.sim(() => { const [f, g] = data(), W = makeWave(N, L, c, nuS.value, f, g), e = W.energy(); return { W, acc: 0, E0: e.e, h: { t: [0], k: [e.k], p: [e.p], e: [e.e] }, dmax: null }; }, (st, dt) => {
          st.acc += dt; let guard = 0;
          while (st.W.t + st.W.dt <= st.acc + 1e-12 && guard++ < 400) { st.W.step(); const e = st.W.energy(); st.h.t.push(st.W.t); st.h.k.push(e.k); st.h.p.push(e.p); st.h.e.push(e.e); }
        }, { dt: 0.004, maxSteps: 4000 });
        const A = v.stage({ x: [0, L], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 190, xlabel: 'x', title: 'the string $u(x,t)$', minWidth: 300 });
        const B = v.stage({ x: [0, L], y: [0, 1], axes: 'box', gutter: true, height: 190, xlabel: 'x', title: 'energy densities: kinetic $\\tfrac12u_t^2$, potential $\\tfrac12c^2u_x^2$', minWidth: 300 });
        const C = v.stage({ x: [0, TT], y: [0, 1.3], axes: 'box', gutter: true, height: 230, xlabel: 't', title: 'energies relative to $E(0)$', minWidth: 300, full: true });
        let info = null, ymax = 1;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, W = st.W, dx = W.dx, dt = W.dt;
          nS.el.hidden = modeSel.value !== 'mode';
          const xs = [], ek = [], ep = [];
          for (let i = 0; i <= N; i++) {
            const vel = (W.u[i] - W.uo[i]) / dt, il = Math.max(i - 1, 0), ir = Math.min(i, N - 1);
            const pe = (j) => 0.5 * c * c * ((W.u[j + 1] - W.u[j]) / dx) * ((W.uo[j + 1] - W.uo[j]) / dx);
            ek.push(0.5 * vel * vel); ep.push(0.5 * (pe(il) + pe(ir))); xs.push(i * dx);
          }
          if (st.dmax == null) st.dmax = Math.max(1e-9, ...ek.map((a, i) => a + ep[i]));
          A.fn((x) => { const q = x / dx, i = Math.min(N - 1, Math.floor(q)), r = q - i; return W.u[i] * (1 - r) + W.u[i + 1] * r; }, { color: 'ink', width: 2.8, n: N });
          B.setView([0, L], [0, 1.15 * st.dmax * 1.0]);
          const base = (arr) => [[0, 0], ...xs.map((x, i) => [x, Math.max(0, Math.min(arr[i], 1e3 * st.dmax))]), [L, 0]];
          B.poly(base(ek.map((a, i) => a + ep[i])), { fill: 'accent', fillAlpha: 0.25, color: 'accent', width: 1.6 });
          B.poly(base(ek), { fill: 'orange', fillAlpha: 0.35, color: 'orange', width: 1.6 });
          const E0 = st.E0 || 1, h = st.h;
          const clampY = (a) => Math.min(a / E0, 1.28);
          C.path(h.t.map((t2, i) => [t2, clampY(h.k[i])]), { color: 'orange', width: 2 });
          C.path(h.t.map((t2, i) => [t2, clampY(h.p[i])]), { color: 'accent', width: 2 });
          C.path(h.t.map((t2, i) => [t2, clampY(h.e[i])]), { color: 'ink', width: 3 });
          C.hline(1, { color: 'green', width: 1.2, dash: [6, 4] });
          let dr = 0; for (const e of h.e) dr = Math.max(dr, Math.abs(e / E0 - 1));
          const e = W.energy();
          info = { t: W.t, k: e.k / E0, p: e.p / E0, e: e.e / E0, dr, umax: Math.max(...Array.from(W.u, Math.abs)), nu: nuS.value };
        }, { period: TT, still: 2.4 });
        v.legend([['orange', 'kinetic'], ['accent', 'potential'], ['ink', 'total $E$'], ['green', '$E(0)$', { dash: true }]]);
        v.readout(() => info && `$t=${v.fix(info.t, 2)}$: $E_k/E_0=${v.fix(info.k, 3)}$, $E_p/E_0=${v.fix(info.p, 3)}$, sum $=${v.fix(info.e, 6)}$ · largest drift of $E$ so far: $${v.sci(Math.max(info.dr, 1e-16), 2)}$ · $\\max|u|=${v.sci(info.umax, 2)}$` + (info.nu > 1 ? ` · $\\nu>1$: the scheme is unstable (no discrete energy bound), the energy test fails` : ''));
      },
    },
  ],
};
