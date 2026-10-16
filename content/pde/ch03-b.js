// Partial Differential Equations — Chapter 3: The diffusion equation (part b: 3.6–3.10)
import { makeHeat, spline, log10Box, convolveQuad, dAlembert } from './ch03.shared.js';

export default {
  collection: 'pde',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Phenomenon',
      name: 'Infinite speed of propagation',
      statement: String.raw`Let $g\ge0$ be bounded, continuous and not identically zero. Then the solution $u=\Phi(\cdot,t)*g$ of $u_t=ku_{xx}$ satisfies $u(x,t)>0$ for **every** $x\in\R$ and **every** $t>0$: a disturbance is felt everywhere at once. For example, for $g=\mathbf 1_{[-a,a]}$,
$$u(x,t)=\tfrac12\Big[\operatorname{erf}\tfrac{x+a}{2\sqrt{kt}}-\operatorname{erf}\tfrac{x-a}{2\sqrt{kt}}\Big]\approx\frac{\sqrt{kt}}{\sqrt\pi\,|x|}\,e^{-(|x|-a)^2/(4kt)}\ \ (|x|\gg a),$$
which is positive but super-exponentially small far away. The wave equation with the same data has $u\equiv0$ for $|x|>a+ct$.`,
      idea: String.raw`The kernel $\Phi(x-y,t)$ is strictly positive for all $x,y$, so the integral of a nonnegative, nonzero $g$ against it cannot vanish. The size of the tail is governed by the exponent $-(|x|-a)^2/(4kt)$: for a fixed threshold the arrival time grows like $x^2$, not like $x$, so there is no propagation *speed* at all. This is an artefact of the model that ignores finite molecular speeds; the tail is irrelevant physically, but mathematically the equation has no domain of dependence of the wave type (compare 2.3).`,
      caption: String.raw`A bar with diffusivity $k=\tfrac12$ is heated on $[-a,a]$ at $t=0$. Left: $u(x,t)$ on a **logarithmic** scale (blue). The red dashed lines are the wave front $x=\pm(a+ct)$ of the wave equation with the same data and $c=1$; the red steps are that solution, which is exactly zero outside (off the picture). Right: the temperature at the probe $x_0$ against time, and the time $t^*$ at which it first reaches the threshold $\theta$ (green); the wave equation would deliver the full jump at $t=(x_0-a)/c$ (red). Pull $\theta$ down to $10^{-30}$: heat arrives at every $x_0$ almost immediately, and $t^*\propto x_0^2$ for large $x_0$.`,
      deps: ['pde-3.4'],
      refs: ['Evans §2.3'],
      tags: ['propagation speed', 'heat equation', 'Gaussian tails'],
      scope: String.raw`Holds for the heat equation on $\R$ (or on any domain, by the strong maximum principle); real heat conduction has a finite (molecular) speed that the model neglects.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_equation' },
      viz(v) {
        const M = v.M, k = 0.5, c = 1;
        const tS = v.slider('time $t$', 0.01, 10, 1, { log: true });
        const aS = v.slider('half-width $a$', 0.3, 2, 1, { step: 0.05 });
        const xS = v.slider('probe $x_0$', 2, 12, 6, { step: 0.1 });
        const thS = v.slider('threshold $\\theta$', 1e-30, 1e-2, 1e-8, { log: true, fmt: (z) => z.toExponential(0) });
        const P1 = v.stage({ x: [-14, 14], y: [1e-40, 3], ylog: true, axes: 'box', gutter: true, height: 260, xlabel: 'x', title: 'temperature $u(x,t)$ (log scale)', minWidth: 300 });
        const P2 = v.stage({ x: [0.01, 100], y: [1e-40, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 260, xlabel: 't', title: 'temperature at the probe $x_0$', minWidth: 300 });
        let info = null;
        v.render(() => {
          const t = tS.value, a = aS.value, x0 = xS.value, th = thS.value, lth = Math.log10(th);
          const L = (x, tt) => log10Box(x, tt, a, k);
          P1.fn((x) => Math.pow(10, L(x, t)), { color: 'accent', width: 3, n: 500 });
          const front = a + c * t;
          P1.vline(front, { color: 'red', width: 1.5, dash: [5, 4] }); P1.vline(-front, { color: 'red', width: 1.5, dash: [5, 4] });
          const wave = (x) => 0.5 * ((Math.abs(x + c * t) < a ? 1 : 0) + (Math.abs(x - c * t) < a ? 1 : 0)) || NaN;
          P1.fn(wave, { color: 'red', width: 2.6, n: 800 });
          P1.dot(x0, Math.pow(10, Math.max(-39, L(x0, t))), { color: 'gold', r: 5.5, label: 'x₀', labelPos: 'ne' });
          const ts = M.range(160).map((i) => 0.01 * Math.pow(1e4, i / 159));
          P2.path(ts.map((tt) => [tt, Math.pow(10, Math.max(-39.9, L(x0, tt)))]), { color: 'accent', width: 3 });
          P2.hline(th, { color: 'green', width: 1.5, dash: [5, 4] });
          const tw = (x0 - a) / c;
          if (tw >= 0.01 && tw <= 100) P2.vline(tw, { color: 'red', width: 1.8, dash: [5, 4] });
          P2.vline(t, { color: 'gold', width: 1.2 });
          // first crossing of the threshold
          let tstar = NaN, prev = ts[0];
          for (let i = 0; i < ts.length; i++) { if (L(x0, ts[i]) >= lth) { const lo = i ? ts[i - 1] : 1e-4; tstar = M.bisect((tt) => L(x0, tt) - lth, Math.min(lo, ts[i]) * 0.5, ts[i], 1e-9); break; } prev = ts[i]; }
          if (!(tstar >= 0.01 && tstar <= 100)) { /* off the plotted range */ } else P2.dot(tstar, th, { color: 'green', r: 6 });
          info = { t, L: L(x0, t), tstar, tw, x0, front, far: L(front + 3, t), lth };
        });
        v.legend([['accent', 'heat equation'], ['red', 'wave equation, same data'], ['green', 'threshold crossing']]);
        v.readout(() => info && `$u(x_0,t)=10^{${v.fix(info.L, 1)}}$ at $x_0=${v.fix(info.x0, 1)}$ — positive, though $x_0$ is ${info.x0 > info.front ? 'outside' : 'inside'} the wave cone $|x|\\le a+ct=${v.fix(info.front, 2)}$; three units beyond the front: $10^{${v.fix(info.far, 1)}}>0$\n` +
          `heat first exceeds $\\theta=10^{${v.fix(info.lth, 0)}}$ at $t^*=${isNaN(info.tstar) ? '\\text{(outside the plotted range)}' : v.sci(info.tstar, 3)}$; the wave arrives at $t=${v.fix(info.tw, 2)}$ and not before`);
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Concept',
      name: 'Waves versus diffusions',
      statement: String.raw`Compare $u_{tt}=c^2u_{xx}$ with $u_t=ku_{xx}$ on the line:
- *propagation*: waves have finite speed and a domain of dependence (2.3); diffusion reaches every point at once (3.6);
- *singularities*: waves carry singularities along characteristics (2.6); diffusion smooths them instantly (3.5);
- *energy*: waves conserve $\tfrac12\!\int(u_t^2+c^2u_x^2)$ (2.4); diffusion dissipates $\int u^2$, with $\tfrac{d}{dt}\int u^2=-2k\int u_x^2$;
- *maximum principle*: diffusion obeys it (3.1); waves do not (data with velocity can make $|u|$ larger than $\max|\varphi|$);
- *reversibility*: waves are time-reversible ($t\mapsto-t$ is again a solution); diffusion is not, and the backward problem is ill posed (3.13).`,
      idea: String.raw`All five differences come from the sign of one term: $\partial_t^2-c^2\partial_x^2$ is hyperbolic with real characteristics $x\pm ct=$const, which carry information at finite speed and conserve energy, while $\partial_t-k\partial_x^2$ is parabolic with the single characteristic direction $t=$const and the symbol $e^{-k\xi^2t}$ (real, decaying) in place of $e^{\pm ic\xi t}$ (oscillating, modulus one). In Fourier space the wave multiplies each frequency by a phase, the heat equation by a damping factor: phases can be undone, dampings cannot.`,
      caption: String.raw`Drag the two gold handles to set the heights of two triangular bumps (compact data with kinks) and set the wave speed and the initial velocity (kick $\psi=\psi_0\varphi$). Left: the wave solution (d'Alembert); right: the heat solution (convolution), both at time $t$; the lower panel redraws both on a log scale of $|u|$, where the heat tail beyond the cone $|x|\le x_s+ct$ is visible. The readout evaluates the five criteria numerically at time $t$ and prints the verdict for each equation.`,
      deps: ['pde-2.3', 'pde-3.6', 'pde-3.5'],
      refs: ['Strauss §2.5'],
      tags: ['hyperbolic', 'parabolic', 'comparison'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Parabolic_partial_differential_equation' },
      viz(v) {
        const M = v.M, k = 0.1, hw = 0.8, XL = 9;
        const cS = v.slider('wave speed $c$', 0.3, 2, 1, { step: 0.05 });
        const psS = v.slider('wave kick $\\psi_0$', 0, 1.5, 0, { step: 0.05 });
        const tS = v.slider('time $t$', 0.05, 3, 1.5, { step: 0.05 });
        const P1 = v.stage({ x: [-XL, XL], y: [-0.8, 1.6], axes: 'box', gutter: true, height: 210, xlabel: 'x', title: 'wave equation', minWidth: 300 });
        const P2 = v.stage({ x: [-XL, XL], y: [-0.8, 1.6], axes: 'box', gutter: true, height: 210, xlabel: 'x', title: 'heat equation', minWidth: 300 });
        const P3 = v.stage({ x: [-XL, XL], y: [1e-30, 3], ylog: true, axes: 'box', gutter: true, height: 210, xlabel: 'x', title: '$|u|$ on a log scale (both)', minWidth: 300, full: true });
        const hA = P1.handle(-2.5, 1, { color: 'gold', r: 7, label: 'A', constrain: (x, y) => [M.clamp(x, -4, -0.8), M.clamp(y, 0.2, 1.5)] });
        const hB = P1.handle(2, 0.7, { color: 'gold', r: 7, label: 'B', constrain: (x, y) => [M.clamp(x, 0.8, 4), M.clamp(y, 0.2, 1.5)] });
        const tri = (x0, h) => (x) => Math.max(0, h * (1 - Math.abs(x - x0) / hw));
        let info = null, dA = null, dKey = '';
        v.render(() => {
          const c = cS.value, t = tS.value, ps0 = psS.value;
          const phi = (x) => tri(hA.x, hA.y)(x) + tri(hB.x, hB.y)(x), psi = (x) => ps0 * phi(x);
          const key = [hA.x, hA.y, hB.x, hB.y, c, ps0].join('|');
          if (key !== dKey) { dA = dAlembert(phi, psi, c, -40, 40, 6000); dKey = key; }
          const uw = (x, tt) => dA(x, tt), uh = (x, tt) => convolveQuad(phi, -5, 5, x, tt, k, 500);
          P1.fn(phi, { color: 'faint', width: 2.4 }); P2.fn(phi, { color: 'faint', width: 2.4 });
          P1.fn((x) => uw(x, t), { color: 'accent', width: 3, n: 500 }); P2.fn((x) => uh(x, t), { color: 'orange', width: 3, n: 160 });
          const xs = Math.max(hA.x, hB.x) + hw, xl = Math.min(hA.x, hB.x) - hw, cone = c * t;
          for (const S of [P1, P2]) { S.vline(xs + cone, { color: 'red', width: 1.2, dash: [5, 4] }); S.vline(xl - cone, { color: 'red', width: 1.2, dash: [5, 4] }); }
          P3.fn((x) => { const z = Math.abs(uw(x, t)); return z > 1e-300 ? z : NaN; }, { color: 'accent', width: 2.6, n: 900 });
          P3.fn((x) => { const z = Math.abs(uh(x, t)); return z > 1e-300 ? z : NaN; }, { color: 'orange', width: 2.6, n: 160 });
          P3.vline(xs + cone, { color: 'red', width: 1.2, dash: [5, 4] }); P3.vline(xl - cone, { color: 'red', width: 1.2, dash: [5, 4] });
          // criteria
          const grid = M.range(361).map((i) => -XL + (2 * XL * i) / 360);
          const outside = (f) => { let m = 0; for (const x of grid) if (x > xs + cone + 0.3 || x < xl - cone - 0.3) m = Math.max(m, Math.abs(f(x))); return m; };
          const sharp = (f, e) => { let m = 0; for (const x of grid) m = Math.max(m, Math.abs(f(x + e) - 2 * f(x) + f(x - e)) / e); return m; };
          const e = 0.06, s0 = sharp(phi, e);
          const mxw = Math.max(...grid.map((x) => uw(x, t))), mxh = Math.max(...grid.map((x) => uh(x, t))), mx0 = Math.max(...grid.map(phi));
          const dphi = (x) => ((Math.abs(x - hA.x) < hw ? -Math.sign(x - hA.x) * hA.y / hw : 0) + (Math.abs(x - hB.x) < hw ? -Math.sign(x - hB.x) * hB.y / hw : 0));
          const Ew = (tt) => { // exact u_t, u_x from d'Alembert's formula, midpoint rule
            let s = 0; const dx = 0.005;
            for (let x = -XL + dx / 2; x < XL; x += dx) {
              const p = x + c * tt, m = x - c * tt;
              const ut = 0.5 * c * (dphi(p) - dphi(m)) + 0.5 * (psi(p) + psi(m)), ux = 0.5 * (dphi(p) + dphi(m)) + (psi(p) - psi(m)) / (2 * c);
              s += 0.5 * (ut * ut + c * c * ux * ux) * dx;
            }
            return s;
          };
          let L2h = 0, L2h0 = 0; for (const x of grid) { L2h += uh(x, t) ** 2 * (2 * XL / 360); L2h0 += phi(x) ** 2 * (2 * XL / 360); }
          info = { ow: outside((x) => uw(x, t)), oh: outside((x) => uh(x, t)), sw: sharp((x) => uw(x, t), e) / s0, sh: sharp((x) => uh(x, t), e) / s0, E0: Ew(0), Et: Ew(t), L2h, L2h0, mxw, mxh, mx0, kap: 6, ampH: Math.exp(k * 36 * t), cone };
        });
        v.legend([['accent', 'wave'], ['orange', 'heat'], ['red', 'edge of the wave cone', { dash: true }]]);
        v.readout(() => info && `finite speed — outside the cone, $\\max|u|$: wave ${info.ow < 1e-12 ? '$0$ ✓' : `$${v.sci(info.ow, 2)}$`} · heat $${v.sci(info.oh, 2)}$ ${info.oh > 1e-300 ? '(positive: no finite speed)' : ''}\n` +
          `kinks — sharpness of the data kept: wave ${v.fix(info.sw, 2)} · heat ${v.fix(info.sh, 2)} (1 = unchanged)\n` +
          `energy — wave $E(t)/E(0)=${v.fix(info.Et / info.E0, 4)}$ (conserved) · heat $\\int u^2$ falls to ${v.fix(info.L2h / info.L2h0, 3)} of its initial value\n` +
          `maximum principle — $\\max u/\\max\\varphi$: wave ${v.fix(info.mxw / info.mx0, 3)}${info.mxw > info.mx0 * 1.0005 ? ' (exceeds 1: fails)' : ''} · heat ${v.fix(info.mxh / info.mx0, 3)} (≤ 1)\n` +
          `reversibility — a ripple of wavenumber 6 added at time $t$ is amplified by $\\le1$ when run backwards for the wave equation, but by $e^{k\\cdot36\\,t}=${v.fix(info.ampH, 2)}$ for the heat equation (and by $e^{kn^2t}$ in general)`);
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Method',
      name: 'Diffusion on the half-line by reflection',
      statement: String.raw`For $u_t=ku_{xx}$ on $0<x<\infty$, $t>0$, $u(x,0)=\varphi(x)$ ($\varphi$ bounded, continuous):
(a) with the Dirichlet condition $u(0,t)=0$, extend $\varphi$ to an odd function $\varphi_{\rm odd}(-x)=-\varphi(x)$;
(b) with the Neumann condition $u_x(0,t)=0$, extend it to an even function $\varphi_{\rm even}(-x)=\varphi(x)$.
Solve on the whole line by 3.4 and restrict to $x>0$. Explicitly
$$u(x,t)=\int_0^\infty\big[\Phi(x-y,t)\mp\Phi(x+y,t)\big]\varphi(y)\,dy,$$
with the minus sign for Dirichlet and the plus sign for Neumann. (For Dirichlet data one needs $\varphi(0)=0$ for $u$ to be continuous at the corner.)`,
      idea: String.raw`The heat equation is invariant under $x\mapsto-x$, so the solution of an odd (even) datum stays odd (even) by uniqueness (3.2); an odd continuous function vanishes at $0$, and an even differentiable one has zero derivative there. The restriction to $x>0$ therefore satisfies the boundary condition and the initial condition, and by uniqueness it is the solution. The same method with waves (2.7) reflects a pulse; here the mirror image diffuses into the half-line, subtracting (Dirichlet: the wall is a perfect sink) or adding (Neumann: an insulating wall bounces heat back).`,
      caption: String.raw`Shape the initial temperature on $x>0$ with the handles (the leftmost one is the value at the wall). The dashed light curve on $x<0$ is the odd or even mirror image; the solution is computed on the whole line by the kernel formula and the solid blue part is the physical half-line. Right: the boundary quantity $u(0,t)$ (Dirichlet) or $u_x(0,t)$ (Neumann), which stays zero, and the fraction of the initial heat $\int_0^\infty u$ still in the half-line: conserved for Neumann, lost through the wall for Dirichlet. The readout also compares with an independent finite-difference solution on $[0,8]$.`,
      deps: ['pde-3.4', 'pde-1.6'],
      refs: ['Strauss §3.1'],
      tags: ['reflection', 'half-line', 'boundary conditions'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Method_of_images' },
      viz(v) {
        const M = v.M, k = 0.3, XR = 8;
        const bc = v.select('wall', [{ value: 'D', label: 'Dirichlet $u=0$ (odd)' }, { value: 'N', label: 'Neumann $u_x=0$ (even)' }], 'D');
        const tS = v.slider('time $t$', 0, 4, 0.5, { step: 0.02 });
        const P1 = v.stage({ x: [-6, 6], y: [-1.1, 1.3], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: 'extension of the data and solution', minWidth: 330 });
        const P2 = v.stage({ x: [0, 4], y: [-0.3, 1.2], axes: 'box', gutter: true, height: 250, xlabel: 't', title: 'wall value (blue), heat fraction (green)', minWidth: 280 });
        const px = [0, 0.7, 1.4, 2.1, 2.8, 3.5], py = [0.0, 0.8, 1.0, 0.4, 0.7, 0.0];
        const hs = px.map((x, i) => P1.handle(x, py[i], { color: 'orange', r: 6, constrain: (xx, y) => [x, M.clamp(y, -0.9, 1.2)] }));
        hs[5].visible = true;
        let info = null;
        v.render(() => {
          const t = tS.value, sgn = bc.value === 'D' ? -1 : 1;
          const phi = spline(px, hs.map((h) => h.y)), ph = (y) => (y < 0 || y > 3.5 ? 0 : phi(y));
          const ext = (y) => (y >= 0 ? ph(y) : sgn * ph(-y));
          const full = (x, tt) => (tt <= 0 ? ext(x) : convolveQuad(ext, -4.5, 4.5, x, tt, k, 700));
          P1.hband(-1.1, 1.3, { color: 'faint', alpha: 0.0 });
          P1.vline(0, { color: 'ink', width: 2.2 });
          P1.fn((x) => ext(x), { color: 'faint', width: 2.4, dash: [5, 4] });
          P1.fn((x) => full(x, t), { color: 'accent', width: 1.8, domain: [-6, 0], alpha: 0.45, dash: [4, 4] });
          P1.fn((x) => full(x, t), { color: 'accent', width: 3.2, domain: [0, 6] });
          P1.fn((x) => ph(x), { color: 'orange', width: 2, domain: [0, 6], alpha: 0.8 });
          // wall quantity and total heat vs time
          const ts = M.range(41).map((i) => (4 * i) / 40), h = 1e-3;
          const wall = ts.map((tt) => (bc.value === 'D' ? full(0, Math.max(tt, 1e-3)) : (full(h, Math.max(tt, 1e-3)) - full(-h, Math.max(tt, 1e-3))) / (2 * h)));
          const tot = (tt) => M.integrate((x) => full(x, tt), 0, XR, 120);
          const t00 = tot(1e-3), totals = ts.map((tt) => tot(Math.max(tt, 1e-3)) / t00);
          P2.path(ts.map((tt, i) => [tt, wall[i]]), { color: 'accent', width: 2.6 });
          P2.path(ts.map((tt, i) => [tt, totals[i]]), { color: 'green', width: 2.6 });
          P2.hline(0, { color: 'faint', width: 1 }); P2.vline(t, { color: 'gold', width: 1.2 });
          // finite-difference check on [0, 8]
          const Hh = makeHeat(320, 0, XR, k, { l: bc.value, r: 'D' });
          for (let i = 0; i <= 320; i++) Hh.u[i] = ph(Hh.x[i]);
          if (bc.value === 'D') Hh.u[0] = 0;
          Hh.rannacher(Math.max(t, 1e-6), 0.01);
          let dif = 0; for (let i = 8; i <= 320; i += 4) dif = Math.max(dif, Math.abs(Hh.u[i] - full(Hh.x[i], t)));
          const wallNow = bc.value === 'D' ? full(0, Math.max(t, 1e-4)) : (full(h, Math.max(t, 1e-4)) - full(-h, Math.max(t, 1e-4))) / (2 * h);
          info = { dif, wallNow, tot: tot(Math.max(t, 1e-4)), tot0: tot(1e-4), t };
        });
        v.legend([['orange', 'initial data'], ['accent', 'solution'], ['green', 'fraction of the initial heat left']]);
        v.readout(() => info && `${bc.value === 'D' ? '$u(0,t)$' : '$u_x(0,t)$'} $=${v.sci(Math.max(Math.abs(info.wallNow), 1e-16), 2)}$ (zero up to rounding) · total heat $${v.fix(info.tot, 4)}$ versus initial $${v.fix(info.tot0, 4)}$ · largest difference from finite differences on $[0,8]$: $${v.sci(Math.max(info.dif, 1e-16), 2)}$` + (bc.value === 'D' && Math.abs(hs[0].y) > 0.02 ? '\ndata at the wall are not zero: $\\varphi(0)\\neq0$ is incompatible with $u(0,t)=0$, so the solution is discontinuous at the corner $(0,0)$' : ''));
      },
    },
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Duhamel’s principle for diffusion with a source',
      statement: String.raw`Let $f$ be bounded and continuous with bounded continuous derivatives $f_x,f_{xx}$. The solution of
$$u_t=ku_{xx}+f(x,t),\quad u(x,0)=\varphi(x)\qquad(x\in\R,\ t>0)$$
that is bounded on bounded time intervals is
$$u(x,t)=\int_{\R}\Phi(x-y,t)\varphi(y)\,dy+\int_0^t\!\!\int_{\R}\Phi(x-y,t-s)\,f(y,s)\,dy\,ds .$$
Interpretation: at each time $s$ the source deposits the heat $f(\cdot,s)\,ds$, which then spreads freely for the time $t-s$; the solution is the sum of all these released packets.`,
      idea: String.raw`This is variation of constants (ode-3.12) with the semigroup $S(\tau)g=\Phi(\cdot,\tau)*g$ in place of $e^{\tau A}$: $u(t)=S(t)\varphi+\int_0^tS(t-s)f(s)\,ds$. One checks directly that $w(x,t;s)=S(t-s)f(\cdot,s)$ solves the homogeneous equation for $t>s$ with $w(\cdot,s;s)=f(\cdot,s)$, so $\partial_t\int_0^tw\,ds=w(x,t;t)+\int_0^t\partial_tw\,ds=f(x,t)+k\,\partial_x^2\!\int_0^tw\,ds$. Uniqueness comes from the maximum principle (3.2) applied to the difference.`,
      caption: String.raw`A Gaussian heater of width $w$ at position $y_0$ is switched on from $s_1$ to $s_2$ (drag the two gold handles in the left panel and the position handle in the right one), and we look at the temperature at time $T$ (slider), starting from zero. Each faint curve is the packet of heat released during one time slice and diffused for the remaining time $T-s$ (colour = release time, from blue to orange); their sum (heavy blue) is the Riemann sum of Duhamel's integral. The exact integral (black) and an independent finite-difference solution of the equation with the source (green dashes) agree with it.`,
      deps: ['pde-3.4', 'ode-3.12'],
      refs: ['Strauss §3.3'],
      tags: ['Duhamel', 'source', 'superposition'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Duhamel%27s_principle' },
      viz(v) {
        const M = v.M, k = 0.2, NS = 10, TM = 3;
        const wS = v.slider('heater width $w$', 0.15, 1, 0.4, { step: 0.01 });
        const TS = v.slider('observation time $T$', 0.2, TM, 2, { step: 0.02 });
        const P0 = v.stage({ x: [0, TM], y: [0, 1.4], axes: 'box', gutter: true, height: 200, xlabel: 's', title: 'heater on/off: $h(s)$', minWidth: 260 });
        const P1 = v.stage({ x: [-5, 5], y: [-0.1, 1.5], axes: 'box', gutter: true, height: 200, xlabel: 'x', title: 'temperature at time $T$ and the released packets', minWidth: 360 });
        const h1 = P0.handle(0.3, 1, { color: 'gold', r: 7, label: 's₁', constrain: (x) => [M.clamp(x, 0, h2.x - 0.1), 1] });
        const h2 = P0.handle(1.4, 1, { color: 'gold', r: 7, label: 's₂', constrain: (x) => [M.clamp(x, h1.x + 0.1, TM), 1] });
        const hy = P1.handle(0, 0, { color: 'orange', r: 7, label: 'y₀', constrain: (x) => [M.clamp(x, -3, 3), 0] });
        let info = null;
        v.render(() => {
          const w = wS.value, T = TS.value, s1 = h1.x, s2 = h2.x, y0 = hy.x, A = 1;
          P0.path([[0, 0], [s1, 0], [s1, 1], [s2, 1], [s2, 0], [TM, 0]], { color: 'orange', width: 2.8 });
          P0.vline(T, { color: 'gold', width: 1.4, dash: [4, 4] });
          // exact packet density: ∫ Φ(x−y, τ) A e^{−((y−y0)/w)²} dy = A w/√(w²+4kτ) e^{−(x−y0)²/(w²+4kτ)}
          const pk = (x, tau) => { const q = w * w + 4 * k * tau; return (A * w) / Math.sqrt(q) * Math.exp(-((x - y0) ** 2) / q); };
          const lo = s1, hi = Math.min(s2, T);
          const exact = (x) => (hi <= lo ? 0 : M.integrate((s) => pk(x, T - s), lo, hi, 200));
          const dsl = hi > lo ? (hi - lo) / NS : 0, slices = [];
          for (let j = 0; j < NS; j++) { const s = lo + (j + 0.5) * dsl; slices.push(s); }
          slices.forEach((s, j) => P1.fn((x) => dsl * pk(x, T - s), { color: v.mix('accent', 'orange', j / (NS - 1)), width: 1.6, alpha: 0.8 }));
          const riem = (x) => { let sum = 0; for (const s of slices) sum += dsl * pk(x, T - s); return sum; };
          let ymax = 0.05; for (let x = -5; x <= 5; x += 0.25) ymax = Math.max(ymax, exact(x));
          P1.setView([-5, 5], [-0.08 * ymax, 1.2 * ymax]);
          P1.fn(exact, { color: 'ink', width: 2.4 });
          P1.fn(riem, { color: 'accent', width: 3.6, alpha: 0.9 });
          const Hh = makeHeat(400, -8, 8, k, {});
          Hh.rannacher(T, 0.01, (x, t) => (t >= s1 && t <= s2 ? A * Math.exp(-(((x - y0) / w) ** 2)) : 0));
          P1.path(Array.from(Hh.x).map((x, i) => [x, Hh.u[i]]).filter((p) => Math.abs(p[0]) <= 5), { color: 'green', width: 2.2, dash: [6, 4] });
          let d1 = 0, d2 = 0; for (let x = -5; x <= 5; x += 0.1) { d1 = Math.max(d1, Math.abs(riem(x) - exact(x))); d2 = Math.max(d2, Math.abs(Hh.at(x) - exact(x))); }
          info = { d1, d2, peak: exact(y0), mass: M.integrate(exact, -9, 9, 400), expect: (hi - lo > 0 ? hi - lo : 0) * A * w * Math.sqrt(Math.PI) };
        });
        v.legend([['accent', 'Riemann sum of the packets'], ['ink', 'exact Duhamel integral'], ['green', 'finite differences', { dash: true }]]);
        v.readout(() => info && `largest difference at time $T$: Riemann sum ($${NS}$ slices) vs exact $${v.sci(Math.max(info.d1, 1e-16), 2)}$ · finite differences vs exact $${v.sci(Math.max(info.d2, 1e-16), 2)}$\nheat in the bar: $\\int u\\,dx=${v.fix(info.mass, 4)}$ = (heat released while the heater was on) $=${v.fix(info.expect, 4)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Theorem',
      name: 'Strong maximum principle for the heat equation',
      statement: String.raw`Let $U\subset\R^n$ be open, bounded and connected, $U_T=U\times(0,T]$, and let $u\in C^2_1(U_T)\cap C(\overline{U_T})$ solve $u_t=k\Delta u$ in $U_T$. If $u$ attains its maximum over $\overline{U_T}$ at a point $(x_0,t_0)\in U_T$ (an interior point, or a point of the top $t_0=T$), then $u$ is constant on $\overline{U}\times[0,t_0]$. Consequently, if the data are not constant, $u<\max_{\overline{U_T}}u$ at every point of $U\times(0,T]$: the maximum is *strictly* attained only on the parabolic boundary.`,
      idea: String.raw`One proves it with the mean-value property over heat balls (3.11): if $u(x_0,t_0)=M$ is the maximum, the weighted average of $u$ over a heat ball at $(x_0,t_0)$ equals $M$, so $u\equiv M$ on the whole ball, which reaches back in time; chaining balls covers $U\times[0,t_0]$ (the domain must be connected). Louis Nirenberg proved the analogue for general linear parabolic operators in 1953 by Hopf's method. In words: heat that is anywhere strictly below the maximum stays strictly below it, because a positive kernel mixes all the neighbouring values into every point.`,
      caption: String.raw`The sides of the bar are held at the temperature $s$ and the initial profile is below or equal to $1$; the colour map shows $\log_{10}(M-u)$, the gap to the global maximum $M$ (dark = the maximum is nearly touched). Pick *free data* (drag the handles), *plateau* ($\varphi\equiv1$ in the interior, sides at $s<1$: the maximum is touched on the bottom edge) or *constant* ($\varphi\equiv s=1$, the only way to touch the maximum inside). Even in the plateau case the gap is positive at every interior point for $t>0$ (right panel, log scale): it shrinks as $t\to0^+$ but never reaches $0$; only constant data give a gap of exactly $0$.`,
      deps: ['pde-3.1'],
      refs: ['Evans §2.3'],
      tags: ['maximum principle', 'heat equation'],
      credit: 'L. Nirenberg, 1953 (general parabolic operators)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_principle#Strong_maximum_principle' },
      viz(v) {
        const M = v.M, NX = 100, NT = 100, DT = 0.01, k = 0.2;
        const mode = v.select('data', [{ value: 'free', label: 'free data' }, { value: 'plateau', label: 'plateau' }, { value: 'const', label: 'constant' }], 'plateau');
        const sS = v.slider('side temperature $s$', 0, 1, 0.4, { step: 0.02 });
        const P0 = v.stage({ x: [0, 1], y: [0, 1.15], axes: 'box', gutter: true, height: 220, xlabel: 'x', title: 'initial temperature', minWidth: 240 });
        const P1 = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 220, xlabel: 'x', ylabel: 't', title: '$\\log_{10}(M-u)$', minWidth: 240 });
        const P2 = v.stage({ x: [0, 1], y: [1e-17, 2], ylog: true, axes: 'box', gutter: true, height: 220, xlabel: 't', title: 'gap $M-u$ at the interior points', minWidth: 240 });
        const xs = [0, 0.25, 0.5, 0.75, 1], ys = [0.6, 0.9, 1.0, 0.7, 0.5];
        const hs = xs.map((x, i) => P0.handle(x, ys[i], { color: 'orange', r: 6, constrain: (xx, y) => [x, M.clamp(y, 0, 1.1)] }));
        const probes = [0.1, 0.25, 0.5];
        let sol = null, info = null;
        v.render(() => {
          const md = mode.value, s = md === 'const' ? 1 : sS.value;
          hs.forEach((h) => { h.visible = md === 'free'; });
          sS.el.hidden = md === 'const';
          const spl = spline(xs, hs.map((h) => h.y));
          const phi = md === 'free' ? spl : md === 'plateau' ? () => 1 : () => 1;
          const key = [md, s, ...hs.map((h) => h.y.toFixed(4))].join('|');
          if (!sol || sol.key !== key) {
            const Hh = makeHeat(NX, 0, 1, k, { gl: () => s, gr: () => s });
            for (let i = 0; i <= NX; i++) Hh.u[i] = phi(Hh.x[i]);
            Hh.u[0] = s; Hh.u[NX] = s;
            const U = [Float64Array.from(Hh.u)];
            for (let n = 0; n < NT; n++) { Hh.step(DT); U.push(Float64Array.from(Hh.u)); }
            let mx = -Infinity; for (const r of U) for (const z of r) mx = Math.max(mx, z);
            let mg = Infinity, gi = 0, gn = 0;
            for (let n = 1; n <= NT; n++) for (let i = 1; i < NX; i++) { const g = mx - U[n][i]; if (g < mg) { mg = g; gi = i; gn = n; } }
            sol = { key, U, mx, mg, gi, gn };
          }
          const U = sol.U, mx = sol.mx;
          if (md === 'free') P0.fn(spl, { color: 'orange', width: 2.6 }); else P0.fn(phi, { color: 'orange', width: 2.6 });
          P0.hline(mx, { color: 'green', width: 1.2, dash: [5, 4] }); P0.text('M', 0.02, mx + 0.06, { color: 'green', size: 12, math: true });
          P1.heat((x, t) => {
            const q = M.clamp(x, 0, 1) * NX, i = Math.min(NX - 1, Math.floor(q)), r = q - i, tn = M.clamp(Math.round(t * NT), 0, NT);
            const val = U[tn][i] * (1 - r) + U[tn][i + 1] * r;
            return M.clamp(Math.log10(Math.max(1e-17, mx - val)), -16, 0);
          }, { range: [-16, 0], cmap: 'magma', res: 3, key });
          P1.line(0, 1, 1, 1, { color: 'muted', width: 1, dash: [4, 4] });
          const ts = M.range(NT + 1).map((i) => i / NT);
          probes.forEach((x, pi) => {
            const i = Math.round(x * NX), col = ['accent', 'orange', 'purple'][pi];
            P2.path(ts.slice(1).map((t, j) => [t, Math.max(1e-17, mx - U[j + 1][i])]), { color: col, width: 2.4 });
          });
          P2.hline(1e-16, { color: 'muted', width: 1, dash: [4, 4] });
          P2.text('double-precision floor', 0.45, 3e-16, { color: 'muted', size: 11 });
          info = { mx, mg: sol.mg, gx: sol.gi / NX, gt: sol.gn / NT, md };
        });
        v.legend([['accent', '$x=0.1$'], ['orange', '$x=0.25$'], ['purple', '$x=0.5$']]);
        v.readout(() => info && `$M=\\max u=${v.fix(info.mx, 4)}$ · smallest gap $M-u$ over all points with $0<x<1$, $0<t\\le1$: $${v.sci(Math.max(info.mg, 1e-16), 2)}$ at $(x,t)=(${v.fix(info.gx, 2)},${v.fix(info.gt, 2)})$\n` +
          (info.md === 'const' ? 'constant data: $u\\equiv M$, the gap is $0$ everywhere — the only case in which the maximum is attained inside' : info.mg > 1e-15 ? 'the gap is strictly positive in the whole interior ✓ (a value below $10^{-16}$ cannot be told from $0$ in double precision)' : 'gap at roundoff level: positive in exact arithmetic (the kernel is strictly positive) but not resolvable here'));
      },
    },
  ],
};
