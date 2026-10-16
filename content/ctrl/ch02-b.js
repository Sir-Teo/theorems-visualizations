// Control Theory — Chapter 2: Modelling dynamical systems (part b: 2.8–2.13)
import {
  TAU, clamp, rk4, simulate, nTeX, matTeX, cTeX, proots, eigs, parseCoefs, pade, tf, tfTeX, tfAt, stepExact, zoh, xMark,
  realize, ssMatrices, bdBlock, bdSum, bdWire, trace, ptrim, ptex, samples, cmul, cdiv,
} from './ch02.shared.js';

export default {
  collection: 'ctrl',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.8
    {
      num: '2.8',
      kind: 'Method',
      name: 'Realisations: the controllable canonical form',
      statement: String.raw`Let $G(s)=\dfrac{b_ns^n+\dots+b_1s+b_0}{s^n+a_{n-1}s^{n-1}+\dots+a_1s+a_0}$ be a proper rational function (monic denominator). Then the state-space model
$$A=\begin{bmatrix}0&1&&\\&\ddots&\ddots&\\&&0&1\\-a_0&-a_1&\cdots&-a_{n-1}\end{bmatrix},\quad B=\begin{bmatrix}0\\\vdots\\0\\1\end{bmatrix},\quad C=\begin{bmatrix}b_0-b_na_0&\cdots&b_{n-1}-b_na_{n-1}\end{bmatrix},\quad D=b_n$$
is a **realisation** of $G$: $C(sI-A)^{-1}B+D=G(s)$. It is the **controllable canonical form** ("companion form"): the states are a chain of $n$ integrators $x_1=\dot x_{0},\dots$ with the denominator's coefficients fed back to the input and the numerator's read out. A proper transfer function has infinitely many realisations; this one is minimal exactly when numerator and denominator have no common factor.`,
      idea: String.raw`Define the state as $x=(w,\dot w,\dots,w^{(n-1)})$ for the signal $w$ that satisfies $w^{(n)}+a_{n-1}w^{(n-1)}+\dots+a_0w=u$; that is the last row of $A$. Because the equation is linear, the output $y=b_nw^{(n)}+\dots+b_0w$ is a linear read-out of $x$ and $u$, after substituting $w^{(n)}$ from the differential equation (this produces the $-b_na_i$ terms and $D=b_n$). Transforming gives $W=U/\mathrm{den}(s)$ and $Y=\mathrm{num}(s)W$, which is $G(s)U(s)$ (ctrl-2.7 read backwards).`,
      caption: String.raw`Type the coefficients of the numerator and denominator in descending powers (for example 2 1 means $2s+1$) or pick an example. The matrices of the companion form are built from them, and the block diagram shows the chain of integrators with the denominator's coefficients ($-a_k$, red) fed back to the input and the numerator's ($c_k$, green) read out. Below, the step response of the realisation and of each of its states, and the test frequency $\omega$ confirms $C(i\omega I-A)^{-1}B+D=G(i\omega)$.`,
      deps: ['ctrl-2.7'],
      refs: ['Franklin–Powell §7.3', 'Åström–Murray §7.1'],
      tags: ['realisation', 'canonical form'],
      viz(v) {
        const EX = {
          a: { label: '2nd order', num: '1', den: '1 2 4' },
          b: { label: '3rd order with a zero', num: '2 1', den: '1 3 3 1' },
          c: { label: 'proper, $D\\neq0$', num: '1 1 1', den: '1 3 2' },
          d: { label: 'double integrator', num: '1', den: '1 0 0' },
        };
        const exS = v.select('example', Object.entries(EX).map(([value, o]) => ({ value, label: o.label })), 'b', { onChange: (k) => { nIn.set(EX[k].num); dIn.set(EX[k].den); } });
        const nIn = v.input('numerator', EX.b.num, { width: 150 });
        const dIn = v.input('denominator', EX.b.den, { width: 170 });
        const wS = v.slider('test frequency $\\omega$ (rad/s)', 0.05, 10, 1.3, { log: true, sig: 2 });
        const bd = v.stage({ x: [0, 14.4], y: [0, 7.1], equal: true, aspect: 0.46, axes: false, full: true });
        const st = v.stage({ x: [0, 12], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'step response', height: 280, full: true });
        let key = '', S = null;
        const solve = () => {
          const k = nIn.value + '|' + dIn.value;
          if (k !== key) {
            key = k; S = null;
            const num = parseCoefs(nIn.value), den = parseCoefs(dIn.value);
            if (!num || !den) { S = { err: 'enter up to six numbers separated by spaces' }; return S; }
            const G = tf(num, den), lead = G.den[G.den.length - 1];
            if (Math.abs(lead) < 1e-12) { S = { err: 'the leading denominator coefficient must be non-zero' }; return S; }
            if (G.num.length > G.den.length) { S = { err: 'improper transfer function (numerator degree exceeds denominator degree)' }; return S; }
            if (G.den.length < 2) { S = { err: 'the denominator needs degree at least 1' }; return S; }
            const b = realize(G), { A, B } = ssMatrices(b);
            const poles = proots(v.M, G.den), ev = eigs(v.M, A);
            // slowest pole sets the time scale
            const slow = Math.min(...poles.map((p) => Math.abs(p[0])).filter((x) => x > 1e-6), 1e9), Tend = clamp(slow < 1e8 ? 5 / slow : 12, 4, 30);
            const N = 600, h = Tend / N, { Phi, Gam } = zoh(v.M, A, B, h);
            let x = new Array(b.n).fill(0); const t = [], X = [], y = [];
            for (let i = 0; i <= N; i++) { t.push(i * h); X.push(x.slice()); y.push(b.C.reduce((a, c, j) => a + c * x[j], 0) + b.D); x = x.map((_, r) => Phi[r].reduce((a, p, j) => a + p * x[j], Gam[r])); }
            S = { G, b, A, B, poles, ev, t, X, y, Tend, num: G.num, den: G.den };
          }
          return S;
        };
        v.render(() => {
          const S = solve();
          if (S.err) { bd.text(S.err, 7.2, 3.5, { size: 15, color: 'red', align: 'center' }); st.text(S.err, 6, 0, { size: 13, color: 'red', align: 'center' }); return; }
          const { b } = S, n = b.n;
          // ---- block diagram: u → Σ → ∫ → … → ∫, taps feed back (red) and out (green)
          const gap = n > 1 ? Math.min(2.6, 8.3 / (n - 1)) : 0, x0 = 3.0, yc = 3.5, tapDx = Math.min(0.5 + (n > 1 ? (gap - 1.1) / 2 : 0.5), 1.0);
          bdWire(bd, [[0.2, yc], [0.9, yc]], { color: 'ink' }); bd.text('u', 0.1, yc + 0.4, { size: 14, color: 'ink', math: true });
          bdSum(bd, 1.2, yc, 0.3, { w: '+', s: '+' }, {});
          const tapX = [], tapK = [];
          for (let i = 0; i < n; i++) {
            const bx = x0 + i * gap, k = n - i;
            bdWire(bd, [[i === 0 ? 1.5 : x0 + (i - 1) * gap + 0.55 + tapDx, yc], [bx - 0.55, yc]], { color: 'ink' });
            bdBlock(bd, bx, yc, 1.1, 0.9, String.raw`\frac1s`, { color: 'ink', size: 15 });
            const tx = bx + 0.55 + tapDx; tapX.push(tx); tapK.push(k);
            bd.line(bx + 0.55, yc, tx, yc, { color: 'ink', width: 1.7 });
            bd.dot(tx, yc, { r: 3.2, color: 'ink' });
            bd.tex(`x_${k}`, tx - tapDx * 0.5 + 0.1, yc + 0.35, { size: 13, color: 'accent' });
          }
          const lastX = tapX[n - 1];
          // feedback
          const fb = 1.2;
          for (let i = 0; i < n; i++) {
            const k = tapK[i], coef = b.a[k - 1], tx = tapX[i];
            bd.line(tx, yc, tx, yc - 0.9, { color: 'red', width: 1.7 });
            bd.line(tx, yc - 1.5, tx, fb, { color: 'red', width: 1.7 });
            bdBlock(bd, tx, yc - 1.2, 1.15, 0.6, `${-coef < 0 ? '-' : ''}${nTeX(Math.abs(coef), 3)}`, { color: 'red', size: 13 });
            bd.tex(`-a_{${k - 1}}`, tx + 0.12, yc - 1.95, { size: 11.5, color: 'red', align: 'left' });
          }
          bd.line(lastX, fb, 1.2, fb, { color: 'red', width: 1.7 });
          bdWire(bd, [[1.2, fb], [1.2, yc - 0.3]], { color: 'red' });
          // output
          const ob = 5.7, so = [13.2, yc];
          for (let i = 0; i < n; i++) {
            const k = tapK[i], coef = b.C[k - 1], tx = tapX[i];
            bd.line(tx, yc, tx, yc + 0.9, { color: 'green', width: 1.7 });
            bd.line(tx, yc + 1.5, tx, ob, { color: 'green', width: 1.7 });
            bdBlock(bd, tx, yc + 1.2, 1.15, 0.6, `${coef < 0 ? '-' : ''}${nTeX(Math.abs(coef), 3)}`, { color: 'green', size: 13 });
            bd.tex(`c_{${k}}`, tx + 0.12, yc + 1.95, { size: 11.5, color: 'green', align: 'left' });
          }
          bd.line(tapX[0], ob, so[0], ob, { color: 'green', width: 1.7 });
          bdWire(bd, [[so[0], ob], [so[0], yc + 0.3]], { color: 'green' });
          bdSum(bd, so[0], yc, 0.3, { n: '+', e: '+' }, {});
          bdWire(bd, [[so[0], yc - 0.3], [so[0], yc - 1.3]], { color: 'ink' }); bd.text('y', so[0] + 0.15, yc - 1.4, { size: 14, color: 'ink', math: true, align: 'left' });
          // feedthrough
          const dcol = Math.abs(b.D) > 1e-12 ? 'purple' : 'faint';
          bd.dot(0.65, yc, { r: 3.2, color: 'ink' });
          bd.line(0.65, yc, 0.65, 6.6, { color: dcol, width: 1.7, dash: Math.abs(b.D) > 1e-12 ? undefined : [4, 4] });
          bd.line(0.65, 6.6, 14.0, 6.6, { color: dcol, width: 1.7, dash: Math.abs(b.D) > 1e-12 ? undefined : [4, 4] });
          bdWire(bd, [[14.0, 6.6], [14.0, yc], [so[0] + 0.3, yc]], { color: dcol });
          bd.tex(`D=${nTeX(b.D, 3)}`, 7.3, 6.95, { size: 12.5, color: dcol === 'faint' ? 'muted' : 'purple' });
          // ---- step response and states
          const ys = [...S.y, ...S.X.flat()], lo = Math.min(0, ...ys), hi = Math.max(0.1, ...ys), pad = 0.08 * (hi - lo || 1);
          st.setView([0, S.Tend], [lo - pad, hi + pad]);
          st.hline(0, { color: 'faint' });
          for (let k = 0; k < n; k++) trace(st, S.t, S.X.map((x) => x[k]), { color: ['orange', 'purple', 'teal', 'pink', 'gold'][k % 5], width: 1.4, alpha: 0.8 });
          trace(st, S.t, S.y, { color: 'accent', width: 3 });
        });
        v.legend([['accent', 'output $y$ (step input)'], ['orange', 'states $x_1,x_2,\\dots$'], ['red', 'denominator coefficients fed back'], ['green', 'numerator coefficients read out']]);
        v.readout(() => {
          const S = solve(); if (S.err) return `**${S.err}**`;
          const { b, A, B, G } = S, n = b.n, w = wS.value;
          // C (iωI − A)^{-1} B + D evaluated with complex linear algebra
          const sI = A.map((r, i) => r.map((a, j) => [-a, i === j ? w : 0]));
          const sol = v.M.solveC(sI, B.map((x) => [x, 0]));
          let yRe = b.D, yIm = 0; if (sol) sol.forEach((z, j) => { yRe += b.C[j] * z.re; yIm += b.C[j] * z.im; });
          const g = tfAt(G, w), dif = Math.hypot(g[0] - yRe, g[1] - yIm);
          return `$G(s)=${tfTeX(G)}$\n$A=${matTeX(A, 3)},\\; B=${matTeX(B.map((x) => [x]), 3)},\\; C=${matTeX([b.C], 3)},\\; D=${nTeX(b.D, 3)}$\n` +
            `at $\\omega=${v.fix(w, 2)}$: $G(i\\omega)=${v.fix(g[0], 4)}${g[1] < 0 ? '-' : '+'}${v.fix(Math.abs(g[1]), 4)}i$, $C(i\\omega I-A)^{-1}B+D=${v.fix(yRe, 4)}${yIm < 0 ? '-' : '+'}${v.fix(Math.abs(yIm), 4)}i$ (difference $${v.sci(Math.max(dif, 1e-17), 2)}$) · order $n=${n}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.9
    {
      num: '2.9',
      kind: 'Concept',
      name: 'Discrete-time models and the zero-order hold',
      statement: String.raw`A digital controller acts only at sampling instants $t_k=kT$, and a **zero-order hold** (ZOH) keeps the input constant between them, $u(t)=u_k$ for $t_k\le t<t_{k+1}$. For the plant $\dot x=Ax+Bu$ the state at the sampling instants then obeys, *exactly* and for every sampling period $T$,
$$x_{k+1}=\Phi x_k+\Gamma u_k,\qquad \Phi=e^{AT},\quad \Gamma=\int_0^Te^{A\sigma}\,d\sigma\,B,$$
(and $y_k=Cx_k+Du_k$). The eigenvalues of $\Phi$ are $e^{\lambda_iT}$, where $\lambda_i$ are the eigenvalues of $A$: the left half-plane maps into the unit disc. Replacing the derivative by a difference quotient (forward Euler, $\Phi\approx I+AT$) is only an approximation, accurate for $T$ small compared with the time constants of the plant.`,
      idea: String.raw`Between two samples the input is a constant $u_k$, so the variation-of-constants formula $x(t_k+T)=e^{AT}x(t_k)+\int_0^Te^{A(T-\sigma)}Bu_k\,d\sigma$ is exact. The matrix exponential is the same one that solves $\dot x=Ax$ (sig-7.8 for the sampling viewpoint, ode-1.1 for the solution). Euler's method truncates the series $e^{AT}=I+AT+\dots$ after the first term, so it moves the eigenvalues to $1+\lambda T$, which can leave the unit disc even when $e^{\lambda T}$ is well inside it.`,
      caption: String.raw`A lightly damped oscillator ($\omega_0=3$ rad/s) driven by a held input. The **blue** curve is the true continuous response (fine-step integration of the plant with the staircase input in grey). The **green** dots are the exact discrete model $x_{k+1}=\Phi x_k+\Gamma u_k$ and the **red** dots forward Euler. Drag the sampling period $T$: the green dots stay on the blue curve at every $T$, while the red ones drift off and, beyond about $2\zeta/\omega_0$, spiral outward. The $z$-plane shows why: $e^{\lambda T}$ stays inside the unit circle, $1+\lambda T$ does not.`,
      deps: ['ctrl-2.1', 'sig-7.8'],
      refs: ['Franklin–Powell §8.1'],
      tags: ['sampling', 'discrete time'],
      viz(v) {
        const w0 = 3, TEND = 8;
        const tS = v.slider('sampling period $T$ (s)', 0.05, 1.2, 0.4, { log: true, sig: 2 });
        const zS = v.slider('damping ratio $\\zeta$', 0.05, 0.8, 0.2, { step: 0.01 });
        const inS = v.select('input', [{ value: 'sine', label: 'sine' }, { value: 'square', label: 'square wave' }], 'sine');
        const tm = v.stage({ x: [0, TEND], y: [-2, 2], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'output y = position', height: 360, weight: 1.6 });
        const zp = v.stage({ x: [-1.8, 1.8], y: [-1.8, 1.8], equal: true, axes: true, height: 360, weight: 1, minWidth: 260, title: '$z$-plane: eigenvalues of the sampled model' });
        const uc = (t) => (inS.value === 'sine' ? 0.8 * Math.sin(1.7 * t) : 0.8 * Math.sign(Math.sin(0.9 * t + 0.01)));
        let key = '', S = null;
        const solve = () => {
          const T = tS.value, zeta = zS.value, k = [T, zeta, inS.value].join('|');
          if (k !== key) {
            key = k;
            const A = [[0, 1], [-w0 * w0, -2 * zeta * w0]], B = [0, w0 * w0], { Phi, Gam } = zoh(v.M, A, B, T);
            const K = Math.round(TEND / T) + 1, cont = [[0, 0]], ts = [], xc = [0, 0], xe = [0, 0], xd = [0, 0];
            const disc = [], eul = [], con = [], hold = [];
            let x = [0, 0], t = 0, dmax = 0, emax = 0, xdd = [0, 0], xee = [0, 0];
            for (let i = 0; i < K; i++) {
              const u = uc(i * T); ts.push(i * T);
              con.push(x[0]); disc.push(xdd[0]); eul.push(xee[0]);
              dmax = Math.max(dmax, Math.abs(xdd[0] - x[0])); emax = Math.max(emax, Math.min(1e6, Math.abs(xee[0] - x[0])));
              hold.push([i * T, u], [(i + 1) * T, u], null);
              // continuous plant over [iT, (i+1)T] with the held input
              const sub = 40, h = T / sub; let y = x;
              for (let q = 0; q < sub; q++) { y = rk4((s) => [s[1], -w0 * w0 * s[0] - 2 * zeta * w0 * s[1] + w0 * w0 * u], y, t + q * h, h); cont.push([t + (q + 1) * h, y[0]]); }
              x = y; t += T;
              xdd = [Phi[0][0] * xdd[0] + Phi[0][1] * xdd[1] + Gam[0] * u, Phi[1][0] * xdd[0] + Phi[1][1] * xdd[1] + Gam[1] * u];
              xee = [xee[0] + T * xee[1], xee[1] + T * (-w0 * w0 * xee[0] - 2 * zeta * w0 * xee[1] + w0 * w0 * u)];
              if (Math.abs(xee[0]) > 1e9) xee = [Math.sign(xee[0]) * 1e9, 0];
            }
            const lam = zeta < 1 ? [-zeta * w0, w0 * Math.sqrt(1 - zeta * zeta)] : [0, 0];
            S = { cont, ts, disc, eul, hold, dmax, emax, T, zeta, lam, K };
          }
          return S;
        };
        v.render(() => {
          const S = solve(), T = S.T;
          tm.hline(0, { color: 'faint' });
          tm.clip(() => {
            tm.path(S.hold, { color: 'muted', width: 1.6, alpha: 0.8 });
            tm.path(S.cont, { color: 'accent', width: 2.6 });
            tm.dots(S.ts.map((t, i) => [t, S.disc[i]]), { r: 4.5, color: 'green' });
            tm.dots(S.ts.map((t, i) => [t, S.eul[i]]), { r: 3.5, color: 'red' });
          });
          // z-plane
          zp.curve((a) => [Math.cos(a), Math.sin(a)], 0, TAU, { color: 'ink', width: 1.6, n: 120 });
          zp.text('unit circle', -0.9, -0.95, { size: 11, color: 'muted', align: 'center' });
          const ex = Math.exp(S.lam[0] * T), ee = [1 + S.lam[0] * T, S.lam[1] * T];
          for (const sg of [1, -1]) {
            zp.dot(ex * Math.cos(S.lam[1] * T), sg * ex * Math.sin(S.lam[1] * T), { r: 6, color: 'green' });
            zp.dot(ee[0], sg * ee[1], { r: 5, color: 'red' });
          }
        });
        v.legend([['accent', 'continuous plant response'], ['muted', 'held input $u_k$'], ['green', 'exact discrete model $\\Phi,\\Gamma$', { dot: true }], ['red', 'forward Euler', { dot: true }]]);
        v.readout(() => {
          const S = solve();
          const me = Math.exp(-S.zeta * w0 * S.T), mx = Math.hypot(1 - S.zeta * w0 * S.T, w0 * Math.sqrt(1 - S.zeta * S.zeta) * S.T);
          return `$T=${v.fix(S.T, 3)}$ s: largest error of the exact model at the sampling instants **${S.dmax < 1e-6 ? '$' + v.sci(Math.max(S.dmax, 1e-16), 2) + '$' : v.fix(S.dmax, 6)}**, of forward Euler ${S.emax > 1e5 ? 'unbounded' : v.fix(S.emax, 3)}\n` +
            `eigenvalue moduli: $|e^{\\lambda T}|=${v.fix(me, 3)}$ (inside the circle always), $|1+\\lambda T|=${v.fix(mx, 3)}$ (${mx > 1 ? 'outside: Euler is unstable' : 'inside'})`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10',
      kind: 'Model',
      name: 'Time delay and the Padé approximation',
      statement: String.raw`A pure **time delay** $\theta$ (transport of material along a pipe or belt, communication lag, computation time) maps an input to $y(t)=u(t-\theta)$ and has the irrational transfer function $e^{-s\theta}$, of infinite order. Control design usually needs a rational approximation, and the standard one is the diagonal **Padé approximant** of order $n$,
$$e^{-s\theta}\approx\frac{\sum_{k=0}^n(-1)^kc_k(\theta s)^k}{\sum_{k=0}^nc_k(\theta s)^k},\qquad c_k=\frac{(2n-k)!\,n!}{(2n)!\,k!\,(n-k)!},$$
which matches the Taylor series of $e^{-s\theta}$ through $s^{2n}$. For $n=1$ it is $(1-s\theta/2)/(1+s\theta/2)$. All Padé approximants have gain exactly one at all frequencies but have $n$ zeros in the right half-plane (the mirror images of their poles); their step responses start with a **wrong-way dip**.`,
      idea: String.raw`A delay has unit gain and phase $-\omega\theta$ that grows without bound. A rational all-pass function can only supply a bounded phase lag, $-n\pi$ in total, which is why the approximation is good up to some frequency and then fails. Taking the quotient of Taylor polynomials of $e^{\mp s\theta/2}$ gives the matching of $2n$ terms; the right-half-plane zeros are what makes the approximation non-minimum phase, as the true delay is (sig-5.3 for the delay in the Laplace domain), so a controller cannot cancel it.`,
      caption: String.raw`The thick black curve is the response of a pure delay $\theta$ to a unit step. The coloured curves are the step responses of the Padé approximants of order 1 to 4 (select one order or show all). Higher orders hug the delayed step more closely, and every one starts by moving the wrong way, $y(0^+)=(-1)^n$ (the initial dip). The right panel shows the phase of each approximant against the true phase $-\omega\theta$ (a straight line): each follows it up to a frequency and then flattens out at $-n\pi$.`,
      deps: ['sig-5.3', 'ctrl-2.7'],
      refs: ['Franklin–Powell §6.8', 'Franklin–Powell §5.6'],
      tags: ['time delay', 'approximation'],
      viz(v) {
        const COL = ['purple', 'orange', 'green', 'teal', 'pink'];
        const thS = v.slider('delay $\\theta$ (s)', 0.3, 2, 1, { step: 0.05 });
        const nS = v.select('order $n$', [1, 2, 3, 4].map((n) => ({ value: n, label: String(n) })), 2);
        const allT = v.toggle('show all orders', false);
        const TEND = 6;
        const stp = v.stage({ x: [0, TEND], y: [-1.3, 2], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'step response', height: 340, weight: 1.3 });
        const ph = v.stage({ x: [0, 12], y: [-13, 1], axes: 'box', gutter: true, xlabel: 'frequency × delay, ωθ', ylabel: 'phase (rad)', height: 340 });
        const cache = new Map();
        const resp = (n, th) => { const k = n + '|' + th; if (!cache.has(k)) { if (cache.size > 40) cache.clear(); cache.set(k, stepExact(v.M, pade(n, th), TEND, 600)); } return cache.get(k); };
        const phase = (n, th) => { const G = pade(n, th), pts = []; let prev = 0, off = 0; for (let i = 0; i <= 240; i++) { const x = (12 * i) / 240, g = tfAt(G, x / th); let a = Math.atan2(g[1], g[0]) + off; if (i > 0) { while (a - prev > Math.PI) { off -= TAU; a -= TAU; } while (a - prev < -Math.PI) { off += TAU; a += TAU; } } prev = a; pts.push([x, a]); } return pts; };
        v.render(() => {
          const th = thS.value, orders = allT.value ? [1, 2, 3, 4] : [nS.value];
          stp.hline(0, { color: 'faint' }); stp.hline(1, { color: 'faint', dash: [3, 4] });
          stp.vline(th, { color: 'ink', width: 1, alpha: 0.4, dash: [4, 4] });
          for (const n of orders) { const r = resp(n, th); stp.clip(() => trace(stp, r.t, r.y, { color: COL[n - 1], width: 2.6 })); }
          stp.path([[0, 0], [th, 0], null, [th, 0], [th, 1], null, [th, 1], [TEND, 1]], { color: 'ink', width: 3 });
          ph.path([[0, 0], [12, -12]], { color: 'ink', width: 3 });
          for (const n of orders) ph.path(phase(n, th), { color: COL[n - 1], width: 2.4 });
          for (const n of orders) ph.hline(-n * Math.PI, { color: COL[n - 1], dash: [3, 5], width: 1, alpha: 0.6 });
        });
        v.legend([['ink', 'pure delay'], ...[1, 2, 3, 4].map((n) => [COL[n - 1], `Padé order ${n}`])]);
        v.readout(() => {
          const th = thS.value, n = nS.value, r = resp(n, th);
          let dip = 0, dev = 0; for (let i = 0; i < r.t.length; i++) { dip = Math.min(dip, r.y[i]); const ref = r.t[i] < th ? 0 : 1; dev = Math.max(dev, Math.abs(r.y[i] - ref)); }
          const ph = phase(n, th); let lim = 12; for (const [x, a] of ph) if (Math.abs(a + x) > 0.1) { lim = x; break; }
          return `order ${n}: $y(0^+)=${(-1) ** n}$ (initial dip to ${v.fix(dip, 2)}) · matches $e^{-s\\theta}$ through $s^{${2 * n}}$ · step response differs from the true delayed step by at most ${v.fix(dev, 2)} (largest near the jump) · phase within 0.1 rad of $-\\omega\\theta$ up to $\\omega\\theta\\approx${v.fix(lim, 2)}$, limit phase $-${n}\\pi$\n` +
            `$\\mathrm{Padé}_${n}(s)=${tfTeX(pade(n, th))}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11',
      kind: 'Model',
      name: 'First-order-plus-dead-time process model',
      statement: String.raw`Many industrial processes (a tank being heated, a chemical reactor, a long pipe) have smooth, monotone, S-shaped step responses that are well described by the **first-order-plus-dead-time** (FOPDT) model
$$G(s)=\frac{K\,e^{-\theta s}}{\tau s+1},\qquad y(t)=K\big(1-e^{-(t-\theta)/\tau}\big)\ \ (t>\theta)$$
for a unit step, with **gain** $K$ (final value per unit input), **time constant** $\tau$ and **dead time** $\theta$. Three numbers read from one experiment are enough: $K$ is the settled level, $\theta$ the time at which the response starts to move, and $\theta+\tau$ the time at which it reaches $63.2\,\%$ of $K$. Real processes are of higher order, and then $\theta$ absorbs the sum of the small lags: the model is an approximation fitted to a purpose, not an identity.`,
      idea: String.raw`A cascade of many small lags looks, from the outside, like a pure delay followed by one dominant lag (this is the content of the Padé approximation of ctrl-2.10 read in reverse). Because the model has only three parameters that map directly to features of the curve, it can be fitted by eye, by the two-point method, or by least squares, and classical PID tuning rules built on step-response experiments are expressed in terms of $K,\tau,\theta$.`,
      caption: String.raw`Dots are a noisy measured step response (seeded noise: **Resample** draws new noise). **Drag the three handles** (the settled level $K$ on the right, the dead time $\theta$ on the time axis, and the 63.2 % point at $t=\theta+\tau$) and the green model curve follows. The lower panel shows the residuals. Press **Least squares** to see the best possible fit and compare its error with yours. Choose a process that is *not* FOPDT (three equal lags) to see that the model is only an approximation: the fit improves little however you drag, and the fitted $\theta$ is large.`,
      deps: ['ctrl-2.10'],
      refs: ['Åström–Murray §11.3'],
      tags: ['process model', 'system identification'],
      scope: String.raw`Monotone, over-damped responses without strong oscillation; poor for processes with oscillation, integrators or non-minimum-phase behaviour.`,
      viz(v) {
        const TEND = 20, NP = 60;
        const plS = v.select('true process', [{ value: 'fopdt', label: 'exact FOPDT' }, { value: 'lag3', label: 'three equal lags' }, { value: 'lag2z', label: 'two lags and a delay' }], 'lag3', { onChange: () => { P.K = 1.6; P.th = 1.5; P.tau = 4; } });
        const nsS = v.slider('noise level (% of $K_{\\rm true}$)', 0, 8, 2.5, { step: 0.5 });
        let seed = 11;
        v.button('Resample noise', () => { seed++; });
        const P = { K: 1.6, th: 1.5, tau: 4 };
        const st = v.stage({ x: [0, TEND], y: [-0.3, 2.6], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'process output y', height: 330 });
        const rs = v.stage({ x: [0, TEND], y: [-0.7, 0.7], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'residual', height: 160, full: true });
        const hK = st.handle(TEND - 1.2, P.K, { color: 'green', constrain: 'y', label: 'K', labelPos: 'n' });
        const hT = st.handle(P.th, 0, { color: 'orange', constrain: 'x', label: 'θ', labelPos: 'n' });
        const hS = st.handle(P.th + P.tau, 0.632 * P.K, { color: 'accent', constrain: 'x', label: '63 %', labelPos: 'se' });
        hK.onDrag = () => { P.K = clamp(hK.y, 0.05, 2.5); };
        hT.onDrag = () => { P.th = clamp(hT.x, 0, 12); };
        hS.onDrag = () => { P.tau = clamp(hS.x - P.th, 0.1, 18); };
        let key = '', D = null;
        const gen = () => {
          const k = [plS.value, nsS.value, seed].join('|');
          if (k !== key) {
            key = k;
            const Ktrue = 2, ts = Array.from({ length: NP + 1 }, (_, i) => (TEND * i) / NP);
            let clean;
            if (plS.value === 'fopdt') clean = ts.map((t) => (t > 1.5 ? Ktrue * (1 - Math.exp(-(t - 1.5) / 4)) : 0));
            else if (plS.value === 'lag3') { const r = stepExact(v.M, tf([Ktrue], [1, 3 * 1.7, 3 * 1.7 ** 2, 1.7 ** 3]), TEND, NP); clean = r.y; }
            else { const r = stepExact(v.M, tf([Ktrue], [1, 4.5, 4.5]), TEND, NP), d = 1.2; clean = r.y.map((_, i) => { const t = ts[i] - d; if (t <= 0) return 0; const f = (t / TEND) * NP, j = Math.min(NP - 1, Math.floor(f)); return r.y[j] + (f - j) * (r.y[j + 1] - r.y[j]); }); }
            const rng = v.rng(seed * 7 + 3), sig = (nsS.value / 100) * Ktrue;
            D = { ts, y: clean.map((c) => c + sig * rng.normal()), clean, Ktrue };
          }
          return D;
        };
        const model = (p, t) => (t <= p.th ? 0 : p.K * (1 - Math.exp(-(t - p.th) / p.tau)));
        const rms = (p) => { const d = gen(); let s = 0; d.ts.forEach((t, i) => { s += (d.y[i] - model(p, t)) ** 2; }); return Math.sqrt(s / d.ts.length); };
        v.button('Least squares', () => {
          const d = gen(), f = (x) => { const p = { K: x[0], th: Math.max(0, x[1]), tau: Math.max(0.05, x[2]) }; return rms(p) + (x[1] < 0 ? 10 * -x[1] : 0) + (x[2] < 0.05 ? 10 : 0); };
          let best = null; for (const x0 of [[P.K, P.th, P.tau], [d.Ktrue, 2, 3], [d.Ktrue, 4, 6]]) { const r = v.M.nelderMead(f, x0, { step: 0.5, tol: 1e-9, maxIt: 800 }); if (!best || r.fx < best.fx) best = r; }
          P.K = best.x[0]; P.th = Math.max(0, best.x[1]); P.tau = Math.max(0.1, best.x[2]);
        });
        v.render(() => {
          const d = gen();
          hK.set(TEND - 1.2, P.K); hT.set(P.th, 0); hS.set(P.th + P.tau, 0.632 * P.K);
          st.hline(0, { color: 'faint' });
          st.dots(d.ts.map((t, i) => [t, d.y[i]]), { r: 3.2, color: 'muted' });
          st.hline(P.K, { color: 'green', dash: [4, 4], width: 1.2 });
          st.vline(P.th, { color: 'orange', dash: [4, 4], width: 1.2 }); st.vline(P.th + P.tau, { color: 'accent', dash: [4, 4], width: 1.2 });
          st.path(samples((t) => model(P, t), 0, TEND, 400), { color: 'green', width: 3 });
          st.line(P.th, 0, P.th + P.tau, 0, { color: 'accent', width: 2.2 });
          st.text('τ', P.th + P.tau / 2, -0.12, { size: 13, color: 'accent', align: 'center', math: true });
          rs.hline(0, { color: 'faint' });
          rs.dots(d.ts.map((t, i) => [t, d.y[i] - model(P, t)]), { r: 3.2, color: 'red' });
        });
        v.legend([['muted', 'measured data', { dot: true }], ['green', 'FOPDT model $Ke^{-\\theta s}/(\\tau s+1)$'], ['red', 'residual', { dot: true }]]);
        v.readout(() => {
          const d = gen(), r1 = rms(P);
          const sol = (() => { const f = (x) => rms({ K: x[0], th: Math.max(0, x[1]), tau: Math.max(0.05, x[2]) }); let best = null; for (const x0 of [[d.Ktrue, 1.5, 4], [d.Ktrue, 3, 3]]) { const r = v.M.nelderMead(f, x0, { step: 0.5, tol: 1e-9, maxIt: 400 }); if (!best || r.fx < best.fx) best = r; } return best; })();
          return `your model: $K=${v.fix(P.K, 2)}$, $\\tau=${v.fix(P.tau, 2)}$ s, $\\theta=${v.fix(P.th, 2)}$ s, RMS error **${v.fix(r1, 3)}** · best least-squares fit: $K=${v.fix(sol.x[0], 2)}$, $\\tau=${v.fix(Math.max(sol.x[2], 0), 2)}$, $\\theta=${v.fix(Math.max(sol.x[1], 0), 2)}$, RMS ${v.fix(sol.fx, 3)}` +
            (plS.value === 'fopdt' ? ` · the data were generated with $K=2$, $\\tau=4$, $\\theta=1.5$` : ` · the process is not FOPDT: even the best fit leaves a systematic residual`);
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12',
      kind: 'Concept',
      name: 'Common nonlinearities: saturation, dead zone, backlash',
      statement: String.raw`Real components depart from linearity in a few standard ways, each a static or memory-carrying map from an input $u$ to an output $y$:
- **saturation**: $y=\mathrm{sat}_p(u)=\max(-p,\min(p,u))$, an actuator that has reached its limit;
- **dead zone**: $y=\mathrm{sgn}(u)\max(|u|-p,0)$, friction or a valve that does nothing for small signals;
- **relay** (on–off): $y=p\,\mathrm{sgn}(u)$, a thermostat or a switching amplifier;
- **backlash** (play in gears): $y$ stays still while $u$ moves inside a gap of width $p$ and then follows $u$ at a fixed offset, so the map has **memory** and traces a loop.

For a sinusoidal input $u=A\sin\omega t$ the output is periodic but no longer a sinusoid: it contains harmonics of $\omega$, and its fundamental has an amplitude ratio $N(A)=c_1/A$ and phase shift that depend on the **amplitude** $A$ (the *describing function*), unlike for a linear system.`,
      idea: String.raw`Each map is simple to write down, but the superposition principle fails: doubling the input does not double the output, and the response to a sum is not the sum of responses. A sinusoid passed through a symmetric static nonlinearity produces only odd harmonics. Backlash has memory and additionally causes a phase lag that grows with its width, which is destabilising in a feedback loop. Linearisation (ctrl-2.2) fails for these maps because they are not differentiable at the corners, so they have to be modelled explicitly.`,
      caption: String.raw`A sine wave $u=A\sin\phi$ passes through the chosen block. Left: the input–output map (a curve, or for backlash a loop traced once per cycle, with the gold dot following the present input). Middle: input and output in time. Right: the amplitudes of the harmonics of the output relative to $A$. Raise $A$ and watch the saturation clip, the dead zone eat small signals (the ratio $N(A)$ rises towards 1), the relay produce a square wave, and the backlash loop open up and lag the output.`,
      deps: ['ctrl-2.1'],
      refs: ['Franklin–Powell §9.1'],
      tags: ['nonlinearity', 'describing function'],
      viz(v) {
        const KINDS = [{ value: 'sat', label: 'saturation' }, { value: 'dead', label: 'dead zone' }, { value: 'relay', label: 'relay' }, { value: 'back', label: 'backlash' }];
        const kS = v.select('block', KINDS, 'sat');
        const aS = v.slider('input amplitude $A$', 0.2, 3, 1.8, { step: 0.05 });
        const pS = v.slider('parameter $p$ (limit / half-width / level / gap)', 0.1, 1.5, 0.8, { step: 0.05 });
        const mp = v.stage({ x: [-3.4, 3.4], y: [-3.4, 3.4], equal: true, axes: true, height: 340, weight: 1, minWidth: 280, title: 'input–output map' });
        const tm = v.stage({ x: [0, TAU], y: [-3.4, 3.4], axes: 'box', gutter: true, xlabel: 'phase φ (rad)', ylabel: 'u and y', height: 340, weight: 1.1 });
        const hm = v.stage({ x: [0.4, 7.6], y: [0, 1.4], axes: 'box', gutter: true, xlabel: 'harmonic k', ylabel: 'amplitude / A', height: 340, weight: 0.9, minWidth: 240 });
        const NC = 400;
        let key = '', S = null;
        const apply = (kind, p, u, yPrev) => {
          switch (kind) {
            case 'sat': return Math.max(-p, Math.min(p, u));
            case 'dead': return Math.sign(u) * Math.max(Math.abs(u) - p, 0);
            case 'relay': return u > 0 ? p : u < 0 ? -p : 0;
            default: { const hw = p / 2; return u - yPrev > hw ? u - hw : u - yPrev < -hw ? u + hw : yPrev; }
          }
        };
        const solve = () => {
          const k = [kS.value, aS.value, pS.value].join('|');
          if (k !== key) {
            key = k;
            const A = aS.value, p = pS.value, kind = kS.value; let y = 0;
            const us = [], ys = [], ph = [];
            for (let c = 0; c < 3; c++) for (let i = 0; i < NC; i++) { const f = (TAU * i) / NC, u = A * Math.sin(f); y = apply(kind, p, u, y); if (c === 2) { us.push(u); ys.push(y); ph.push(f); } }
            us.push(us[0]); ys.push(ys[0]); ph.push(TAU);
            const a = [], b = [], c = [];
            for (let h = 1; h <= 7; h++) { let ah = 0, bh = 0; for (let i = 0; i < NC; i++) { ah += ys[i] * Math.cos(h * ph[i]); bh += ys[i] * Math.sin(h * ph[i]); } a.push((2 * ah) / NC); b.push((2 * bh) / NC); c.push(Math.hypot((2 * ah) / NC, (2 * bh) / NC)); }
            const N1 = c[0] / A, psi = Math.atan2(a[0], b[0]);
            const rest = Math.sqrt(c.slice(1).reduce((s, x) => s + x * x, 0)), thd = c[0] > 1e-9 ? rest / c[0] : 0;
            S = { us, ys, ph, c, N1, psi, thd, A };
          }
          return S;
        };
        v.animate((t) => {
          const S = solve(), f = t % TAU, i = Math.min(NC - 1, Math.floor((f / TAU) * NC));
          mp.line(-3.4, -3.4, 3.4, 3.4, { color: 'faint', dash: [4, 4], width: 1.2 });
          mp.path(S.us.map((u, j) => [u, S.ys[j]]), { color: 'accent', width: 3 });
          mp.line(S.us[i], 0, S.us[i], S.ys[i], { color: 'gold', width: 1.4, dash: [3, 3] }); mp.line(0, S.ys[i], S.us[i], S.ys[i], { color: 'gold', width: 1.4, dash: [3, 3] });
          mp.dot(S.us[i], S.ys[i], { r: 6, color: 'gold' });
          tm.hline(0, { color: 'faint' });
          tm.path(S.ph.map((p, j) => [p, S.us[j]]), { color: 'muted', width: 2, dash: [5, 4] });
          const fund = S.ph.map((p) => S.c[0] * Math.sin(p + S.psi));
          tm.path(S.ph.map((p, j) => [p, fund[j]]), { color: 'green', width: 1.6, alpha: 0.8 });
          tm.path(S.ph.map((p, j) => [p, S.ys[j]]), { color: 'orange', width: 2.8 });
          tm.vline(f, { color: 'gold', width: 1.4 });
          tm.dot(f, S.us[i], { r: 4.5, color: 'muted' }); tm.dot(f, S.ys[i], { r: 5, color: 'orange' });
          hm.setView([0.4, 7.6], [0, Math.max(1.15, ...S.c.map((x) => (x / S.A) * 1.12))]);
          hm.hline(1, { color: 'faint', dash: [3, 4] });
          hm.bars(S.c.map((x) => x / S.A), { x0: 1, dx: 1, color: (val, k) => (k === 0 ? 'green' : 'red') });
        }, { period: TAU, still: 1.2 });
        v.legend([['muted', 'input $u=A\\sin\\phi$', { dash: true }], ['orange', 'output $y$'], ['green', 'its fundamental component'], ['red', 'harmonics', { area: true }]]);
        v.readout(() => {
          const S = solve(); if (!S) return '';
          return `describing function at $A=${v.fix(S.A, 2)}$: amplitude ratio $N=c_1/A=${v.fix(S.N1, 3)}$, phase ${v.fix((S.psi * 180) / Math.PI, 1)}$^\\circ$ · harmonics: ${S.c.slice(1, 4).map((x, k) => `$c_${k + 2}/A=${v.fix(x / S.A, 3)}$`).join(', ')} · distortion (harmonics relative to fundamental) ${v.fix(S.thd * 100, 1)} %`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13',
      kind: 'Definition',
      name: 'Transfer matrices and transmission zeros',
      statement: String.raw`A linear system with $m$ inputs and $p$ outputs has a **transfer matrix** $G(s)=C(sI-A)^{-1}B+D$, a $p\times m$ matrix of rational functions with $Y(s)=G(s)U(s)$. A complex number $z$ is a **transmission zero** if the rank of $G$ drops at $z$: $\operatorname{rank}G(z)<\max_s\operatorname{rank}G(s)$ (the *normal rank*, equal to $2$ for a square invertible plant). For a square plant this means $\det G(z)=0$, so there is an input direction $u_z\neq0$ with $G(z)u_z=0$: the signal $u_z\,e^{zt}$ (with suitable initial conditions) produces *no output at all*. Zeros in the right half-plane limit the performance achievable by any feedback controller.`,
      idea: String.raw`For a scalar system a transmission zero is just a root of the numerator. For a matrix, zeros are not the zeros of the entries but the frequencies where the matrix, as a whole, becomes singular (its smallest singular value vanishes); they are therefore invisible in the individual input–output channels and can differ in position from the zeros of every entry. Writing $G=N(s)/d(s)$ with a polynomial matrix $N$, the zeros are the roots of $\det N(s)$ when no pole cancels (sig-9.6 for rational functions in $s$, ctrl-2.7 for $G$ itself).`,
      caption: String.raw`The plant is $G(s)=\dfrac{1}{(s+1)(s+2)}\begin{bmatrix}s-a&b\\c&s-d\end{bmatrix}$ with parameters you choose. The colour map is the smallest singular value $\sigma_{\min}(G(s))$ over the complex plane (the colour deepens as $\sigma_{\min}$ grows, so the zeros are the spots where it fades towards the background). **Drag the gold point** along the real axis (or press *Go to a zero*). On the right, the unit circle of input directions and the image ellipse $G(s)u/\sigma_{\max}$: as $s$ approaches a transmission zero the ellipse collapses to a line segment, and the red input direction is mapped to nothing. The bottom plot shows both singular values along the real axis; $\sigma_{\min}$ dips to zero at the zeros.`,
      deps: ['ctrl-2.7'],
      refs: ['Franklin–Powell §7.4'],
      tags: ['multivariable', 'zeros'],
      viz(v) {
        const aS = v.slider('$a$', -3, 3, 1, { step: 0.1 }), bS = v.slider('$b$', -3, 3, 1, { step: 0.1 });
        const cS = v.slider('$c$', -3, 3, 1.5, { step: 0.1 }), dS = v.slider('$d$', -3, 3, 2, { step: 0.1 });
        const sp = v.stage({ x: [-4, 4], y: [-3, 3], axes: true, height: 330, weight: 1.3, minWidth: 320, xlabel: 'Re s', ylabel: 'Im s', title: '$\\log_{10}\\sigma_{\\min}(G(s))$' });
        const el = v.stage({ x: [-1.7, 1.7], y: [-1.7, 1.7], equal: true, axes: true, height: 330, weight: 1, minWidth: 260, title: 'inputs $u$ (unit circle) and outputs $Gu/\\sigma_{\\max}$' });
        const sg = v.stage({ x: [-4, 4], y: [1e-3, 1e2], ylog: true, axes: 'box', gutter: true, xlabel: 's (real)', ylabel: 'singular values', height: 260, full: true });
        const hs = sp.handle(0.5, 0, { color: 'gold', constrain: { x: [-4, 4], y: [0, 0] }, label: 's', labelPos: 'ne', r: 8 });
        const par = () => ({ a: aS.value, b: bS.value, c: cS.value, d: dS.value });
        const zerosOf = (p) => { const tr = p.a + p.d, dt = p.a * p.d - p.b * p.c, disc = tr * tr - 4 * dt; return disc >= 0 ? [[(tr - Math.sqrt(disc)) / 2, 0], [(tr + Math.sqrt(disc)) / 2, 0]] : [[tr / 2, Math.sqrt(-disc) / 2], [tr / 2, -Math.sqrt(-disc) / 2]]; };
        v.button('Go to a zero', () => { const z = zerosOf(par()); const real = z.filter((q) => Math.abs(q[1]) < 1e-9 && Math.abs(q[0]) <= 4); if (real.length) { const cur = hs.x, q = real.reduce((b, r) => (Math.abs(r[0] - cur) > 1e-6 && (Math.abs(b[0] - cur) <= 1e-6 || Math.abs(r[0] - cur) < Math.abs(b[0] - cur)) ? r : b), real[0]); hs.set(q[0], 0); } });
        // G(s) at complex s = [re, im]: entries as complex numbers
        const Gc = (p, s) => { const d = cmul([s[0] + 1, s[1]], [s[0] + 2, s[1]]), e = (num) => cdiv(num, d); return [[e([s[0] - p.a, s[1]]), e([p.b, 0])], [e([p.c, 0]), e([s[0] - p.d, s[1]])]]; };
        const sv = (p, s) => {
          const G = Gc(p, s), F = G.flat().reduce((t, z) => t + z[0] * z[0] + z[1] * z[1], 0);
          const dt = (() => { const m1 = cmul(G[0][0], G[1][1]), m2 = cmul(G[0][1], G[1][0]); return Math.hypot(m1[0] - m2[0], m1[1] - m2[1]); })();
          const smax = Math.sqrt((F + Math.sqrt(Math.max(0, F * F - 4 * dt * dt))) / 2);
          return { smax, smin: smax > 0 ? dt / smax : 0 };
        };
        v.render(() => {
          const p = par(), key = JSON.stringify(p);
          sp.heat((x, y) => Math.log10(Math.max(1e-6, sv(p, [x, y]).smin)), { range: [-2.2, 0.8], cmap: 'theme', res: 4, key });
          sp.hline(0, { color: 'faint' });
          for (const z of [[-1, 0], [-2, 0]]) xMark(sp, z[0], z[1], { color: 'red', r: 5 });
          for (const z of zerosOf(p)) sp.dot(z[0], z[1], { r: 7, hollow: true, color: 'green', width: 2.4 });
          sp.text('poles ×  zeros ○', -3.9, -2.7, { size: 11, color: 'muted', align: 'left', plate: true });
          const s0 = hs.x, G = Gc(p, [s0, 0]), M2 = [[G[0][0][0], G[0][1][0]], [G[1][0][0], G[1][1][0]]];
          const h11 = M2[0][0] ** 2 + M2[1][0] ** 2, h22 = M2[0][1] ** 2 + M2[1][1] ** 2, h12 = M2[0][0] * M2[0][1] + M2[1][0] * M2[1][1];
          const phi = 0.5 * Math.atan2(2 * h12, h11 - h22), r = sv(p, [s0, 0]);
          const img = (th) => { const u = [Math.cos(th), Math.sin(th)]; return [(M2[0][0] * u[0] + M2[0][1] * u[1]) / r.smax, (M2[1][0] * u[0] + M2[1][1] * u[1]) / r.smax]; };
          el.curve((th) => [Math.cos(th), Math.sin(th)], 0, TAU, { color: 'muted', width: 1.6, n: 120 });
          el.curve(img, 0, TAU, { color: 'orange', width: 3, n: 160, fill: 'orange', fillAlpha: 0.1 });
          const um = [-Math.sin(phi), Math.cos(phi)], ux = [Math.cos(phi), Math.sin(phi)];
          el.arrow(0, 0, um[0], um[1], { color: 'red', width: 2.6, head: 9 }); el.text('weakest input', um[0] * 1.15, um[1] * 1.15, { size: 11, color: 'red', align: 'center' });
          const iu = img(phi + Math.PI / 2); el.arrow(0, 0, iu[0], iu[1], { color: 'red', width: 2, head: 7, alpha: 0.7 });
          const im2 = img(phi); el.arrow(0, 0, im2[0], im2[1], { color: 'green', width: 2.6, head: 9 });
          el.text('strongest', ux[0] * 1.12, ux[1] * 1.12 + 0.12, { size: 11, color: 'green', align: 'center' });
          sg.fn((s) => sv(p, [s, 0]).smax, { color: 'green', width: 2.2, n: 500 }); sg.fn((s) => sv(p, [s, 0]).smin, { color: 'red', width: 2.2, n: 500 });
          for (const z of zerosOf(p)) if (Math.abs(z[1]) < 1e-9) sg.vline(z[0], { color: 'green', dash: [4, 4], width: 1.2 });
          sg.vline(s0, { color: 'gold', width: 1.6 });
        });
        v.legend([['green', 'largest singular value $\\sigma_{\\max}$'], ['red', 'smallest singular value $\\sigma_{\\min}$'], ['orange', 'image of the unit circle']]);
        v.readout(() => {
          const p = par(), z = zerosOf(p), s0 = hs.x, r = sv(p, [s0, 0]);
          const G = Gc(p, [s0, 0]), M2 = [[G[0][0][0], G[0][1][0]], [G[1][0][0], G[1][1][0]]];
          const h11 = M2[0][0] ** 2 + M2[1][0] ** 2, h22 = M2[0][1] ** 2 + M2[1][1] ** 2, h12 = M2[0][0] * M2[0][1] + M2[1][0] * M2[1][1];
          const phi = 0.5 * Math.atan2(2 * h12, h11 - h22), um = [-Math.sin(phi), Math.cos(phi)];
          const out = [M2[0][0] * um[0] + M2[0][1] * um[1], M2[1][0] * um[0] + M2[1][1] * um[1]];
          const zt = z.map((q) => cTeX(q, 3)).join(',\\; ');
          return `transmission zeros: roots of $s^2-${nTeX(p.a + p.d, 3)}s+${nTeX(p.a * p.d - p.b * p.c, 3)}$ (numerator of $\\det G$): $${zt}$\n` +
            `at $s=${v.fix(s0, 3)}$: $\\sigma_{\\max}=${v.fix(r.smax, 3)}$, $\\sigma_{\\min}=${v.fix(r.smin, 4)}$ · weakest input direction $u=(${v.fix(um[0], 3)},${v.fix(um[1], 3)})$ is mapped to $|Gu|=${v.fix(Math.hypot(out[0], out[1]), 4)}$` +
            (Math.abs(z[0][1]) > 1e-9 ? ' · the zeros are complex: they are visible in the colour map but not on the real axis' : '');
        });
      },
    },
  ],
};
