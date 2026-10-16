// Partial Differential Equations — Chapter 3: The diffusion equation
import { makeHeat, sineCoeffs, spline, G, convolveCells } from './ch03.shared.js';

export default {
  collection: 'pde',
  chapter: 3,
  title: 'The diffusion equation',
  summary: String.raw`Diffusion is the opposite of waves in almost every way. Solutions obey a maximum principle, become infinitely smooth instantly, and feel a change in the data everywhere at once. On the whole line the solution is a convolution with the Gaussian heat kernel, reflections handle a half-line, and Duhamel’s principle handles sources. Running time backwards is catastrophically ill posed, and uniqueness needs growth conditions.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'Weak maximum principle for the heat equation',
      statement: String.raw`Let $\ell,T>0$, $Q=[0,\ell]\times[0,T]$, and let $\Gamma=\{t=0\}\cup\{x=0\}\cup\{x=\ell\}$ be the *parabolic boundary* (the bottom and the two sides; the top $t=T$ is not in $\Gamma$). If $u$ is continuous on $Q$, of class $C^2$ in $x$ and $C^1$ in $t$ for $0<x<\ell,\ 0<t\le T$, and $u_t\le k\,u_{xx}$ there ($k>0$; in particular if $u_t=ku_{xx}$), then
$$\max_{Q}u=\max_{\Gamma}u .$$
For a solution the same holds for the minimum, so a solution never exceeds the largest and never drops below the smallest value found on the bottom and the sides. The same statement holds in any number of space dimensions.`,
      idea: String.raw`Compactness of $Q$ and continuity of $u$ give a maximum point (extreme value theorem). Suppose first $u_t-ku_{xx}<0$ strictly. At a maximum in the interior or on the top, $u_t\ge0$ and $u_{xx}\le0$, so $u_t-ku_{xx}\ge0$, a contradiction: the maximum lies on $\Gamma$. For the general case apply this to $w=u-\varepsilon t$, which satisfies $w_t-kw_{xx}=u_t-ku_{xx}-\varepsilon<0$, and let $\varepsilon\to0$. Heat can only flow in from the bottom or the sides; nothing in the interior can create a new hot spot, and the hypothesis $u_t\le ku_{xx}$ (no heat source) is exactly what the proof uses.`,
      caption: String.raw`Edit the initial temperature (left panel, nine handles) and the temperatures held at the two ends ($g_0$ in blue, $g_1$ in orange, middle panel). The right panel is the computed solution on the space–time rectangle (time upward). The bottom and sides, the parabolic boundary, are outlined; the gold dot marks where the largest value of the whole rectangle sits and the green dot the largest value on the parabolic boundary: they agree. Now raise the source $q$: the equation becomes $u_t=ku_{xx}+q\,\phi(x)$, the hypothesis $u_t\le ku_{xx}$ fails, and the maximum can move into the interior or onto the top.`,
      deps: ['pde-1.4', 'pma-4.16'],
      refs: ['Strauss §2.3', 'Evans §2.3'],
      tags: ['maximum principle', 'heat equation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Maximum_principle' },
      viz(v) {
        const M = v.M, NX = 60, NT = 100, DT = 0.01;
        const kS = v.slider('diffusivity $k$', 0.02, 0.4, 0.1, { step: 0.01 });
        const qS = v.slider('heat source $q$', 0, 3, 0, { step: 0.1 });
        const A = v.stage({ x: [0, 1], y: [-1, 1.3], axes: 'box', gutter: true, height: 230, xlabel: 'x', title: 'initial temperature $u(x,0)$', minWidth: 250 });
        const B = v.stage({ x: [0, 1], y: [-1, 1.3], axes: 'box', gutter: true, height: 230, xlabel: 't', title: 'end temperatures $g_0(t)$, $g_1(t)$', minWidth: 250 });
        const C = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, height: 230, xlabel: 'x', ylabel: 't', title: 'solution on the rectangle', minWidth: 250 });
        const x0s = Array.from({ length: 9 }, (_, i) => i / 8), y0 = [0.3, 0.6, 0.9, 0.2, -0.2, 0.5, 1.0, 0.6, 0.1];
        const hA = x0s.map((x, i) => A.handle(x, y0[i], { color: 'orange', r: 5.5, constrain: (xx, y) => [x, M.clamp(y, -0.95, 1.25)] }));
        const hL = [0.5, 1].map((t, i) => B.handle(t, [0.9, -0.5][i], { color: 'accent', r: 5.5, constrain: (x, y) => [t, M.clamp(y, -0.95, 1.25)] }));
        const hR = [0.5, 1].map((t, i) => B.handle(t, [-0.3, 0.8][i], { color: 'orange', r: 5.5, constrain: (x, y) => [t, M.clamp(y, -0.95, 1.25)] }));
        let sol = null, key = '';
        const solve = () => {
          const u0 = spline(x0s, hA.map((h) => h.y)), gl = spline([0, 0.5, 1], [hA[0].y, hL[0].y, hL[1].y]), gr = spline([0, 0.5, 1], [hA[8].y, hR[0].y, hR[1].y]);
          const H = makeHeat(NX, 0, 1, kS.value, { gl, gr });
          for (let i = 0; i <= NX; i++) H.u[i] = u0(H.x[i]);
          const F = (x) => qS.value * Math.exp(-(((x - 0.5) / 0.15) ** 2));
          const U = [Float64Array.from(H.u)];
          for (let n = 0; n < NT; n++) { H.step(DT, F); U.push(Float64Array.from(H.u)); }
          let mxAll = -Infinity, ai = 0, an = 0, mxG = -Infinity, gi = 0, gn = 0, mxTop = -Infinity, mxInt = -Infinity;
          for (let n = 0; n <= NT; n++) for (let i = 0; i <= NX; i++) {
            const val = U[n][i], onG = n === 0 || i === 0 || i === NX;
            if (val > mxAll + 1e-14) { mxAll = val; ai = i; an = n; }
            if (onG && val > mxG + 1e-14) { mxG = val; gi = i; gn = n; }
            if (n === NT) mxTop = Math.max(mxTop, val);
            if (!onG) mxInt = Math.max(mxInt, val);
          }
          sol = { u0, gl, gr, U, mxAll, ai, an, mxG, gi, gn, mxTop, mxInt };
        };
        v.render(() => {
          key = [kS.value, qS.value, ...hA.map((h) => h.y), ...hL.map((h) => h.y), ...hR.map((h) => h.y)].map((z) => (+z).toFixed(4)).join('|');
          if (!sol || sol.key !== key) { solve(); sol.key = key; }
          A.fn(sol.u0, { color: 'orange', width: 2.6 });
          B.fn(sol.gl, { color: 'accent', width: 2.6, domain: [0, 1] });
          B.fn(sol.gr, { color: 'orange', width: 2.6, domain: [0, 1] });
          B.dot(0, hA[0].y, { color: 'accent', r: 4 }); B.dot(0, hA[8].y, { color: 'orange', r: 4 });
          const U = sol.U;
          C.heat((x, t) => {
            const q = M.clamp(x, 0, 1) * NX, i = Math.min(NX - 1, Math.floor(q)), r = q - i, tn = M.clamp(Math.round(t * NT), 0, NT);
            return U[tn][i] * (1 - r) + U[tn][i + 1] * r;
          }, { range: [-1.2, 1.4], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 3, key });
          C.path([[0, 1], [0, 0], [1, 0], [1, 1]], { color: 'orange', width: 3.2 });
          C.line(0, 1, 1, 1, { color: 'muted', width: 1.5, dash: [5, 4] });
          C.dot(sol.ai / NX, sol.an / NT, { color: 'gold', r: 7, label: 'max', labelPos: 'ne' });
          C.dot(sol.gi / NX, sol.gn / NT, { color: 'green', r: 4 });
        });
        v.legend([['orange', 'parabolic boundary'], ['gold', 'maximum of the rectangle'], ['green', 'maximum on the boundary']]);
        v.readout(() => {
          if (!sol) return '';
          const onB = sol.mxAll <= sol.mxG + 1e-9;
          return `$\\max_{\\Gamma}u=${v.fix(sol.mxG, 4)}$ · $\\max_Q u=${v.fix(sol.mxAll, 4)}$ · largest value on the top $t=T$: $${v.fix(sol.mxTop, 4)}$, in the open interior: $${v.fix(sol.mxInt, 4)}$\n` +
            (onB ? 'the largest value of the rectangle is found on the parabolic boundary ✓' : `$\\max_Q u>\\max_\\Gamma u$ by ${v.fix(sol.mxAll - sol.mxG, 4)}: the source makes $u_t>ku_{xx}$, so the principle no longer applies`);
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'Uniqueness and stability for the heat equation',
      statement: String.raw`Consider $u_t=ku_{xx}$ on $(0,\ell)\times(0,T]$ with $u(x,0)=\varphi(x)$, $u(0,t)=g_0(t)$, $u(\ell,t)=g_1(t)$. It has at most one solution $u\in C^2_1\cap C(\overline Q)$. Moreover, if $u_1,u_2$ are solutions with data $(\varphi_i,g_{0,i},g_{1,i})$, then
$$\max_Q|u_1-u_2|\le\max_\Gamma|\text{difference of the data}|,$$
and for homogeneous Dirichlet data the energy $E(t)=\int_0^\ell(u_1-u_2)^2\,dx$ is nonincreasing, $E'(t)=-2k\int_0^\ell(u_1-u_2)_x^2\,dx\le 0$.`,
      idea: String.raw`The difference $D=u_1-u_2$ again solves the heat equation (it is linear), so the weak maximum principle (3.1) applied to $D$ and to $-D$ bounds $|D|$ on $Q$ by its values on the parabolic boundary; if the data coincide, $D\equiv0$. This is uniqueness and, in the sup norm, stability with constant $1$ (data in $\varepsilon$, solutions in $\varepsilon$). The energy method gives the same in $L^2$: differentiate $\int D^2$, use $D_t=kD_{xx}$ and integrate by parts; the boundary terms vanish for $D=0$ at the ends, leaving $-2k\int D_x^2$.`,
      caption: String.raw`Two initial temperatures differ by a perturbation of sup-size exactly $\varepsilon$ (a bump you can drag, a ripple of chosen frequency, or noise); the ends are held at $0$. Slide time: the left panel shows both solutions, the middle one their difference $D$ inside the band $\pm\varepsilon$. On the right the sup norm of $D$ (blue, divided by $\varepsilon$) and the energy $\int D^2$ (orange, divided by its initial value) both fall. High-frequency ripples die fastest, at rate $k n^2\pi^2$. The readout compares the finite-difference slope of $E$ with $-2k\int D_x^2$.`,
      deps: ['pde-3.1'],
      refs: ['Strauss §2.3'],
      tags: ['uniqueness', 'stability', 'energy'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_equation' },
      viz(v) {
        const M = v.M, K = 90, NG = 201, k = 0.25;
        const typ = v.select('perturbation', [{ value: 'bump', label: 'bump' }, { value: 'ripple', label: 'ripple' }, { value: 'noise', label: 'noise' }], 'bump');
        const eS = v.slider('size $\\varepsilon$', 0.02, 0.5, 0.2, { step: 0.01 });
        const wS = v.slider('bump width', 0.03, 0.3, 0.08, { step: 0.01 });
        const mS = v.slider('ripple mode $n$', 1, 40, 12, { int: true });
        const tS = v.slider('time $t$', 0, 1.5, 0.05, { step: 0.01 });
        const P1 = v.stage({ x: [0, 1], y: [-1.4, 1.4], axes: 'box', gutter: true, height: 210, xlabel: 'x', title: 'the two solutions $u_1$ (blue), $u_2$ (orange)', minWidth: 260 });
        const P2 = v.stage({ x: [0, 1], y: [-0.55, 0.55], axes: 'box', gutter: true, height: 210, xlabel: 'x', title: 'difference $D=u_2-u_1$', minWidth: 260 });
        const P3 = v.stage({ x: [0, 1.5], y: [0, 1.1], axes: 'box', gutter: true, height: 210, xlabel: 't', title: 'sup norm and energy of $D$', minWidth: 260 });
        const hC = P2.handle(0.5, 0.2, { color: 'orange', r: 7, label: 'centre', constrain: (x) => [M.clamp(x, 0.08, 0.92), 0.2] });
        const xg = M.range(NG).map((i) => i / (NG - 1));
        const SIN = Array.from({ length: K }, (_, n) => Float64Array.from(xg, (x) => Math.sin((n + 1) * Math.PI * x)));
        const COS = Array.from({ length: K }, (_, n) => Float64Array.from(xg, (x) => Math.cos((n + 1) * Math.PI * x)));
        const phi1 = (x) => 0.9 * Math.sin(Math.PI * x) + 0.45 * Math.sin(3 * Math.PI * x) - 0.3 * Math.sin(5 * Math.PI * x);
        const b1 = sineCoeffs(phi1, K);
        const r = v.rng(11), noiseC = Float64Array.from({ length: K }, (_, n) => r.normal() / Math.sqrt(1 + n * 0.3));
        let st = null;
        const pert = () => {
          if (typ.value === 'bump') return (x) => Math.exp(-(((x - hC.x) / wS.value) ** 2));
          if (typ.value === 'ripple') return (x) => Math.sin(mS.value * Math.PI * x);
          return (x) => { let s = 0; for (let n = 1; n <= K; n++) s += noiseC[n - 1] * Math.sin(n * Math.PI * x); return s; };
        };
        const build = () => {
          const f = pert(); let mx = 0; for (const x of xg) mx = Math.max(mx, Math.abs(f(x)));
          const bd = sineCoeffs(f, K, 1600).map((b) => (b * eS.value) / mx);
          // sup and energy over time
          const ts = M.range(76).map((i) => (1.5 * i) / 75), sup = [], en = [], enx = [];
          for (const t of ts) {
            let s = 0, e = 0;
            const dec = bd.map((b, n) => b * Math.exp(-k * (n + 1) ** 2 * Math.PI ** 2 * t));
            for (let i = 0; i < NG; i++) { let d = 0; for (let n = 0; n < K; n++) d += dec[n] * SIN[n][i]; s = Math.max(s, Math.abs(d)); }
            for (let n = 0; n < K; n++) e += 0.5 * dec[n] * dec[n];
            sup.push(s); en.push(e);
          }
          st = { bd, ts, sup, en, key: [typ.value, eS.value, wS.value, mS.value, hC.x].join('|') };
        };
        v.render(() => {
          const key = [typ.value, eS.value, wS.value, mS.value, hC.x].join('|');
          if (!st || st.key !== key) build();
          mS.el.hidden = typ.value !== 'ripple'; wS.el.hidden = typ.value !== 'bump'; hC.visible = typ.value === 'bump';
          const t = tS.value, bd = st.bd, ex = (n) => Math.exp(-k * (n + 1) ** 2 * Math.PI ** 2 * t);
          const Dx = (i) => { let d = 0; for (let n = 0; n < K; n++) d += bd[n] * ex(n) * SIN[n][i]; return d; };
          const U1 = (i) => { let d = 0; for (let n = 0; n < K; n++) d += b1[n] * ex(n) * SIN[n][i]; return d; };
          const d = xg.map((_, i) => Dx(i)), u1 = xg.map((_, i) => U1(i));
          P1.path(xg.map((x, i) => [x, u1[i]]), { color: 'accent', width: 2.8 });
          P1.path(xg.map((x, i) => [x, u1[i] + d[i]]), { color: 'orange', width: 2.2 });
          P2.hband(-eS.value, eS.value, { color: 'accent', alpha: 0.1 });
          P2.hline(eS.value, { color: 'accent', width: 1, dash: [5, 4] }); P2.hline(-eS.value, { color: 'accent', width: 1, dash: [5, 4] });
          P2.path(xg.map((x, i) => [x, d[i]]), { color: 'ink', width: 2.6 });
          P3.path(st.ts.map((tt, i) => [tt, st.sup[i] / eS.value]), { color: 'accent', width: 2.8 });
          P3.path(st.ts.map((tt, i) => [tt, st.en[i] / st.en[0]]), { color: 'orange', width: 2.8 });
          P3.hline(1, { color: 'faint', width: 1, dash: [4, 4] });
          P3.vline(t, { color: 'gold', width: 1.5 });
          const i0 = Math.min(75, Math.round((t / 1.5) * 75));
          P3.dot(t, st.sup[i0] / eS.value, { color: 'accent', r: 5 }); P3.dot(t, st.en[i0] / st.en[0], { color: 'orange', r: 5 });
          // energy slope check: E'(t) vs −2k ∫ D_x² (Parseval: ∫D_x² = ½ Σ (nπ b_n e^{..})²)
          const E = (tt) => { let e = 0; for (let n = 0; n < K; n++) e += 0.5 * (bd[n] * Math.exp(-k * (n + 1) ** 2 * Math.PI ** 2 * tt)) ** 2; return e; };
          const hh = 1e-4, Ep = (E(t + hh) - E(Math.max(0, t - hh))) / (t > 0 ? 2 * hh : hh);
          let Dx2 = 0; for (let n = 0; n < K; n++) Dx2 += 0.5 * ((n + 1) * Math.PI * bd[n] * ex(n)) ** 2;
          st.info = { sup: Math.max(...d.map(Math.abs)), E: E(t), Ep, rhs: -2 * k * Dx2, maxSup: Math.max(...st.sup) };
        });
        v.legend([['accent', '$\\max|D|/\\varepsilon$'], ['orange', '$E(t)/E(0)$']]);
        v.readout(() => st && st.info && `$\\varepsilon=${v.fix(eS.value, 2)}$ · $\\max_x|D(x,t)|=${v.fix(st.info.sup, 4)}$, and its maximum over all $t$ is $${v.fix(st.info.maxSup, 4)}\\le\\varepsilon$ ✓\n` +
          `$E(t)=${v.sci(st.info.E, 3)}$ · $E'(t)=-${v.sci(Math.abs(st.info.Ep), 3)}$ versus $-2k\\!\\int D_x^2=-${v.sci(Math.abs(st.info.rhs), 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'The heat kernel (fundamental solution)',
      statement: String.raw`The **heat kernel** (fundamental solution of $u_t=ku_{xx}$ on $\R$) is
$$\Phi(x,t)=\frac{1}{\sqrt{4\pi kt}}\,e^{-x^2/(4kt)},\qquad t>0 .$$
It solves the heat equation for $t>0$, is positive, satisfies $\int_{\R}\Phi(x,t)\,dx=1$ for every $t>0$, and concentrates at the origin as $t\to0^+$: $\Phi(\cdot,t)\to\delta_0$ (for every $\delta>0$, $\int_{|x|>\delta}\Phi\,dx\to0$). It is the temperature produced by a unit of heat placed at a single point at time $0$. Its width is $\sigma=\sqrt{2kt}$ and its height $(4\pi kt)^{-1/2}$.`,
      idea: String.raw`Take the Fourier transform in $x$: the equation becomes $\hat u_t=-k\xi^2\hat u$, so $\hat u(\xi,t)=\hat g(\xi)e^{-k\xi^2t}$, and $e^{-k\xi^2t}$ is the transform of a Gaussian because a Gaussian is its own Fourier transform up to rescaling (fa-7.6). Equivalently, $\Phi$ is invariant under the scaling $x\mapsto\lambda x,\ t\mapsto\lambda^2t$ (with a factor $\lambda^{-1}$ in height), which is why $\Phi(x,t)=t^{-1/2}\Phi(x/\sqrt t,1)$: one profile, stretched.`,
      caption: String.raw`Left: the kernel as time runs (log scale in $t$); the shaded area is always $1$ (numerical integral in the readout). Middle (log–log): the height falls like $t^{-1/2}$ and the width $\sigma$ grows like $t^{1/2}$, with the dashed reference slopes $\mp\tfrac12$; the product height$\times\sigma$ is constant. Right: rescale $x$ by $\sqrt t$ and the height by $\sqrt t$: every moment of time lands on the same curve. Change $k$ to move along the time axis (only $kt$ matters), or untick *play* to choose $t$ yourself.`,
      deps: ['pde-1.4', 'fa-7.6'],
      refs: ['Strauss §2.4', 'Evans §2.3'],
      tags: ['heat kernel', 'fundamental solution', 'self-similarity'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_kernel' },
      viz(v) {
        const M = v.M, T0 = 0.01, T1 = 4;
        const kS = v.slider('diffusivity $k$', 0.1, 3, 1, { step: 0.05 });
        const tS = v.slider('time $t$', T0, T1, 0.2, { log: true });
        const play = v.toggle('play', true);
        const P1 = v.stage({ x: [-4, 4], y: [0, 3], axes: 'box', gutter: true, height: 230, xlabel: 'x', title: 'the kernel $\\Phi(x,t)$', minWidth: 250 });
        const P2 = v.stage({ x: [T0, T1], y: [0.1, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 230, xlabel: 't', title: 'height and width', minWidth: 250 });
        const P3 = v.stage({ x: [-6, 6], y: [0, 0.4], axes: 'box', gutter: true, height: 230, xlabel: 'x/√t', title: 'rescaled: $\\sqrt t\\,\\Phi(\\sqrt t\\,\\xi,t)$', minWidth: 250 });
        let info = null;
        v.animate((tt) => {
          const k = kS.value;
          if (play.value) tS.set(T0 * Math.pow(T1 / T0, (tt % 9) / 9));
          const t = tS.value, h = 1 / Math.sqrt(4 * Math.PI * k * t), sg = Math.sqrt(2 * k * t);
          P1.fn((x) => G(x, t, k), { color: 'accent', width: 2.8, fill: true, fillAlpha: 0.18 });
          P1.dot(0, h, { color: 'gold', r: 4.5 });
          P1.corner(`t = ${v.fix(t, 3)}`, 'tr', { color: 'ink', weight: 600 });
          const ts = M.range(60).map((i) => T0 * Math.pow(T1 / T0, i / 59));
          P2.path(ts.map((x) => [x, 1 / Math.sqrt(4 * Math.PI * k * x)]), { color: 'accent', width: 2.6 });
          P2.path(ts.map((x) => [x, Math.sqrt(2 * k * x)]), { color: 'orange', width: 2.6 });
          P2.path(ts.map((x) => [x, 0.45 * Math.pow(x, -0.5)]), { color: 'muted', width: 1, dash: [5, 4] });
          P2.path(ts.map((x) => [x, 0.55 * Math.pow(x, 0.5)]), { color: 'muted', width: 1, dash: [5, 4] });
          P2.dot(t, h, { color: 'accent', r: 5 }); P2.dot(t, sg, { color: 'orange', r: 5 });
          P2.text('height ∝ t^(−1/2)', 0.3, 2.1, { color: 'accent', size: 12, align: 'left' });
          P2.text('width σ ∝ t^(1/2)', 0.012, 0.42, { color: 'orange', size: 12, align: 'left' });
          for (const tt2 of [0.02, 0.05, 0.15, 0.5, 1.5, 4]) P3.fn((xi) => Math.sqrt(tt2) * G(Math.sqrt(tt2) * xi, tt2, k), { color: 'faint', width: 3.5 });
          P3.fn((xi) => Math.sqrt(t) * G(Math.sqrt(t) * xi, t, k), { color: 'gold', width: 1.8 });
          const L = 14 * sg, area = M.integrate((x) => G(x, t, k), -L, L, 800);
          info = { t, h, sg, area };
        }, { period: 9, still: 3 });
        v.legend([['accent', 'height $(4\\pi kt)^{-1/2}$'], ['orange', 'width $\\sqrt{2kt}$'], ['gold', 'current profile']]);
        v.readout(() => info && `$t=${v.fix(info.t, 3)}$ · $\\int\\Phi\\,dx=${v.fix(info.area, 6)}$ · height $=${v.fix(info.h, 3)}$ · $\\sigma=${v.fix(info.sg, 3)}$ · height$\\times\\sigma=${v.fix(info.h * info.sg, 5)}\\ (=1/\\sqrt{2\\pi}=${v.fix(1 / Math.sqrt(2 * Math.PI), 5)})$`);
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Solution of the heat equation on the line by convolution',
      statement: String.raw`Let $g$ be bounded and continuous on $\R$. Then
$$u(x,t)=(\Phi(\cdot,t)*g)(x)=\int_{\R}\frac{1}{\sqrt{4\pi kt}}\,e^{-(x-y)^2/(4kt)}\,g(y)\,dy,\qquad t>0,$$
is $C^\infty$ for $t>0$, solves $u_t=ku_{xx}$, and $u(x,t)\to g(x)$ as $(x,t)\to(x_0,0^+)$ at every point of continuity; it is the unique bounded solution with this initial value. The formula also makes sense (and gives a solution for $t>0$) for bounded piecewise-continuous $g$, taking the values $g(x_0\pm)$ averaged at jumps.`,
      idea: String.raw`Differentiating under the integral shows $u$ solves the equation, since every $\partial_x^m\partial_t^j\Phi$ is integrable against a bounded $g$. The initial values come from the fact that $\Phi(\cdot,t)$ is an approximate identity (fa-6.31): positive, total mass $1$, mass escaping from every neighbourhood of $0$ as $t\to0^+$, so $\Phi*g\to g$ where $g$ is continuous. Uniqueness among bounded solutions follows from the maximum principle on large intervals (see also 3.12 for what happens without a bound).`,
      caption: String.raw`Draw the initial temperature with the mouse (drag across the left panel) or pick a preset; move time $t$ and diffusivity $k$. The solid blue curve is the convolution with the heat kernel (each data cell integrated against $\Phi$ exactly through the error function); the dashed orange one is an independent finite-difference solution (Crank–Nicolson after four backward-Euler start-up steps, cell size $0.05$) and the readout gives the largest difference. Drag the gold handle $x_0$: the lower panel shows the weight $\Phi(x_0-y,t)$ and the product with the data, whose area is $u(x_0,t)$.`,
      deps: ['pde-3.3', 'fa-6.31'],
      refs: ['Strauss §2.4', 'Evans §2.3'],
      tags: ['convolution', 'heat kernel'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_equation' },
      viz(v) {
        const M = v.M, N = 240, LH = 6, h = (2 * LH) / N;
        const xs = Float64Array.from({ length: N }, (_, j) => -LH + (j + 0.5) * h);
        let D = new Float64Array(N);
        const preset = (name) => {
          for (let j = 0; j < N; j++) {
            const x = xs[j];
            D[j] = name === 'box' ? (Math.abs(x) < 1 ? 1 : 0)
              : name === 'two' ? (Math.abs(x + 2) < 0.5 ? 1 : 0) + (Math.abs(x - 1.5) < 1 ? 0.6 : 0)
              : name === 'saw' ? (x > -2 && x < 2 ? (x + 2) / 4 : 0)
              : name === 'comb' ? (Math.abs(x) < 3 && Math.floor((x + 3) * 2) % 2 === 0 ? 1 : 0) : 0;
          }
        };
        preset('two');
        const pre = v.select('preset', [{ value: 'two', label: 'two blocks' }, { value: 'box', label: 'box' }, { value: 'saw', label: 'ramp' }, { value: 'comb', label: 'comb' }], 'two', { onChange: (val) => preset(val) });
        v.button('clear', () => D.fill(0));
        const kS = v.slider('diffusivity $k$', 0.05, 0.5, 0.25, { step: 0.01 });
        const tS = v.slider('time $t$', 0.02, 2, 0.4, { step: 0.01 });
        const P1 = v.stage({ x: [-LH, LH], y: [-0.25, 1.3], axes: 'box', gutter: true, height: 250, xlabel: 'x', title: 'draw $g$ here; solution $u(\\cdot,t)$', minWidth: 330, full: true });
        const P2 = v.stage({ x: [-LH, LH], y: [0, 1.3], axes: 'box', gutter: true, height: 170, xlabel: 'y', title: 'weight $\\Phi(x_0-y,t)$ and product with $g$', minWidth: 330, full: true });
        const hx = P1.handle(-1, 0, { color: 'gold', r: 7, label: 'x₀', constrain: (x) => [M.clamp(x, -LH + 0.2, LH - 0.2), 0] });
        let last = null;
        P1.onDrag((x, y, phase) => {
          const j = M.clamp(Math.round((x - xs[0]) / h), 0, N - 1), val = M.clamp(y, 0, 1.2);
          if (phase === 'start' || !last) last = j;
          const a = Math.min(last, j), b = Math.max(last, j);
          for (let q = a; q <= b; q++) D[q] = val;
          last = j; if (phase === 'end') last = null; v.invalidate();
        });
        let info = null;
        v.render(() => {
          const k = kS.value, t = tS.value;
          P1.path(Array.from(xs).flatMap((x, j) => [[x - h / 2, D[j]], [x + h / 2, D[j]]]), { color: 'faint', width: 3 });
          const xg = M.range(241).map((i) => -LH + (i * 2 * LH) / 240);
          const ucv = xg.map((x) => convolveCells(D, xs, x, t, k));
          P1.path(xg.map((x, i) => [x, ucv[i]]), { color: 'accent', width: 3 });
          // finite differences on the same cell centres
          const Hh = makeHeat(N - 1, xs[0], xs[N - 1], k, {});
          Hh.u.set(D); Hh.rannacher(t, 0.005);
          P1.path(Array.from(Hh.x).map((x, i) => [x, Hh.u[i]]), { color: 'orange', width: 2, dash: [6, 4] });
          let dif = 0; for (let j = 0; j < N; j += 1) dif = Math.max(dif, Math.abs(Hh.u[j] - convolveCells(D, xs, xs[j], t, k)));
          // lower panel
          const x0 = hx.x, prod = (y) => G(x0 - y, t, k) * D[M.clamp(Math.round((y - xs[0]) / h), 0, N - 1)];
          const sc = 1 / (Math.max(1e-9, G(0, t, k)));
          P2.fn((y) => G(x0 - y, t, k) * sc, { color: 'gold', width: 2 });
          P2.fn((y) => prod(y) * sc, { color: 'accent', width: 2.2, fill: true, fillAlpha: 0.3 });
          P2.vline(x0, { color: 'gold', width: 1, dash: [4, 4] });
          const ux = convolveCells(D, xs, x0, t, k);
          P1.dot(x0, ux, { color: 'gold', r: 5 });
          let mass = 0; for (let j = 0; j < N; j++) mass += D[j] * h;
          info = { dif, ux, x0, mass, mx: Math.max(...ucv), mn: Math.min(...ucv), mxg: Math.max(...D) };
        });
        v.legend([['faint', 'initial data $g$'], ['accent', 'convolution $\\Phi*g$'], ['orange', 'finite differences', { dash: true }]]);
        v.readout(() => info && `$u(x_0,t)=${v.fix(info.ux, 4)}$ at $x_0=${v.fix(info.x0, 2)}$ (area of the shaded product, scaled) · largest difference convolution vs. finite differences: $${v.sci(info.dif, 2)}$\nrange of $u$: $[${v.fix(info.mn, 3)},\\,${v.fix(info.mx, 3)}]\\subseteq[0,\\,${v.fix(info.mxg, 3)}]$ (bounded by the data) · total heat $\\int g=${v.fix(info.mass, 3)}$`);
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Phenomenon',
      name: 'Instant smoothing',
      statement: String.raw`If $g$ is merely bounded (even discontinuous, even nowhere differentiable), the solution $u=\Phi(\cdot,t)*g$ of $u_t=ku_{xx}$ is $C^\infty$ in $x$ and $t$ for every $t>0$, with derivative bounds
$$\sup_x|\partial_x^mu(x,t)|\le C_m\,\|g\|_\infty\,(kt)^{-m/2},\qquad C_m=\int_{\R}|\partial_y^m\Phi(y,1)|\,dy .$$
On a circle with $g=\sum c_ne^{inx}$ the same fact reads $u=\sum c_ne^{-kn^2t}e^{inx}$: the Fourier coefficients are damped by the factor $e^{-kn^2t}$, faster than any power of $n$, for every $t>0$.`,
      idea: String.raw`Derivatives fall on the kernel: $\partial_x^mu=(\partial_x^m\Phi)*g$, and $\partial_x^m\Phi(\cdot,t)$ is integrable with $L^1$ norm $C_m(kt)^{-m/2}$ by scaling (3.3). The bound blows up as $t\to0$ because the data may be rough, but it is finite for every $t>0$. In Fourier terms each mode $e^{inx}$ is an eigenfunction of $\partial_x^2$ with eigenvalue $-n^2$, so it decays like $e^{-kn^2t}$: the higher the frequency, the faster it is erased; the Gaussian factor beats any polynomial growth of $n^m$.`,
      caption: String.raw`Choose a rough initial profile on the circle: a square wave (jumps), a sawtooth, a triangle (kinks) or a continuous, nowhere-differentiable Weierstrass-type sum. Slide time $t$ over four decades. Top: $u(\cdot,t)$ against the initial data (dashed). Bottom: the Fourier coefficients $|c_n|$, initially falling like a power of $1/n$ (grey), and at time $t$ (blue), cut off by the Gaussian envelope $e^{-kn^2t}$ (orange). The readout shows bounds $\sum_nn^m|c_n|e^{-kn^2t}$ on the $m$-th derivative: infinite for the data (power-law coefficients) yet finite at every $t>0$. The series uses 160 modes, so for $t\lesssim10^{-4}$ the picture is the truncated one.`,
      deps: ['pde-3.4'],
      refs: ['Evans §2.3'],
      tags: ['regularity', 'smoothing', 'Fourier series'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_equation' },
      viz(v) {
        const M = v.M, NM = 160, NS = 2048, k = 1;
        const sel = v.select('initial data', [{ value: 'sq', label: 'square wave' }, { value: 'saw', label: 'sawtooth' }, { value: 'tri', label: 'triangle' }, { value: 'wei', label: 'Weierstrass' }], 'sq');
        const tS = v.slider('time $t$', 1e-4, 1, 0.003, { log: true });
        const P1 = v.stage({ x: [-Math.PI, Math.PI], y: [-1.5, 1.5], axes: 'box', gutter: true, height: 240, xlabel: 'x', title: 'initial data and $u(\\cdot,t)$', minWidth: 300 });
        const P2 = v.stage({ x: [0, NM], y: [1e-14, 2], ylog: true, axes: 'box', gutter: true, height: 240, xlabel: 'n', title: 'Fourier coefficients $|c_n|$', minWidth: 300 });
        const f = {
          sq: (x) => (x >= 0 ? 1 : -1) * (Math.abs(x) < Math.PI ? 1 : 0),
          saw: (x) => x / Math.PI,
          tri: (x) => 1 - (2 * Math.abs(x)) / Math.PI,
          wei: (x) => { let s = 0; for (let j = 0; j < 9; j++) s += Math.pow(2, -0.5 * j) * Math.cos(Math.pow(2, j) * x); return s * 0.35; },
        };
        const cache = {};
        const coefs = (name) => {
          if (cache[name]) return cache[name];
          const a = new Float64Array(NM + 1), b = new Float64Array(NM + 1), h = (2 * Math.PI) / NS;
          const fv = Float64Array.from({ length: NS }, (_, j) => f[name](-Math.PI + (j + 0.5) * h));
          for (let n = 0; n <= NM; n++) {
            let sa = 0, sb = 0;
            for (let j = 0; j < NS; j++) { const x = -Math.PI + (j + 0.5) * h; sa += fv[j] * Math.cos(n * x); sb += fv[j] * Math.sin(n * x); }
            a[n] = (sa * h) / Math.PI; b[n] = (sb * h) / Math.PI;
          }
          a[0] /= 2; return (cache[name] = { a, b });
        };
        let info = null;
        v.render(() => {
          const t = tS.value, { a, b } = coefs(sel.value);
          const xg = M.range(401).map((i) => -Math.PI + (2 * Math.PI * i) / 400);
          P1.fn(f[sel.value], { color: 'muted', width: 1.6, dash: [5, 4] });
          const val = (x) => { let s = a[0]; for (let n = 1; n <= NM; n++) { const e = Math.exp(-k * n * n * t); if (e < 1e-18) break; s += e * (a[n] * Math.cos(n * x) + b[n] * Math.sin(n * x)); } return s; };
          P1.path(xg.map((x) => [x, val(x)]), { color: 'accent', width: 3 });
          const c0 = [], c1 = [], env = [];
          for (let n = 1; n <= NM; n++) {
            const c = Math.hypot(a[n], b[n]);
            if (c > 1e-12) c0.push([n, c]); if (c * Math.exp(-k * n * n * t) > 1e-13) c1.push([n, c * Math.exp(-k * n * n * t)]); env.push([n, Math.exp(-k * n * n * t)]);
          }
          P2.path(env, { color: 'orange', width: 1.8, dash: [5, 4] });
          P2.dots(c0, { color: 'muted', r: 2.4 });
          P2.dots(c1, { color: 'accent', r: 3 });
          const bnd = (m, tt) => { let s = 0; for (let n = 1; n <= NM; n++) s += Math.pow(n, m) * Math.hypot(a[n], b[n]) * (tt > 0 ? Math.exp(-k * n * n * tt) : 1); return s; };
          info = { m: [0, 1, 2, 3, 4].map((m) => bnd(m, t)), m0: [0, 1, 2, 3, 4].map((m) => bnd(m, 0)) };
        });
        v.legend([['muted', 'initial $|c_n|$'], ['accent', '$|c_n|e^{-kn^2t}$'], ['orange', '$e^{-kn^2t}$', { dash: true }]]);
        v.readout(() => info && `bound on $\\sup|\\partial_x^mu|$ for $m=0..4$ at $t=${v.sci(tS.value, 2)}$: ${info.m.map((z) => `$${v.sci(z, 2)}$`).join(', ')}\nthe same sums without the damping (the 160 modes of the data): ${info.m0.map((z) => `$${v.sci(z, 2)}$`).join(', ')} — for rough data the higher ones keep growing as more modes are added (infinite in the limit)`);
      },
    },
  ],
};
