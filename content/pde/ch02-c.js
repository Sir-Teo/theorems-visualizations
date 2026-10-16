// Partial Differential Equations — Chapter 2: The wave equation in one dimension (part c: 2.9–2.11)
import { extend, makeWave, thomas } from './ch02.shared.js';

export default {
  collection: 'pde',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Phenomenon',
      name: 'Dispersion: waves whose speed depends on wavelength',
      statement: String.raw`A linear constant-coefficient equation has plane-wave solutions $e^{i(kx-\omega t)}$ with $\omega=\omega(k)$ given by the **dispersion relation**. The wave equation has $\omega=\pm ck$: every wavelength travels at the same speed $c$, so any profile moves rigidly. The Klein–Gordon equation $u_{tt}=c^2u_{xx}-m^2u$ has $\omega=\sqrt{c^2k^2+m^2}$, so the *phase velocity* $v_p=\omega/k$ and the *group velocity* $v_g=\omega'(k)=c^2k/\omega$ differ and depend on $k$. A narrow-band packet of mean wavenumber $k_0$ and width $\sigma$ moves at $v_g(k_0)$, its carrier crests at $v_p$, and (if $\omega''(k_0)\ne0$) the envelope spreads: $\sigma(t)=\sigma\sqrt{1+(\omega''(k_0)t/\sigma^2)^2}$.`,
      idea: String.raw`Superpose plane waves, $u=\operatorname{Re}\int\hat a(k)e^{i(kx-\omega(k)t)}dk$. Near $k_0$ expand $\omega(k)=\omega_0+v_g(k-k_0)+\tfrac12\omega''(k-k_0)^2+\cdots$: the linear term translates the envelope at $v_g$, the quadratic term (a complex Gaussian integral) makes the width grow. For $\omega=ck$ both $\omega''$ and every higher derivative vanish, which is d'Alembert's rigid motion (2.1). The dispersion relation is computed by inserting the plane wave into the equation, and the exact evolution below is a fast Fourier transform.`,
      caption: String.raw`The same Gaussian wave packet (carrier wavenumber $k_0$, width $\sigma$) is evolved by the wave equation (top) and by the Klein–Gordon equation (middle); the dashed curves are the envelopes. Drag the handle on the dispersion curve (bottom) to change $k_0$: the tangent (green) has slope $v_g$, the chord to the origin (gold) has slope $v_p$. The packet of the wave equation keeps its shape; the Klein–Gordon packet slows to $v_g<c$, its crests move faster than the envelope, and it spreads. Increase $m$ or decrease $\sigma$ to see more dispersion.`,
      deps: ['pde-2.1'],
      refs: ['Evans §4.2'],
      tags: ['dispersion', 'group velocity', 'Klein–Gordon'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dispersion_(water_waves)' },
      viz(v) {
        const M = v.M, N = 1024, DX = 0.125, X0 = -40, XC = -10, TT = 30;
        const mS = v.slider('mass $m$', 0, 3, 1.2, { step: 0.05 });
        const sS = v.slider('packet width $\\sigma$', 1, 5, 2.5, { step: 0.1 });
        const W1 = v.stage({ x: [-20, 40], y: [-1.3, 1.3], axes: 'box', gutter: true, height: 190, xlabel: 'x', title: 'wave equation, $\\omega=ck$ ($c=1$)', minWidth: 330, full: true });
        const W2 = v.stage({ x: [-20, 40], y: [-1.3, 1.3], axes: 'box', gutter: true, height: 190, xlabel: 'x', title: 'Klein–Gordon, $\\omega=\\sqrt{c^2k^2+m^2}$', minWidth: 330, full: true });
        const Dp = v.stage({ x: [0, 6], y: [0, 6.5], axes: 'box', gutter: true, height: 250, xlabel: 'k', ylabel: 'ω', title: 'dispersion relation', minWidth: 300 });
        const Hk = Dp.handle(2.5, Math.hypot(2.5, 1.2), { color: 'green', r: 7, label: 'k₀', constrain: (x) => { const k = M.clamp(x, 0.4, 5.5); return [k, Math.hypot(k, mS.value)]; } });
        const kk = Float64Array.from({ length: N }, (_, j) => (2 * Math.PI * (j <= N / 2 ? j : j - N)) / (N * DX));
        let cache = { key: '', re: null, im: null };
        const spectrum = () => {
          const k0 = Hk.x, sg = sS.value, key = `${k0.toFixed(4)}|${sg}`;
          if (cache.key === key) return cache;
          const re = new Float64Array(N), im = new Float64Array(N);
          for (let j = 0; j < N; j++) { const x = X0 + j * DX, e = Math.exp(-((x - XC) ** 2) / (2 * sg * sg)); re[j] = e * Math.cos(k0 * x); im[j] = e * Math.sin(k0 * x); }
          M.fft(re, im);
          for (let j = 0; j < N; j++) if (j === 0 || j > N / 2) { re[j] = 0; im[j] = 0; }
          cache = { key, re, im }; return cache;
        };
        const evolve = (omega, t) => {
          const sp = spectrum(), re = new Float64Array(N), im = new Float64Array(N);
          for (let j = 0; j < N; j++) { const ph = -omega(kk[j]) * t, cs = Math.cos(ph), sn = Math.sin(ph); re[j] = sp.re[j] * cs - sp.im[j] * sn; im[j] = sp.re[j] * sn + sp.im[j] * cs; }
          M.ifft(re, im); return { re, im };
        };
        const stats = (a) => { let s0 = 0, s1 = 0, s2 = 0; for (let j = 0; j < N; j++) { const p = a.re[j] ** 2 + a.im[j] ** 2, x = X0 + j * DX; s0 += p; s1 += p * x; s2 += p * x * x; } const mu = s1 / s0; return { mu, sig: Math.sqrt(2 * Math.max(0, s2 / s0 - mu * mu)) }; };
        let info = null;
        v.animate((t) => {
          const m = mS.value, k0 = Hk.x, sg = sS.value, w0 = Math.hypot(k0, m);
          const om = (k) => Math.hypot(k, m);
          const out = [[W1, evolve(Math.abs, t), 'accent'], [W2, evolve(om, t), 'orange']], res = [];
          for (const [S, a, col] of out) {
            const pts = [], up = [], dn = [];
            for (let j = 0; j < N; j++) { const x = X0 + j * DX; if (x < -21 || x > 41) continue; pts.push([x, a.re[j]]); const env = Math.hypot(a.re[j], a.im[j]); up.push([x, env]); dn.push([x, -env]); }
            S.path(up, { color: 'muted', width: 1.4, dash: [5, 4] }); S.path(dn, { color: 'muted', width: 1.4, dash: [5, 4] });
            S.path(pts, { color: col, width: 2.2 });
            res.push(stats(a));
          }
          W1.corner(`t = ${v.fix(t, 1)}`, 'tr', { color: 'ink', weight: 600 });
          W1.vline(XC + t, { color: 'muted', width: 1, alpha: 0.6 });
          const vg = k0 / w0, vp = w0 / k0, wpp = (m * m) / (w0 ** 3);
          W2.vline(XC + vg * t, { color: 'green', width: 1.4 });
          Dp.fn((k) => k, { color: 'muted', width: 1.6, dash: [6, 4] });
          Dp.fn((k) => Math.hypot(k, m), { color: 'orange', width: 2.6 });
          Dp.line(0, 0, 6, 6 * vp, { color: 'gold', width: 1.6 });
          Dp.line(Math.max(0, k0 - 3), w0 - 3 * vg, Math.min(6, k0 + 2.5), w0 + 2.5 * vg, { color: 'green', width: 2 });
          const sTh = sg * Math.sqrt(1 + ((wpp * t) / (sg * sg)) ** 2);
          info = { vg, vp, w0, m, t, c1: res[0].mu - XC, c2: res[1].mu - XC, s1: res[0].sig, s2: res[1].sig, sTh, sg };
        }, { period: TT, still: 22 });
        v.legend([['accent', 'wave eq.'], ['orange', 'Klein–Gordon'], ['muted', 'envelope', { dash: true }], ['green', 'tangent: $v_g$'], ['gold', 'chord: $v_p$']]);
        v.readout(() => info && `$k_0=${v.fix(Hk.x, 2)}$, $m=${v.fix(info.m, 2)}$: $v_p=\\omega/k=${v.fix(info.vp, 3)}$, $v_g=\\omega'=${v.fix(info.vg, 3)}$ · at $t=${v.fix(info.t, 1)}$ the envelope centre has moved ${v.fix(info.c1, 2)} (wave equation; $ct=${v.fix(info.t, 2)}$) and ${v.fix(info.c2, 2)} (Klein–Gordon; $v_gt=${v.fix(info.vg * info.t, 2)}$)\nenvelope width: wave equation ${v.fix(info.s1, 3)} (initial ${v.fix(info.sg, 3)}, unchanged), Klein–Gordon ${v.fix(info.s2, 3)}, predicted $\\sigma\\sqrt{1+(\\omega''t/\\sigma^2)^2}=${v.fix(info.sTh, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Model',
      name: 'Damped waves and the telegraph equation',
      statement: String.raw`The damped wave (telegraph) equation $u_{tt}+2\gamma u_t=c^2u_{xx}$, $\gamma\ge0$, describes a string moving in a viscous medium or a signal on a lossy transmission line. With fixed ends or decay at infinity its energy $E=\tfrac12\int(u_t^2+c^2u_x^2)\,dx$ satisfies $E'(t)=-2\gamma\int u_t^2\,dx\le0$, hence $E_0e^{-4\gamma t}\le E(t)\le E_0$, and $\int u\,dx$ is conserved for data with $u_t=0$. Signals still travel at speed at most $c$, but for $\gamma t\gg1$ the solution is well approximated by the solution of the heat equation $w_t=\dfrac{c^2}{2\gamma}\,w_{xx}$ with the same initial position.`,
      idea: String.raw`Multiply the equation by $u_t$ and integrate by parts, exactly as for 2.4: the extra term gives $-2\gamma\int u_t^2$, so energy decays; since $\int u_t^2\le2E$ the rate is at most $4\gamma$. For strong damping $u_{tt}$ is negligible against $2\gamma u_t$ after a short transient (the characteristic time $1/2\gamma$), leaving $2\gamma u_t\approx c^2u_{xx}$, the diffusion equation with $D=c^2/2\gamma$. So one equation interpolates between two extremes: undamped waves with sharp fronts ($\gamma\to0$) and diffusive spreading ($\gamma\to\infty$).`,
      caption: String.raw`A Gaussian bump is released from rest. Top: the telegraph solution (blue, leapfrog scheme) against the heat equation with $D=c^2/2\gamma$ (orange, implicit scheme); bottom: the energy on a log scale between its two bounds $E_0$ and $E_0e^{-4\gamma t}$. Slide the damping $\gamma$: at $\gamma\approx0$ two pulses run apart at speed $c$ and the energy stays flat; at large $\gamma$ the pulse stays put, flattens like a diffusion, and the two curves lie on top of each other. The mass $\int u\,dx$ never changes.`,
      deps: ['pde-2.4'],
      refs: ['Strauss ch. 2'],
      tags: ['damping', 'telegraph equation', 'wave-to-diffusion'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Telegrapher%27s_equations' },
      viz(v) {
        const M = v.M, N = 400, LD = 20, C = 1, NU = 0.8, TT = 12, DT = (NU * (LD / N)) / C;
        const gS = v.slider('damping $\\gamma$', 0.1, 6, 1.5, { step: 0.05, onChange: () => S.reset() });
        const phi = (x) => Math.exp(-(((x - LD / 2) / 0.5) ** 2) / 2);
        const S = v.sim(() => {
          const g = gS.value, W = makeWave(N, LD, C, NU, phi, () => 0, { gamma: g }), e = W.energy(), dx = LD / N;
          const h = new Float64Array(N + 1); for (let i = 0; i <= N; i++) h[i] = phi(i * dx);
          h[0] = 0; h[N] = 0;
          return { W, h, D: (C * C) / (2 * g), E0: e.e, M0: W.u.reduce((a, b) => a + b, 0) * dx, hist: { t: [0], e: [e.e] } };
        }, (st) => {
          st.W.step();
          const r = (st.D * DT) / (st.W.dx ** 2), lo = new Float64Array(N + 1).fill(-r), di = new Float64Array(N + 1).fill(1 + 2 * r), up = new Float64Array(N + 1).fill(-r);
          di[0] = 1; up[0] = 0; di[N] = 1; lo[N] = 0;
          st.h = thomas(lo, di, up, st.h);
          st.hist.t.push(st.W.t); st.hist.e.push(st.W.energy().e);
        }, { dt: DT, maxSteps: 4000 });
        const A = v.stage({ x: [4, 16], y: [-0.1, 1.1], axes: 'box', gutter: true, height: 260, xlabel: 'x', title: 'telegraph solution vs heat equation', minWidth: 330, full: true });
        const B = v.stage({ x: [0, TT], y: [1e-3, 1.5], ylog: true, axes: 'box', gutter: true, height: 220, xlabel: 't', title: 'energy $E(t)$ (log scale)', minWidth: 330, full: true });
        let info = null;
        v.animate((t) => {
          S.advance(t);
          const st = S.state, W = st.W, dx = W.dx, g = gS.value;
          A.path(M.range(N + 1).map((i) => [i * dx, phi(i * dx)]), { color: 'muted', width: 1.4, dash: [5, 4] });
          A.path(M.range(N + 1).map((i) => [i * dx, st.h[i]]), { color: 'orange', width: 2.6 });
          A.path(M.range(N + 1).map((i) => [i * dx, W.u[i]]), { color: 'accent', width: 2.8 });
          A.corner(`t = ${v.fix(W.t, 2)}`, 'tr', { color: 'ink', weight: 600 });
          const h = st.hist, E0 = st.E0;
          B.path(M.range(121).map((i) => [(TT * i) / 120, E0 * Math.exp(-4 * g * ((TT * i) / 120))]).map(([x, y]) => [x, Math.max(y, 1e-3)]), { color: 'red', width: 1.4, dash: [6, 4] });
          B.hline(E0, { color: 'green', width: 1.4, dash: [6, 4] });
          B.path(h.t.map((t2, i) => [t2, Math.max(h.e[i], 1e-3)]), { color: 'accent', width: 2.8 });
          let mass = 0, mh = 0, d2 = 0, n2 = 0;
          for (let i = 0; i <= N; i++) { mass += W.u[i] * dx; mh += st.h[i] * dx; d2 += (W.u[i] - st.h[i]) ** 2; n2 += W.u[i] ** 2; }
          info = { t: W.t, E: h.e[h.e.length - 1] / E0, mass, mass0: st.M0, mh, rel: Math.sqrt(d2 / Math.max(n2, 1e-12)), g, D: st.D, lo: Math.exp(-4 * g * W.t) };
        }, { period: TT, still: 4 });
        v.legend([['muted', 'initial bump', { dash: true }], ['accent', 'telegraph'], ['orange', 'heat, $D=c^2/2\\gamma$'], ['green', '$E_0$', { dash: true }], ['red', '$E_0e^{-4\\gamma t}$', { dash: true }]]);
        v.readout(() => info && `$\\gamma=${v.fix(info.g, 2)}$, $D=c^2/2\\gamma=${v.fix(info.D, 3)}$, $t=${v.fix(info.t, 2)}$: $E/E_0=${v.fix(info.E, 4)}$ (the bounds give $${v.sci(Math.max(info.lo, 1e-9), 2)}\\le E/E_0\\le1$) · $\\int u\\,dx=${v.fix(info.mass, 4)}$ (initially ${v.fix(info.mass0, 4)}) · relative $L^2$ distance between telegraph and heat solutions: ${v.fix(100 * info.rel, 1)}%${info.g * info.t < 1 ? ' (still in the wave regime: $\\gamma t<1$)' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Paper',
      name: 'Recherches sur la courbe que forme une corde tenduë…',
      paper: { authors: 'Jean le Rond d’Alembert', year: 1747, title: 'Recherches sur la courbe que forme une corde tenduë mise en vibration', venue: 'Histoire de l’Académie Royale des Sciences et Belles-Lettres de Berlin 3: 214–219', url: 'https://books.google.com/books?id=lJQDAAAAMAAJ&pg=PA214' },
      introduces: ['pde-1.3', 'pde-2.1'],
      credit: 'J. le R. d’Alembert, 1747',
      statement: String.raw`D'Alembert's memoir (dated 1747) treats a taut string of length $\ell$ fixed at both ends and writes down, for the first time, a partial differential equation of the motion: in modern notation $u_{tt}=c^2u_{xx}$, with $c^2$ the tension over the line density. He found its general solution as a sum of two arbitrary functions of $x+ct$ and $x-ct$, i.e. two waves running in opposite directions at speed $c$. The fixed ends then force the left- and right-moving parts to be negatives of each other: with $u=f(x+ct)+g(x-ct)$, the condition $u(0,t)=0$ gives $g=-f$ and $u(\ell,t)=0$ gives $f(\xi+2\ell)=f(\xi)$. The solution is thus built from one $2\ell$-periodic odd function: **the motion is periodic in time with period $2\ell/c$**, and half a period later the string is the upside-down mirror image of its initial shape.`,
      idea: String.raw`Before 1747 the string was understood through Taylor's single-mode motion (1713) and Newton-style tension arguments; no partial differential equation of continuum motion had been written down. D'Alembert introduced the *partial* differential equation of the vibrating string and solved it by the method of two arbitrary functions, an idea that opened analysis to PDEs of mathematical physics (1.3, 2.1). In his account the initial shape had to be given by a single analytic expression, which excluded a plucked, angular string; Euler (1748) argued that any shape one can draw is allowed, and Daniel Bernoulli (1753) proposed trigonometric series, starting a debate that led to the modern notions of function and Fourier series. The picture is recreated here from the secondary accounts; the original memoir was not consulted for this item, and the notation $\Phi(t+s)+\Gamma(t-s)$ of the paper is replaced by $f(x+ct)+g(x-ct)$.`,
      caption: String.raw`Pluck the string: drag the handle (and choose a shape). The top-left panel shows the string; the top-right panel is the *unfolded* picture, where the odd, $2\ell$-periodic extension of the initial shape is cut in half, one half $\tfrac12\varphi_{\rm odd}(x+ct)$ running left (blue) and the other $\tfrac12\varphi_{\rm odd}(x-ct)$ running right (orange); the string itself is the unshaded window $[0,\ell]$; when a half-height copy leaves it through an end, its inverted image enters through the same end, which is reflection with inversion. Switch on Bernoulli's trigonometric series with $n$ terms and compare. The space–time map repeats with period $2\ell/c$. The readouts compare the claims of the paper with exact numbers from today's formula.`,
      deps: ['mech-1.6'],
      refs: [],
      tags: ['vibrating string', 'history', 'travelling waves'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jean_le_Rond_d%27Alembert' },
      viz(v) {
        const M = v.M, L = 1;
        const shape = v.select('initial shape', [{ value: 'tri', label: 'plucked (triangle)' }, { value: 'smooth', label: 'smooth hump' }, { value: 'trap', label: 'flat-topped' }], 'tri');
        const cS = v.slider('$c$', 0.5, 2, 1, { step: 0.05 });
        const bern = v.toggle('Bernoulli’s series', false);
        const nS = v.slider('terms $n$', 1, 40, 5, { int: true });
        const S1 = v.stage({ x: [0, L], y: [-1.35, 1.35], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: 'the string', minWidth: 280 });
        const S2 = v.stage({ x: [-1.5, 2.5], y: [-1.35, 1.35], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: 'two travelling halves of the extended shape', minWidth: 300 });
        const S3 = v.stage({ x: [0, L], y: [0, 4], axes: 'box', gutter: true, height: 230, xlabel: 'x', ylabel: 't', title: 'space–time: repeats every $2\\ell/c$', minWidth: 280, full: true });
        const H = S1.handle(0.3, 0.9, { color: 'gold', r: 7, label: 'pluck', constrain: (x, y) => [M.clamp(x, 0.1, 0.9), M.clamp(y, 0.1, 1.2)] });
        const shp = (kind, xp, h) => {
          if (kind === 'tri') return (x) => (x <= xp ? h * (x / xp) : h * ((L - x) / (L - xp)));
          if (kind === 'smooth') return (x) => h * Math.exp(-(((x - xp) / 0.1) ** 2)) * Math.sin(Math.PI * x) ** 0.3;
          return (x) => h * M.clamp(Math.min(x - (xp - 0.2), xp + 0.2 - x) / 0.1, 0, 1);
        };
        let info = null;
        v.animate((t) => {
          const c = cS.value, xp = H.x, h = H.y, kind = shape.value, phi = shp(kind, xp, h), pe = extend(phi, L, -1, -1);
          const u = (x, tt) => 0.5 * (pe(x + c * tt) + pe(x - c * tt));
          nS.el.hidden = !bern.value;
          S1.fn(phi, { color: 'muted', width: 1.4, dash: [5, 4], n: 500 });
          const NB = 60, b = []; for (let k = 1; k <= NB; k++) { let s = 0; const nq = 600; for (let i = 0; i < nq; i++) { const x = (i + 0.5) / nq; s += phi(x) * Math.sin(k * Math.PI * x); } b.push((2 * s) / nq); }
          const ub = (x, tt, n) => { let s = 0; for (let k = 1; k <= n; k++) s += b[k - 1] * Math.sin(k * Math.PI * x) * Math.cos(k * Math.PI * c * tt); return s; };
          if (bern.value) S1.fn((x) => ub(x, t, nS.value), { color: 'orange', width: 2.4, n: 500 });
          S1.fn((x) => u(x, t), { color: 'accent', width: 3, n: 800 });
          S1.corner(`t = ${v.fix(t, 2)}`, 'tr', { color: 'ink', weight: 600 });
          S2.rect(-1.5, -1.35, 0, 1.35, { fill: 'ink', fillAlpha: 0.05, stroke: false }); S2.rect(L, -1.35, 2.5, 1.35, { fill: 'ink', fillAlpha: 0.05, stroke: false });
          S2.vline(0, { color: 'ink', width: 2 }); S2.vline(L, { color: 'ink', width: 2 });
          S2.fn((x) => 0.5 * pe(x + c * t), { color: 'accent', width: 2.2, n: 800 });
          S2.fn((x) => 0.5 * pe(x - c * t), { color: 'orange', width: 2.2, n: 800 });
          S2.fn((x) => u(x, t), { color: 'ink', width: 1.6, alpha: 0.8, domain: [0, L], n: 600 });
          S3.heat((x, y) => M.clamp(u(x, y) / Math.max(h, 0.3), -1, 1), { range: [-1, 1], cmap: 'theme-diverging', neg: 'orange', pos: 'accent', res: 3, key: `${kind}|${xp.toFixed(3)}|${h.toFixed(3)}|${c}` });
          S3.hline(t, { color: 'ink', width: 1.5, dash: [6, 4] });
          const T = (2 * L) / c; let ePer = 0, eHalf = 0, eB = 0;
          for (let i = 0; i <= 200; i++) { const x = i / 200; ePer = Math.max(ePer, Math.abs(u(x, T) - phi(x))); eHalf = Math.max(eHalf, Math.abs(u(x, T / 2) + phi(L - x))); eB = Math.max(eB, Math.abs(ub(x, t, nS.value) - u(x, t))); }
          info = { T, ePer, eHalf, eB, t, kind };
        }, { period: 4, still: 0.6 });
        v.legend([['muted', 'initial shape', { dash: true }], ['accent', 'left-mover $\\tfrac12\\varphi_{\\rm odd}(x+ct)$'], ['orange', 'right-mover $\\tfrac12\\varphi_{\\rm odd}(x-ct)$'], ['ink', 'the string']]);
        v.readout(() => info && `paper’s claims, tested on the formula: period $2\\ell/c=${v.fix(info.T, 3)}$ — $\\max_x|u(x,T)-\\varphi(x)|=${v.sci(Math.max(info.ePer, 1e-16), 2)}$ · half period: $\\max_x|u(x,T/2)+\\varphi(\\ell-x)|=${v.sci(Math.max(info.eHalf, 1e-16), 2)}$ (inverted mirror image)` + (bern.value ? `\nBernoulli’s sum with $n=${nS.value}$ terms differs from the two-wave solution by at most $${v.fix(info.eB, 4)}$ at $t=${v.fix(info.t, 2)}$ (the series converges slowly at the corner of a pluck: error $\\sim1/n$)` : ''));
      },
    },
  ],
};
