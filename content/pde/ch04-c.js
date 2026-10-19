// Partial Differential Equations — Chapter 4: Separation of variables and Fourier series (part c: 4.10–4.12)
import { makeHeat, sineCoeffs, pwl, spline } from './ch04.shared.js';

export default {
  collection: 'pde',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Method',
      name: 'Inhomogeneous boundary conditions',
      statement: String.raw`To solve $u_t=ku_{xx}$ on $(0,\ell)$ with $u(0,t)=a$, $u(\ell,t)=b$ (constants) and $u(x,0)=\varphi(x)$, subtract the steady state $U(x)=a+(b-a)x/\ell$, which already satisfies the equation and the boundary values. The difference $w=u-U$ solves the same equation with *homogeneous* Dirichlet conditions and initial data $\varphi-U$, so
$$u(x,t)=a+(b-a)\frac x\ell+\sum_{n\ge1}c_n\,e^{-k(n\pi/\ell)^2t}\sin\frac{n\pi x}\ell,\qquad c_n=\frac2\ell\int_0^\ell\big(\varphi(x)-U(x)\big)\sin\frac{n\pi x}\ell\,dx .$$
As $t\to\infty$, $u\to U$. Expanding $\varphi$ itself in sines and ignoring $a,b$ solves a different problem (ends at $0$): the series then converges, but to the wrong function, and not uniformly near the ends. For time-dependent boundary values $a(t),b(t)$ the same subtraction works with $U=a(t)+(b(t)-a(t))x/\ell$ and produces a source term $-U_t$, handled by Duhamel's principle (3.9).`,
      idea: String.raw`The equation is linear and the boundary data enter only through the boundary condition, so a *particular* solution that matches the data (here the stationary one, which is affine because $U''=0$) can be split off, and what is left is an instance of the homogeneous problem (4.1). The coefficients are those of $\varphi-U$, which vanishes at the ends when $\varphi$ is compatible with the data, so the sine series of $\varphi-U$ converges quickly. If one expands $\varphi$ directly, the odd extension of $\varphi$ has jumps $2\varphi(0)$, $2\varphi(\ell)$ at the ends (4.4), hence slow $1/n$ coefficients and a Gibbs overshoot (4.8) there.`,
      caption: String.raw`Set the temperatures $a$ and $b$ held at the two ends, and choose the initial temperature. Left: the solution $u$ (blue) is the sum of the linear steady state (green dashed) and the decaying transient $w$ (orange); the grey curve is the initial profile. Right: the transient's sine coefficients $c_n e^{-n^2\pi^2kt}$ (bars): the high modes vanish first. Switch on *ignore the ends* to expand $\varphi$ directly in sines (red): it is forced to $0$ at both ends, so it cannot be the temperature of a rod whose ends are held at $a\ne0$ or $b\ne0$. The readout compares the series with an independent finite-difference solution of the PDE.`,
      deps: ['pde-4.1', 'pde-3.9'],
      refs: ['Strauss §5.6'],
      tags: ['boundary conditions', 'steady state', 'heat equation'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_equation' },
      viz(v) {
        const M = v.M, K = 60, kk = 1;
        const aS = v.slider('left end $a$', -1, 1.5, 1, { step: 0.05 });
        const bS = v.slider('right end $b$', -1, 1.5, 0, { step: 0.05 });
        const sh = v.select('initial temperature', [{ value: 'zig', label: 'jagged' }, { value: 'hump', label: 'hump' }, { value: 'flat', label: 'uniform 0.3' }], 'zig');
        const naive = v.toggle('ignore the ends (expand $\\varphi$ itself)', false);
        const A = v.stage({ x: [0, 1], y: [-1.4, 1.9], axes: 'box', gutter: true, height: 270, xlabel: 'x', title: 'temperature of the rod', minWidth: 300 });
        const B = v.stage({ x: [0.4, 12.6], y: [-0.6, 0.6], axes: 'box', gutter: true, height: 270, xlabel: 'n', title: 'transient coefficients $c_n e^{-n^2\\pi^2 kt}$', minWidth: 260, weight: 0.8 });
        const phis = { zig: pwl([0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1], [0.1, 0.9, 0.2, 0.8, 0.0, 0.7, 0.3, 0.5]), hump: (x) => 0.2 + 0.8 * Math.exp(-(((x - 0.5) / 0.15) ** 2)), flat: () => 0.3 };
        let key = '', cn = [], cnaive = [], diff = 0, tphys = 0;
        v.animate((t) => {
          const a = aS.value, b = bS.value, phi = phis[sh.value], U = (x) => a + (b - a) * x;
          const k = sh.value + a + '|' + b;
          if (k !== key) { key = k; cn = Array.from(sineCoeffs((x) => phi(x) - U(x), K)); cnaive = Array.from(sineCoeffs(phi, K)); }
          tphys = 0.0015 * Math.pow(100, t / 4);
          const w = (x, tt) => { let s = 0; for (let n = 1; n <= K; n++) s += cn[n - 1] * Math.exp(-kk * n * n * Math.PI * Math.PI * tt) * Math.sin(n * Math.PI * x); return s; };
          A.fn(phi, { color: 'muted', width: 1.4, dash: [5, 4], n: 400 });
          A.fn(U, { color: 'green', width: 2, dash: [6, 4] });
          A.fn((x) => w(x, tphys), { color: 'orange', width: 2, n: 400 });
          if (naive.value) A.fn((x) => { let s = 0; for (let n = 1; n <= K; n++) s += cnaive[n - 1] * Math.exp(-kk * n * n * Math.PI * Math.PI * tphys) * Math.sin(n * Math.PI * x); return s; }, { color: 'red', width: 2.6, n: 500 });
          A.fn((x) => U(x) + w(x, tphys), { color: 'accent', width: 3.2, n: 500 });
          A.dot(0, a, { color: 'green', r: 5 }); A.dot(1, b, { color: 'green', r: 5 });
          A.corner(`t = ${v.fix(tphys, 4)}`, 'tr', { color: 'ink', weight: 600 });
          const mag = Array.from({ length: 12 }, (_, i) => cn[i] * Math.exp(-kk * (i + 1) ** 2 * Math.PI * Math.PI * tphys));
          const mx = Math.max(0.2, ...cn.slice(0, 12).map(Math.abs)) * 1.15;
          B.setView([0.4, 12.6], [-mx, mx]);
          B.bars(cn.slice(0, 12), { x0: 1, dx: 1, color: 'faint' });
          B.bars(mag, { x0: 1, dx: 1, color: 'orange' });
          // independent finite-difference check
          const H = makeHeat(200, 0, 1, kk, { gl: () => a, gr: () => b });
          for (let i = 0; i <= 200; i++) H.u[i] = phi(H.x[i]);
          H.rannacher(tphys, 0.0005);
          let d = 0; for (let i = 5; i <= 195; i += 5) d = Math.max(d, Math.abs(H.u[i] - (U(H.x[i]) + w(H.x[i], tphys))));
          diff = d;
        }, { period: 4, still: 2.2 });
        v.legend([['accent', '$u=U+w$'], ['green', 'steady state $U$', { dash: true }], ['orange', 'transient $w$'], ['muted', 'initial $\\varphi$', { dash: true }]]);
        v.readout(() => `max difference between the series and a finite-difference solution of $u_t=u_{xx}$ with these end temperatures: $${v.sci(Math.max(diff, 1e-12), 2)}$ ${diff < 5e-3 ? '✓' : ''}\n` + (naive.value ? 'red: the sine series of $\\varphi$ alone is forced to $0$ at the ends, so it solves a different problem' : `as $t\\to\\infty$ the blue curve tends to the green line from $a=${v.fix(aS.value, 2)}$ to $b=${v.fix(bS.value, 2)}$`));
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Model',
      name: 'Heat in a finite rod: modes decay at rates n²',
      statement: String.raw`A rod of length $\ell$ with ends held at temperature $0$ and diffusivity $k$ has temperature $u(x,t)=\sum_{n\ge1}b_n\,e^{-k(n\pi/\ell)^2t}\sin(n\pi x/\ell)$, where $b_n$ are the sine coefficients of the initial temperature. The $n$-th mode decays at the rate $k n^2\pi^2/\ell^2$, with half-life $\ln2\,\ell^2/(k n^2\pi^2)$, so *higher modes die out much faster*: for $t>0$ the series converges extremely fast, the solution is smooth, and for large $t$ it is $u\approx b_1e^{-k\pi^2t/\ell^2}\sin(\pi x/\ell)$ (when $b_1\ne0$): the shape of the lowest mode multiplied by a decaying amplitude. The ratio of the amplitudes of modes $n$ and $1$ shrinks like $e^{-k\pi^2(n^2-1)t/\ell^2}$.`,
      idea: String.raw`Each term of the series from 4.1 carries its own exponential factor $e^{-\lambda_nkt}$ with $\lambda_n=(n\pi/\ell)^2$, growing quadratically in $n$. Fine detail in the initial data (high $n$) is therefore erased almost at once while the large-scale shape survives: the Fourier-mode picture of diffusion as a low-pass filter. This is also why smoothing is instantaneous (3.5) and why the backward problem is hopeless (3.13): running time backwards would multiply mode $n$ by $e^{+\lambda_nkt}$. The model is a good physical description of a thin rod with insulated sides, constant material properties and ends in contact with a large heat bath.`,
      caption: String.raw`Pick the initial temperature (a jagged zigzag, a box, or a random polyline; the button redraws the random one). Time runs on a logarithmic scale. Top left: the solution (blue), its initial profile (dashed grey) and the first mode alone (orange dashed): soon they coincide. Top right: bar chart of the mode amplitudes $b_ne^{-n^2\pi^2kt}$ (faint: at $t=0$). Bottom: the same amplitudes against time on a log axis, where each mode is a straight line of slope $-n^2\pi^2k$. The readout compares the series with an independent finite-difference solution and reports when mode 2 has fallen below 5% of mode 1.`,
      deps: ['pde-4.1', 'pde-4.6'],
      refs: ['Strauss §4.1'],
      scope: String.raw`A uniform rod with insulated sides and constant diffusivity $k$, ends held at $0$; the model ignores variation of $k$ with temperature.`,
      tags: ['heat equation', 'eigenmodes', 'smoothing'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_equation' },
      viz(v) {
        const M = v.M, K = 60, kk = 0.5, TMAX = 0.25;
        const sh = v.select('initial temperature', [{ value: 'zig', label: 'jagged zigzag' }, { value: 'box', label: 'box' }, { value: 'rand', label: 'random polyline' }], 'zig');
        let seed = 3;
        const rb = v.button('new random', () => { seed++; key = ''; });
        const A = v.stage({ x: [0, 1], y: [-0.2, 1.2], axes: 'box', gutter: true, height: 240, xlabel: 'x', title: 'temperature profile', minWidth: 280 });
        const B = v.stage({ x: [0.4, 10.6], y: [-0.5, 0.6], axes: 'box', gutter: true, height: 240, xlabel: 'n', title: 'mode amplitudes', minWidth: 250 });
        const C = v.stage({ x: [0, TMAX], y: [1e-6, 2], ylog: true, axes: 'box', gutter: true, height: 240, xlabel: 't', title: 'amplitudes against time (log scale)', minWidth: 250, full: true });
        let key = '', phi = null, bn = [], diff = 0, tphys = 0, tHalf = 0;
        const make = () => {
          if (sh.value === 'zig') return pwl([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], [0, 0.9, 0.1, 1.0, 0.0, 0.8, 0.2, 0.5, 0.0, 0.3, 0]);
          if (sh.value === 'box') return (x) => (x > 0.3 && x < 0.55 ? 1 : 0);
          const r = v.rng(seed), xs = [0], ys = [0]; for (let i = 1; i < 12; i++) { xs.push(i / 12); ys.push(r()); } xs.push(1); ys.push(0);
          return pwl(xs, ys);
        };
        v.animate((t) => {
          const k = sh.value + seed;
          if (k !== key) { key = k; phi = make(); bn = Array.from(sineCoeffs(phi, K)); const am = Math.abs(bn[1]), a1 = Math.abs(bn[0]); tHalf = am < 1e-9 ? 0 : Math.max(0, Math.log(am / a1 / 0.05) / (3 * Math.PI * Math.PI * kk)); }
          tphys = 0.0008 * Math.pow(TMAX / 0.0008, t / 4);
          const mode = (n, tt) => bn[n - 1] * Math.exp(-kk * n * n * Math.PI * Math.PI * tt);
          const u = (x) => { let s = 0; for (let n = 1; n <= K; n++) s += mode(n, tphys) * Math.sin(n * Math.PI * x); return s; };
          A.fn(phi, { color: 'muted', width: 1.4, dash: [5, 4], n: 500 });
          A.fn((x) => mode(1, tphys) * Math.sin(Math.PI * x), { color: 'orange', width: 2, dash: [6, 4] });
          A.fn(u, { color: 'accent', width: 3.2, n: 400 });
          A.corner(`t = ${v.fix(tphys, 4)}`, 'tr', { color: 'ink', weight: 600 });
          const am = Array.from({ length: 10 }, (_, i) => mode(i + 1, tphys));
          B.bars(bn.slice(0, 10), { x0: 1, dx: 1, color: 'faint' });
          B.bars(am, { x0: 1, dx: 1, color: (val, i) => ['accent', 'orange', 'green', 'purple', 'teal', 'pink', 'gold', 'red', 'accent', 'orange'][i] });
          const cols = ['accent', 'orange', 'green', 'purple', 'teal'];
          for (let n = 1; n <= 5; n++) { const a0 = Math.max(Math.abs(bn[n - 1]), 1e-12); C.path([[0, a0], [TMAX, a0 * Math.exp(-kk * n * n * Math.PI * Math.PI * TMAX)]], { color: cols[n - 1], width: 2 }); C.dot(tphys, Math.max(Math.abs(mode(n, tphys)), 1e-7), { color: cols[n - 1], r: 4.5 }); }
          C.vline(tphys, { color: 'gold', width: 1.5, dash: [4, 3] });
          const H = makeHeat(300, 0, 1, kk, {});
          for (let i = 0; i <= 300; i++) H.u[i] = phi(H.x[i]);
          H.rannacher(tphys, 0.0004);
          let d = 0; for (let i = 6; i <= 294; i += 6) d = Math.max(d, Math.abs(H.u[i] - u(H.x[i])));
          diff = d;
        }, { period: 4, still: 2.6 });
        v.legend([['accent', 'solution $u$'], ['orange', 'mode 1 alone', { dash: true }], ['muted', 'initial', { dash: true }]]);
        v.readout(() => `ratio of modes 2 and 1 now: ${v.fix(Math.abs(bn[1] * Math.exp(-3 * kk * Math.PI * Math.PI * tphys) / (bn[0] * 1)), 4)}${bn[0] ? '' : ''} · mode 2 is below 5% of mode 1 from $t\\approx${v.fix(tHalf, 4)}$ · half-life of mode $n$: $\\ln2/(n^2\\pi^2k)=${v.fix(Math.LN2 / (Math.PI * Math.PI * kk), 4)}/n^2$\nseries vs finite-difference solution ($k=${kk}$): max difference $${v.sci(Math.max(diff, 1e-12), 2)}$ ${diff < 5e-3 ? '✓' : ''}`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Paper',
      name: 'Théorie analytique de la chaleur',
      paper: { authors: 'Joseph Fourier', year: 1822, title: 'Théorie analytique de la chaleur', venue: 'Paris: Firmin Didot, père et fils', url: 'https://archive.org/details/thorieanalytiq00four' },
      introduces: ['pde-1.4', 'pde-4.4', 'pde-4.11'],
      credit: 'J. Fourier, 1822 (memoir of 1807)',
      statement: String.raw`Fourier's book (Paris, 1822; it grew out of a memoir delivered to the Institute at the end of 1807 and a second deposited on 28 September 1811, according to his preface) derives the equation of heat conduction in a continuous body and solves it for bodies of simple shape by separating variables and expanding the data in trigonometric series. The opening problem of Chapter III is a lamina, a semi-infinite strip of width $\pi$ whose two long edges are held at temperature $0$ and whose short base is held at temperature $1$. Its stationary temperature is $v(x,y)=\frac4\pi\big(e^{-x}\cos y-\tfrac13e^{-3x}\cos3y+\tfrac15e^{-5x}\cos5y-\cdots\big)$, which requires $\frac\pi4=\cos y-\frac13\cos3y+\frac15\cos5y-\cdots$ on $|y|<\frac\pi2$. In articles 219–220 he argues that integral coefficients extend the sine-series representation to arbitrary, even discontinuous, functions. This is a historical claim, not a convergence theorem without hypotheses; modern conditions are stated in 4.6–4.7.`,
      idea: String.raw`For the strip, Fourier separates the stationary heat equation into modes $e^{-(2k+1)x}\cos((2k+1)y)$. The odd frequencies enforce the cold side boundaries, and the alternating coefficients $4(-1)^k/[\pi(2k+1)]$ match a constant hot base in the interior. Articles 171–177 obtain the coefficients through formal elimination and a Wallis product; articles 179–180 discuss the limiting series. Articles 219–220 express general sine coefficients as definite integrals. The lower panel is a modern companion calculation: the same spatial modes in a finite bar decay in time at rates $(2k+1)^2$.`,
      caption: String.raw`Recreation of the strip problem opening Fourier's Chapter III, computed today (these are not numbers from the book). Top left: the base profile built from the first $N$ terms of $\cos y-\frac13\cos 3y+\cdots$ against the plateau $\pi/4$ (dashed): add terms with the slider; the series passes through the middle of each jump of the extended square wave and overshoots next to it by about $9\%$ of the jump, however large $N$ is (the Gibbs phenomenon, analyzed here using modern convergence results). Top right: the stationary temperature of the lamina from the same $N$ terms, with isotherms; the base ($x=0$ at the bottom) is hot, the sides cold, and the high harmonics die out within about one unit of distance from the base because of the factors $e^{-(2k+1)x}$. Bottom: the evolution of a bar of width $\pi$ whose ends are held at $0$ and which starts at temperature $1$: each mode $\cos((2k+1)y)$ decays like $e^{-(2k+1)^2t}$, the profile quickly becomes a single cosine arch.`,
      deps: ['pde-1.3', 'pde-4.2'],
      refs: ['Fourier (1822), title page; Discours préliminaire pp. xviii–xix; Chapter III §§I–III, articles 163–180, pp. 159–179; §VI articles 219–220, pp. 231–235'],
      scope: String.raw`The strip series is reproduced from the original book. Plotted values and the finite-bar animation are modern computations; no measured temperatures or historical numerical data are claimed. The hot base and cold sides have incompatible data at the two corner points, which are excluded from the stated base identity.`,
      tags: ['Fourier', 'heat', 'history'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Th%C3%A9orie_analytique_de_la_chaleur', archive: 'https://archive.org/details/thorieanalytiq00four' },
      viz(v) {
        const M = v.M, GIBBS = 0.0895;
        const nS = v.slider('terms $N$', 1, 40, 5, { int: true });
        const P = v.stage({ x: [-Math.PI, Math.PI], y: [-1.2, 1.2], axes: 'box', gutter: true, height: 240, xlabel: 'y', title: 'base profile $\\cos y-\\frac13\\cos3y+\\cdots$', minWidth: 280, xticks: [[-Math.PI, '−π'], [-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2'], [Math.PI, 'π']] });
        const Q = v.stage({ x: [-Math.PI / 2, Math.PI / 2], y: [0, 3], equal: true, axes: 'box', gutter: true, height: 240, xlabel: 'y', ylabel: 'x', title: 'stationary temperature of the lamina', minWidth: 280, xticks: [[-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2']] });
        const R = v.stage({ x: [-Math.PI / 2, Math.PI / 2], y: [-0.1, 1.3], axes: 'box', gutter: true, height: 230, xlabel: 'y', title: 'a bar of width π, ends at 0, starting at 1', minWidth: 300, full: true, xticks: [[-Math.PI / 2, '−π/2'], [0, '0'], [Math.PI / 2, 'π/2']] });
        const term = (k, y) => ((k % 2 ? -1 : 1) * Math.cos((2 * k + 1) * y)) / (2 * k + 1);
        const S = (N, y) => { let s = 0; for (let k = 0; k < N; k++) s += term(k, y); return s; };
        let tphys = 0, over = 0, at0 = 0, rodMax = 0;
        v.animate((t) => {
          const N = nS.value;
          P.hline(Math.PI / 4, { color: 'muted', width: 1.2, dash: [5, 4] }); P.hline(-Math.PI / 4, { color: 'muted', width: 1.2, dash: [5, 4] });
          P.fn((y) => (Math.abs(wrapPi(y)) < Math.PI / 2 ? Math.PI / 4 : -Math.PI / 4), { color: 'faint', width: 1.4, n: 800 });
          P.fn((y) => term(N - 1, y), { color: 'gold', width: 1.6, alpha: 0.9 });
          P.fn((y) => S(N, y), { color: 'orange', width: 2.8, n: 800 });
          let mx = 0; for (let i = 0; i <= 2000; i++) mx = Math.max(mx, S(N, (i / 2000) * (Math.PI / 2)));
          over = (mx - Math.PI / 4) / (Math.PI / 2); at0 = S(N, 0);
          Q.heat((y, x) => (4 / Math.PI) * (() => { let s = 0; for (let k = 0; k < N; k++) s += ((k % 2 ? -1 : 1) * Math.exp(-(2 * k + 1) * x) * Math.cos((2 * k + 1) * y)) / (2 * k + 1); return s; })(), { range: [0, 1], cmap: 'theme', color: 'red', res: 3, key: 'q' + N });
          Q.contour((y, x) => (4 / Math.PI) * (() => { let s = 0; for (let k = 0; k < N; k++) s += ((k % 2 ? -1 : 1) * Math.exp(-(2 * k + 1) * x) * Math.cos((2 * k + 1) * y)) / (2 * k + 1); return s; })(), [0.1, 0.25, 0.5, 0.75, 0.9], { color: 'ink', width: 1, alpha: 0.6 });
          tphys = 0.002 * Math.pow(1.2 / 0.002, t / 4);
          const u = (y, n = 60) => { let s = 0; for (let k = 0; k < n; k++) s += (4 / Math.PI) * ((k % 2 ? -1 : 1) * Math.exp(-((2 * k + 1) ** 2) * tphys) * Math.cos((2 * k + 1) * y)) / (2 * k + 1); return s; };
          R.fn((y) => u(y), { color: 'accent', width: 3, n: 400 });
          R.fn((y) => (4 / Math.PI) * Math.exp(-tphys) * Math.cos(y), { color: 'orange', width: 1.8, dash: [6, 4] });
          R.corner(`t = ${v.fix(tphys, 3)}`, 'tr', { color: 'ink', weight: 600 });
          rodMax = u(0);
        }, { period: 4, still: 2.0 });
        v.legend([['orange', 'partial sum of the series'], ['gold', 'last term added'], ['accent', 'bar temperature'], ['orange', 'first mode alone', { dash: true }]]);
        v.readout(() => `$S_N(0)=${v.fix(at0, 5)}$ against $\\pi/4=${v.fix(Math.PI / 4, 5)}$ (Leibniz–Gregory series) · overshoot beside the jump: ${v.fix(100 * over, 2)}% of the jump (Gibbs limit ${v.fix(100 * GIBBS, 2)}%)\nbar: $u(0,t)=${v.fix(rodMax, 4)}$ vs lowest mode $\\frac4\\pi e^{-t}=${v.fix((4 / Math.PI) * Math.exp(-tphys), 4)}$ · mode $2k+1$ decays like $e^{-(2k+1)^2t}$`);
        function wrapPi(y) { return ((((y + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI; }
      },
    },
  ],
};
