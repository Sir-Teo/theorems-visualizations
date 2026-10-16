// Partial Differential Equations — Chapter 2: The wave equation in one dimension (part b: 2.5–2.8)
import { gaussSum, extend, dAlembert, makeWave } from './ch02.shared.js';

export default {
  collection: 'pde',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Theorem',
      name: 'Uniqueness by the energy method',
      statement: String.raw`Let $\ell>0$. The initial–boundary value problem $u_{tt}=c^2u_{xx}$ on $(0,\ell)\times(0,T)$, $u(0,t)=u(\ell,t)=0$, $u(x,0)=\varphi(x)$, $u_t(x,0)=\psi(x)$ has at most one $C^2$ solution (the same holds on $\R$ for solutions with decaying data, and with Neumann ends). More precisely, the energy of the difference $D=u_1-u_2$ of two solutions is constant, $E_D(t)=E_D(0)$, so two solutions with the same data coincide.`,
      idea: String.raw`The difference $D$ of two solutions solves the same linear equation with data $\varphi_1-\varphi_2,\ \psi_1-\psi_2$ (superposition, 1.1). By the conservation law (2.4) its energy satisfies $E_D(t)=E_D(0)$. If the data agree, $E_D(0)=0$, and since the integrand $D_t^2+c^2D_x^2$ is nonnegative and continuous, $D_t\equiv D_x\equiv0$: $D$ is constant, and the boundary value $0$ (or the data) forces $D\equiv0$. The proof needs the equation to supply the sign structure $D_t^2+c^2D_x^2\ge0$: for $u_{tt}=-c^2u_{xx}$ no such conserved positive quantity exists, and uniqueness of the Cauchy problem fails to be stable.`,
      caption: String.raw`Two solutions $u_1$ (blue, dashed) and $u_2$ (orange) of the string problem differ only through the initial position: drag the seven handles of the difference $D(x,0)$ in the left panel. With all handles at zero, $u_2=u_1$ at all times and $E_D\equiv0$. Otherwise $D$ wiggles but its energy (right panel) is perfectly flat. Switch the equation to $u_{tt}=-c^2u_{xx}$ (Laplace-type, not a wave equation) and the same small difference of data explodes: $E_D$ is no longer conserved and the problem is not well posed.`,
      deps: ['pde-2.4'],
      refs: ['Evans §2.4'],
      tags: ['uniqueness', 'energy method', 'well-posedness'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Wave_equation' },
      viz(v) {
        const M = v.M, K = 16, NX = 200, XH = Array.from({ length: 7 }, (_, i) => (i + 1) / 8);
        const eq = v.select('equation', [{ value: 'wave', label: '$u_{tt}=c^2u_{xx}$' }, { value: 'ell', label: '$u_{tt}=-c^2u_{xx}$' }], 'wave');
        v.button('same data', () => hs.forEach((h) => h.set(h.x, 0)));
        const S0 = v.stage({ x: [0, 1], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 220, xlabel: 'x', title: 'difference of the data, $D(x,0)$', minWidth: 260 });
        const S1 = v.stage({ x: [0, 1], y: [-0.6, 0.6], axes: 'box', gutter: true, height: 220, xlabel: 'x', title: 'the two solutions at time $t$', minWidth: 260 });
        const S2 = v.stage({ x: [0, 1], y: [-0.5, 0.5], axes: 'box', gutter: true, height: 220, xlabel: 'x', title: 'difference $D=u_1-u_2$', minWidth: 260 });
        const S3 = v.stage({ x: [0, 2], y: [0, 1], axes: 'box', gutter: true, height: 220, xlabel: 't', title: 'energy $E_D(t)=\\tfrac12\\!\\int(D_t^2+c^2D_x^2)\\,dx$', minWidth: 260 });
        const hs = XH.map((x, i) => S0.handle(x, [0, 0.12, 0.3, 0.12, -0.2, -0.1, 0][i], { color: 'orange', r: 5.5, constrain: (xx, y) => [x, M.clamp(y, -0.48, 0.48)] }));
        const a1 = [0.35, 0.15];
        const xg = M.range(NX + 1).map((i) => i / NX), wq = 1 / NX;
        // sine coefficients of the difference of the data
        const coefs = () => {
          const g = gaussSum(hs.map((h) => h.y), XH, 0.085), b = new Float64Array(K);
          for (let k = 1; k <= K; k++) { let s = 0; for (const x of xg) s += g(x) * Math.sin(k * Math.PI * x) * wq; b[k - 1] = 2 * s; }
          return b;
        };
        const timeF = (ell, k, t) => (ell ? Math.cosh(k * Math.PI * t) : Math.cos(k * Math.PI * t));
        const timeD = (ell, k, t) => (ell ? k * Math.PI * Math.sinh(k * Math.PI * t) : -k * Math.PI * Math.sin(k * Math.PI * t));
        const Dval = (b, ell, x, t) => { let s = 0; for (let k = 1; k <= K; k++) s += b[k - 1] * Math.sin(k * Math.PI * x) * timeF(ell, k, t); return s; };
        const energy = (b, ell, t) => {
          let e = 0;
          for (let i = 0; i < NX; i++) {
            const x = (i + 0.5) * wq; let dt = 0, dx = 0;
            for (let k = 1; k <= K; k++) { dt += b[k - 1] * Math.sin(k * Math.PI * x) * timeD(ell, k, t); dx += b[k - 1] * k * Math.PI * Math.cos(k * Math.PI * x) * timeF(ell, k, t); }
            e += 0.5 * (dt * dt + dx * dx) * wq;
          }
          return e;
        };
        let info = null;
        v.animate((t) => {
          const ell = eq.value === 'ell', b = coefs();
          const u1 = (x, tt) => a1[0] * Math.sin(Math.PI * x) * timeF(ell, 1, tt) + a1[1] * Math.sin(2 * Math.PI * x) * timeF(ell, 2, tt);
          S0.fn(gaussSum(hs.map((h) => h.y), XH, 0.085), { color: 'orange', width: 2.4 });
          S1.fn((x) => u1(x, t), { color: 'accent', width: 2.8, dash: [6, 4] });
          S1.fn((x) => u1(x, t) + Dval(b, ell, x, t), { color: 'orange', width: 2.2 });
          S2.hline(0, { color: 'faint', width: 1 });
          S2.fn((x) => Dval(b, ell, x, t), { color: 'ink', width: 3 });
          S2.corner(`t = ${v.fix(t, 2)}`, 'tr', { color: 'ink', weight: 600 });
          const ts = M.range(61).map((i) => (2 * i) / 60), es = ts.map((tt) => energy(b, ell, tt)), E0 = es[0];
          S3.setView([0, 2], [0, Math.max(1e-6, 2 * E0)]);
          S3.path(ts.map((tt, i) => [tt, es[i]]), { color: ell ? 'red' : 'green', width: 2.8 });
          S3.hline(E0, { color: 'muted', width: 1.2, dash: [6, 4] });
          const Et = energy(b, ell, t); S3.dot(t, Et, { r: 5, color: 'gold' });
          let dm = 0; for (let i = 0; i <= 100; i++) dm = Math.max(dm, Math.abs(Dval(b, ell, i / 100, t)));
          info = { E0, Et, dm, ell, drift: Math.max(...es.map((e) => Math.abs(e - E0))) };
        }, { period: 2, still: 0.9 });
        v.legend([['accent', '$u_1$', { dash: true }], ['orange', '$u_2=u_1+D$']]);
        v.readout(() => info && (info.ell
          ? `$E_D(0)=${v.sci(Math.max(info.E0, 1e-12), 2)}$, $E_D(t)=${v.sci(Math.max(info.Et, 1e-12), 2)}$, $\\max|D|=${v.sci(Math.max(info.dm, 1e-12), 2)}$ — not conserved: modes grow like $\\cosh(k\\pi ct)$, tiny differences of data are amplified without bound`
          : `$E_D(0)=${v.fix(info.E0, 5)}$ · $E_D(t)=${v.fix(info.Et, 5)}$ · largest deviation over $t\\in[0,2]$: $${v.sci(Math.max(info.drift, 1e-16), 2)}$ · $\\max|D|=${v.fix(info.dm, 3)}$` + (info.E0 < 1e-9 ? ` — equal data: $E_D\\equiv0$, so $D_t=D_x=0$ and $D\\equiv0$` : '')));
      },
    },
    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Phenomenon',
      name: 'Singularities travel along characteristics',
      statement: String.raw`For $u_{tt}=c^2u_{xx}$ with data $\varphi,\psi$ (take $\psi=0$ for simplicity), every singularity of $\varphi$ (a jump of $\varphi$, or of $\varphi'$, ...) at a point $x_k$ splits into two singularities of the same type, carried along the characteristics $x=x_k\pm ct$ with *half* the original size; nothing is smoothed and no new singularity appears. By contrast, the solution of the heat equation $u_t=\kappa u_{xx}$ with the same data is $C^\infty$ for every $t>0$: singularities are destroyed instantly.`,
      idea: String.raw`By d'Alembert's formula (2.2), $u(x,t)=\tfrac12[\varphi(x+ct)+\varphi(x-ct)]$: the solution is just two translated copies of the data, so it is exactly as smooth (or as rough) as $\varphi$ itself and the roughness sits where $x\pm ct=x_k$. For the heat equation, $u=G_t*\varphi$ with the Gaussian kernel $G_t$, smooth for $t>0$; the kink of size $s$ is smeared over a width $\sqrt{2\kappa t}$, so its apparent sharpness decays like $1/\sqrt t$. This is the sharpest difference between hyperbolic and parabolic equations.`,
      caption: String.raw`Left: the wave equation; middle: the heat equation, started from the same data (a *hat* with kinks, or a *box* with jumps). Drag the width and the diffusivity $\kappa$ and play time. Right: the *sharpness* of the worst singularity, measured with the second difference $|u(x+\varepsilon)-2u(x)+u(x-\varepsilon)|/\varepsilon$ for kinks (and $|u(x+\varepsilon)-u(x-\varepsilon)|$ for jumps), $\varepsilon=0.15$, normalised by its initial value. The wave curve drops to $1/2$ once each kink has split and then stays flat; the heat curve decays to zero.`,
      deps: ['pde-2.2'],
      refs: ['Strauss §2.1'],
      tags: ['characteristics', 'singularities', 'hyperbolic vs parabolic'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Propagation_of_singularities' },
      viz(v) {
        const M = v.M, TT = 5, EPS = 0.15, c = 1;
        const kind = v.select('initial data', [{ value: 'hat', label: 'hat (kinks)' }, { value: 'box', label: 'box (jumps)' }], 'hat');
        const wS = v.slider('half-width $w$', 0.5, 2, 1, { step: 0.05 });
        const kS = v.slider('diffusivity $\\kappa$', 0.05, 1, 0.25, { step: 0.01 });
        const Cdf = (z) => 0.5 * (1 + M.erf(z / Math.SQRT2)), pdf = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
        const ramp = (z) => pdf(z) + z * Cdf(z); // ∫ (y)_+ against a standard Gaussian, in units of σ
        const make = () => {
          const w = wS.value, hat = kind.value === 'hat';
          const phi = hat ? (x) => Math.max(0, 1 - Math.abs(x) / w) : (x) => (Math.abs(x) <= w ? 1 : 0);
          const wave = (x, t) => 0.5 * (phi(x + c * t) + phi(x - c * t));
          const heat = (x, t) => {
            const s = Math.sqrt(2 * kS.value * t);
            if (s < 1e-6) return phi(x);
            if (!hat) return Cdf((x + w) / s) - Cdf((x - w) / s);
            return (s / w) * (ramp((x + w) / s) - 2 * ramp(x / s) + ramp((x - w) / s));
          };
          const sharp = (f, x, t) => (hat ? Math.abs(f(x + EPS, t) - 2 * f(x, t) + f(x - EPS, t)) / EPS : Math.abs(f(x + EPS, t) - f(x - EPS, t)));
          const feats = [-w, ...(hat ? [0] : []), w];
          const sw = (t) => Math.max(...feats.flatMap((xk) => [xk + c * t, xk - c * t]).map((x) => sharp(wave, x, t)));
          const sh = (t) => Math.max(...feats.map((xk) => sharp(heat, xk, t)));
          return { hat, w, phi, wave, heat, sw, sh };
        };
        const A = v.stage({ x: [-6, 6], y: [-0.2, 1.2], axes: 'box', gutter: true, height: 230, xlabel: 'x', title: 'wave equation $u_{tt}=u_{xx}$', minWidth: 260 });
        const B = v.stage({ x: [-6, 6], y: [-0.2, 1.2], axes: 'box', gutter: true, height: 230, xlabel: 'x', title: 'heat equation $u_t=\\kappa u_{xx}$', minWidth: 260 });
        const C = v.stage({ x: [0, TT], y: [0, 1.15], axes: 'box', gutter: true, height: 230, xlabel: 't', title: 'relative sharpness of the singularities', minWidth: 260 });
        let info = null;
        v.animate((t) => {
          const m = make();
          for (const [S, f] of [[A, m.wave], [B, m.heat]]) {
            S.fn(m.phi, { color: 'muted', width: 1.4, dash: [5, 4], n: 1200 });
            S.fn((x) => f(x, t), { color: S === A ? 'accent' : 'orange', width: 3, n: 1200 });
          }
          for (const xk of m.hat ? [-m.w, 0, m.w] : [-m.w, m.w]) { A.dot(xk + c * t, m.wave(xk + c * t, t), { r: 3.5, color: 'gold' }); A.dot(xk - c * t, m.wave(xk - c * t, t), { r: 3.5, color: 'gold' }); }
          A.corner(`t = ${v.fix(t, 2)}`, 'tr', { color: 'ink', weight: 600 });
          const ts = M.range(51).map((i) => (TT * i) / 50), s0 = m.sw(0), a = ts.map((tt) => m.sw(tt) / s0), b = ts.map((tt) => m.sh(tt) / s0);
          C.path(ts.map((tt, i) => [tt, a[i]]), { color: 'accent', width: 2.6 }); C.path(ts.map((tt, i) => [tt, b[i]]), { color: 'orange', width: 2.6 });
          C.vline(t, { color: 'gold', width: 1.6 }); C.hline(0.5, { color: 'muted', width: 1, dash: [4, 4] });
          info = { t, sw: m.sw(t) / s0, sh: m.sh(t) / s0 };
        }, { period: TT, still: 3 });
        v.legend([['muted', 'initial data', { dash: true }], ['accent', 'wave'], ['orange', 'heat'], ['gold', 'singularities on characteristics', { dot: true }]]);
        v.readout(() => info && `$t=${v.fix(info.t, 2)}$: sharpness relative to $t=0$ — wave $${v.fix(info.sw, 3)}$ (no smoothing: it stays at one half of the original once the singularities have split), heat $${v.fix(info.sh, 3)}$ (decays like $1/\\sqrt{t}$)`);
      },
    },
    // ------------------------------------------------------------------ 2.7
    {
      num: '2.7',
      kind: 'Method',
      name: 'Reflection of waves at a boundary',
      statement: String.raw`To solve the wave equation on $[0,\ell]$ with a fixed end ($u=0$) or a free end ($u_x=0$) at $x=0$ or $\ell$, extend the data to the whole line by reflecting oddly about a fixed end and evenly about a free end, then apply d'Alembert's formula (2.2) to the extended data and restrict to $[0,\ell]$. The resulting function solves the boundary problem. A pulse hitting a fixed end comes back *inverted* (reflection coefficient $-1$), one hitting a free end comes back upright ($+1$). With two ends the extension is $2\ell$-periodic (if the ends are of the same type) and the solution is periodic in time with period $2\ell/c$ for the fixed–fixed and free–free cases.`,
      idea: String.raw`An odd function vanishes at its centre of oddness, and d'Alembert's formula preserves oddness: if $\varphi,\psi$ are odd about $0$ then $u(\cdot,t)$ is odd about $0$, so $u(0,t)=0$. Likewise even data give an even solution with $u_x(0,t)=0$. So the extended problem on $\R$ already satisfies the boundary condition, and by uniqueness (2.5) it *is* the boundary problem. The ghost pulse on the other side of the wall is the image charge of the method.`,
      caption: String.raw`A pulse travels towards the left end. The string occupies the white window $[0,\ell]$; the faint purple pulses live on the grey extension and are what the method adds. Choose the type of each end (fixed or free) and the shape of the data (a pulse sent towards the left end, or the same hump released from rest). The right panel is the space–time picture on $[0,\ell]$; in the readouts check that $u=0$ at a fixed end and $u_x=0$ at a free end at every time, and that the energy does not change at reflection.`,
      deps: ['pde-2.2', 'pde-1.6'],
      refs: ['Strauss §3.2'],
      tags: ['reflection', 'method of images', 'boundary conditions'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Method_of_image_charges' },
      viz(v) {
        const M = v.M, L = 4, WB = 0.8, PC = 2.5;
        const lend = v.select('left end', [{ value: -1, label: 'fixed' }, { value: 1, label: 'free' }], -1);
        const rend = v.select('right end', [{ value: -1, label: 'fixed' }, { value: 1, label: 'free' }], -1);
        const dat = v.select('data', [{ value: 'move', label: 'pulse moving left' }, { value: 'rest', label: 'hump at rest' }], 'move');
        const cS = v.slider('$c$', 0.5, 2, 1, { step: 0.05 });
        const D = v.stage({ x: [-4, 8], y: [-1.4, 1.4], axes: 'box', gutter: true, height: 260, xlabel: 'x', title: 'the string $[0,\\ell]$ and its extension', minWidth: 330, weight: 1.4 });
        const ST = v.stage({ x: [0, L], y: [0, 8], axes: 'box', gutter: true, height: 260, xlabel: 'x', ylabel: 't', title: 'space–time on the string', minWidth: 240, weight: 1 });
        const phi = (x) => (Math.abs(x - PC) < WB ? Math.cos((Math.PI * (x - PC)) / (2 * WB)) ** 2 : 0);
        const dphi = (x) => (Math.abs(x - PC) < WB ? -((Math.PI / (2 * WB)) * Math.sin((Math.PI * (x - PC)) / WB)) : 0);
        let info = null;
        const build = () => {
          const s0 = Number(lend.value), sL = Number(rend.value), c = cS.value;
          const p = extend(phi, L, s0, sL), q = extend(dat.value === 'move' ? (x) => c * dphi(x) : () => 0, L, s0, sL);
          return { u: dAlembert(p, q, c, -40, 40, 16000), s0, sL, c, ext: p };
        };
        v.animate((t) => {
          const { u, s0, sL, c } = build(), h = 1e-3;
          D.rect(-4, -1.4, 0, 1.4, { fill: 'ink', fillAlpha: 0.05, stroke: false }); D.rect(L, -1.4, 8, 1.4, { fill: 'ink', fillAlpha: 0.05, stroke: false });
          D.vline(0, { color: 'ink', width: 2.2 }); D.vline(L, { color: 'ink', width: 2.2 });
          D.fn((x) => u(x, t), { domain: [-4, 0], color: 'purple', width: 2, alpha: 0.55, dash: [5, 4], n: 600 });
          D.fn((x) => u(x, t), { domain: [L, 8], color: 'purple', width: 2, alpha: 0.55, dash: [5, 4], n: 600 });
          D.fn((x) => u(x, t), { domain: [0, L], color: 'accent', width: 3.2, n: 800 });
          D.corner(`t = ${v.fix(t, 2)}`, 'tr', { color: 'ink', weight: 600 });
          D.tex(s0 < 0 ? '\\text{fixed: odd}' : '\\text{free: even}', -2, -1.15, { size: 13, color: 'muted' }); D.tex(sL < 0 ? '\\text{fixed: odd}' : '\\text{free: even}', 6, -1.15, { size: 13, color: 'muted' });
          ST.heat((x, y) => M.clamp(u(x, y), -1, 1), { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key: `${s0}|${sL}|${dat.value}|${c}` });
          ST.hline(t, { color: 'ink', width: 1.6, dash: [6, 4] });
          let e = 0; const nq = 400;
          for (let i = 0; i < nq; i++) { const x = ((i + 0.5) * L) / nq, ut = (u(x, t + h) - u(x, t - h)) / (2 * h), ux = (u(x + h, t) - u(x - h, t)) / (2 * h); e += 0.5 * (ut * ut + c * c * ux * ux) * (L / nq); }
          info = { t, u0: u(0, t), uL: u(L, t), ux0: (u(h, t) - u(-h, t)) / (2 * h), uxL: (u(L + h, t) - u(L - h, t)) / (2 * h), e, s0, sL };
        }, { period: 8, still: 3.3 });
        v.legend([['accent', 'the string'], ['purple', 'image pulses (extension)', { dash: true }]]);
        v.readout(() => info && `left end: $u(0,t)=${v.fix(info.u0, 4)}$, $u_x(0,t)=${v.fix(info.ux0, 4)}$ (${info.s0 < 0 ? 'fixed: $u=0$ holds, $u_x\\ne0$' : 'free: $u_x=0$ holds, $u\\neq0$ in general'}) · right end: $u(\\ell,t)=${v.fix(info.uL, 4)}$, $u_x(\\ell,t)=${v.fix(info.uxL, 4)}$\nenergy $E(t)=${v.fix(info.e, 4)}$ at every time (reflection loses nothing)`);
      },
    },
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Theorem',
      name: 'Duhamel’s principle for the wave equation',
      statement: String.raw`Let $c>0$ and let $F$ be continuous with $F_x$ continuous. The inhomogeneous problem $u_{tt}-c^2u_{xx}=F(x,t)$ on $\R\times(0,\infty)$ with $u(x,0)=u_t(x,0)=0$ has the unique solution
$$u(x,t)=\frac1{2c}\int_0^t\!\!\int_{x-c(t-s)}^{x+c(t-s)}F(y,s)\,dy\,ds=\int_0^tw(x,t;s)\,ds,$$
where $w(\cdot,\cdot\,;s)$ solves the *homogeneous* wave equation for $t>s$ with $w=0$, $w_t=F(\cdot,s)$ at $t=s$ (d'Alembert's formula 2.2). So $u(x_0,t_0)$ is the integral of $F$ over the backward characteristic triangle of $(x_0,t_0)$, divided by $2c$.`,
      idea: String.raw`Think of the force as a continuous sequence of tiny kicks: in the time interval $[s,s+ds]$ the string receives velocity $F(\cdot,s)\,ds$, and afterwards it evolves freely, so by linearity (superposition, 1.1) the effect of that kick is $w(x,t;s)\,ds$ with $w$ given by d'Alembert's formula (2.2) with $\varphi=0$, $\psi=F(\cdot,s)$. Adding the effects of all kicks gives $\int_0^tw\,ds$; differentiating twice under the integral and using $w(x,s;s)=0,\ w_t(x,s;s)=F(x,s)$ verifies $u_{tt}-c^2u_{xx}=F$. Uniqueness follows from the energy method (2.5).`,
      caption: String.raw`A force acts on the string in the region you control: drag the orange handle (position $x_s$ and switch-on time $t_1$), and set its width and duration. Drag the green point $P$: its backward triangle (green) collects the force it overlaps, and the right panel shows the response $u(x,t_0)$ at the time of $P$ by three methods: the exact double integral (blue), a finite-difference solution of the PDE (gold dots), and the Duhamel sum of $N$ discrete kicks (orange; faint curves are the individual kicks). With few kicks the sum is a staircase of plateaus; as $N$ grows it converges to the exact response.`,
      deps: ['pde-2.2'],
      refs: ['Strauss §3.4', 'Evans §2.4'],
      credit: 'Duhamel, 1838',
      tags: ['source term', 'Duhamel principle', 'superposition'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Duhamel%27s_principle' },
      viz(v) {
        const M = v.M, A = 3, TMAX = 5;
        const wS = v.slider('force width $w$', 0.3, 1.5, 0.6, { step: 0.05 });
        const dS = v.slider('duration', 0.5, 3, 1.5, { step: 0.05 });
        const nS = v.slider('kicks $N$', 1, 40, 4, { int: true });
        const cS = v.slider('$c$', 0.5, 1.5, 1, { step: 0.05 });
        const ST = v.stage({ x: [-8, 8], y: [0, TMAX], axes: 'box', gutter: true, height: 300, xlabel: 'x', ylabel: 't', title: 'force $F(x,t)$ and the point $P$', minWidth: 300 });
        const B = v.stage({ x: [-8, 8], y: [-0.2, 1.4], axes: 'box', gutter: true, height: 300, xlabel: 'x', title: 'response $u(x,t_0)$', minWidth: 300 });
        const H = ST.handle(-1.5, 0.6, { color: 'orange', r: 7, label: 'force', constrain: (x, y) => [M.clamp(x, -4, 4), M.clamp(y, 0, 3)] });
        const P = ST.handle(1, 4, { color: 'green', r: 7, label: 'P', constrain: (x, y) => [M.clamp(x, -6, 6), M.clamp(y, 0.4, 4.6)] });
        const Fp = (x, s) => { const t1 = H.y, d = dS.value; return s < t1 || s > t1 + d ? 0 : A * Math.exp(-(((x - H.x) / wS.value) ** 2)) * Math.sin((Math.PI * (s - t1)) / d) ** 2; };
        // ∫_{x-r}^{x+r} F(y, s) dy in closed form (Gaussian in y)
        const spaceInt = (x, r, s) => { const t1 = H.y, d = dS.value; if (s < t1 || s > t1 + d) return 0; const w = wS.value; return A * Math.sin((Math.PI * (s - t1)) / d) ** 2 * ((Math.sqrt(Math.PI) * w) / 2) * (M.erf((x + r - H.x) / w) - M.erf((x - r - H.x) / w)); };
        const exact = (x, t, c) => { const a = Math.max(0, H.y), b = Math.min(t, H.y + dS.value); if (b <= a) return 0; return M.integrate((s) => spaceInt(x, c * (t - s), s), a, b, 240) / (2 * c); };
        const kicks = (x, t, c, N) => { let s = 0; const ds = t / N; for (let k = 0; k < N; k++) s += ds * spaceInt(x, c * (t - k * ds), k * ds) / (2 * c); return s; };
        let info = null;
        v.render(() => {
          const c = cS.value, N = nS.value, x0 = P.x, t0 = P.y, t1 = H.y, d = dS.value;
          ST.heat((x, s) => Fp(x, s) / A, { range: [0, 1], cmap: 'theme', color: 'orange', res: 3, key: `${H.x.toFixed(3)}|${t1.toFixed(3)}|${wS.value}|${d}` });
          ST.poly([[x0 - c * t0, 0], [x0 + c * t0, 0], [x0, t0]], { fill: 'green', fillAlpha: 0.18, color: 'green', width: 2.2 });
          ST.hline(t0, { color: 'green', width: 1, dash: [6, 4], alpha: 0.7 });
          const xs = M.range(161).map((i) => -8 + i * 0.1), ue = xs.map((x) => exact(x, t0, c)), uk = xs.map((x) => kicks(x, t0, c, N));
          let m = 0.05; for (const a of ue) m = Math.max(m, Math.abs(a)); for (const a of uk) m = Math.max(m, Math.abs(a));
          B.setView([-8, 8], [-0.1 * m, 1.25 * m]);
          // the individual kicks (drawn when there are at most 12)
          const ds = t0 / N;
          if (N <= 12) for (let k = 0; k < N; k++) B.path(xs.map((x) => [x, (ds * spaceInt(x, c * (t0 - k * ds), k * ds)) / (2 * c)]), { color: 'orange', width: 1, alpha: 0.45 });
          B.path(xs.map((x, i) => [x, uk[i]]), { color: 'orange', width: 2.6 });
          B.path(xs.map((x, i) => [x, ue[i]]), { color: 'accent', width: 2.8 });
          // finite differences with the same source (domain [-12, 12])
          const Wv = makeWave(480, 24, c, 0.8, () => 0, () => 0, { F: (x, s) => Fp(x - 12, s) });
          while (Wv.t + Wv.dt <= t0 + 1e-12) Wv.step();
          let err = 0; const pts = [];
          for (let i = 0; i <= Wv.N; i += 6) { const x = i * Wv.dx - 12; if (Math.abs(x) <= 8) { pts.push([x, Wv.u[i]]); err = Math.max(err, Math.abs(Wv.u[i] - exact(x, Wv.t, c))); } }
          B.dots(pts, { r: 3, color: 'gold' });
          B.dot(x0, exact(x0, t0, c), { r: 6, color: 'green' });
          const ex0 = exact(x0, t0, c), kx0 = kicks(x0, t0, c, N);
          info = { ex0, kx0, err, t0, x0, N, eN: Math.max(...xs.map((x, i) => Math.abs(uk[i] - ue[i]))), m };
        });
        v.legend([['accent', 'exact: $\\tfrac1{2c}\\iint F$'], ['orange', 'sum of $N$ kicks'], ['gold', 'finite-difference PDE', { dot: true }], ['green', 'domain of dependence of $P$']]);
        v.readout(() => info && `at $P=(${v.fix(info.x0, 2)},${v.fix(info.t0, 2)})$: exact $u=${v.fix(info.ex0, 4)}$, $N=${info.N}$ kicks give $${v.fix(info.kx0, 4)}$ · largest difference over $x$ between the kick sum and the exact response: $${v.fix(info.eN, 4)}$ · PDE solver vs integral: $${v.sci(Math.max(info.err, 1e-12), 2)}$`);
      },
    },
  ],
};
