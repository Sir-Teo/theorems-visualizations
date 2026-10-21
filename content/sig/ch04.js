// Signals & Systems — Chapter 4: Fourier series (items 4.1–4.4)
import { TAU, PI, WAVES, coefsOf, waveMenu, mag, partial, seqAt, zip, grid, powerOf, tailPower, PI_TICKS, PI2_TICKS } from './ch04.shared.js';

const POW = {};
const powOf = (id) => (POW[id] ??= powerOf(WAVES[id].f));
const ymaxOf = (id) => { let m = 0; for (let i = 0; i <= 400; i++) m = Math.max(m, Math.abs(WAVES[id].f(-PI + (TAU * i) / 400))); return m; };

export default {
  collection: 'sig',
  chapter: 4,
  title: 'Fourier series',
  summary: String.raw`Because complex exponentials pass through LTI systems unchanged, it pays to write periodic signals as sums of harmonics. Orthogonality makes the coefficients easy to compute, and Parseval says the power is shared out among the harmonics. The convergence story is subtle and famous: Gibbs overshoot at jumps, smooth signals with rapidly decaying spectra, and continuous signals whose series diverge at a point, which Fejér's averaging repairs. The chapter ends with the discrete-time series, which is exact with no convergence questions at all, and with the spectra of the classic waveforms you can hear.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Fourier series of a periodic signal',
      statement: String.raw`Let $x$ be periodic with fundamental period $T$ (sig-1.4) and put $\omega_0=2\pi/T$. Its **Fourier series** is the sum of harmonics
$$x(t)\sim\sum_{k=-\infty}^{\infty}c_k\,e^{jk\omega_0 t},\qquad c_k=\frac1T\int_T x(t)\,e^{-jk\omega_0 t}\,dt .$$
The term with index $k$ is the $k$-th harmonic, with frequency $k\omega_0$; $c_0$ is the mean of $x$. For a real signal $c_{-k}=\overline{c_k}$, so the pair $\pm k$ combines into one real cosine, $x(t)\sim c_0+\sum_{k\ge1}2|c_k|\cos(k\omega_0t+\arg c_k)$. The symbol $\sim$ says only that the series is attached to $x$; in what sense it represents $x$ is the subject of the rest of the chapter.`,
      idea: String.raw`The complex exponentials $e^{jk\omega_0t}$ are eigenfunctions of every LTI system (sig-3.9), so a signal built from them is understood by what the system does to each one. They are also the natural building blocks of periodic functions: trigonometric series on the circle go back to pma-8.9. Writing the cosine with phase makes each harmonic a rotating arrow of length $2|c_k|$; the sum of arrows is the signal. Why the $c_k$ formula is the right one is the orthogonality of the exponentials (sig-4.2).`,
      caption: String.raw`The animation stacks the rotating phasors $c_ke^{jk t}$ tip to tail (pairs $+k,-k$, so the tip returns to the vertical axis after each pair); the height of the tip is the partial sum $S_N(t)$, which the middle panel draws out in time. Raise $N$ and the drawing sharpens toward the signal (grey); the bar chart shows the coefficient magnitudes that set the circle sizes. Try the square wave, whose circles shrink like $1/k$, against the smooth lopsided signal whose circles shrink very fast.`,
      deps: ['pma-8.9', 'sig-3.9', 'sig-1.4'],
      refs: ['Oppenheim–Willsky §3.3', 'Lathi ch. 6'],
      tags: ['Fourier series', 'harmonics'],
      credit: 'Fourier, 1807 memoir and 1822 book',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Fourier_series' },
      viz(v) {
        const wsel = v.select('waveform', waveMenu(['square', 'saw', 'tri', 'skew']), 'square');
        const nsl = v.slider('harmonics $N$', 0, 30, 5, { step: 1, int: true });
        const A = v.stage({ x: [-2.3, 2.3], y: [-1.9, 1.9], equal: true, axes: false, height: 330, title: 'phasors $c_ke^{jkt}$, tip to tail' });
        const B = v.stage({ x: [0, TAU], y: [-1.9, 1.9], axes: 'box', gutter: true, xlabel: 't', xticks: PI2_TICKS, height: 330, title: 'signal (grey) and partial sum $S_N$' });
        const C = v.stage({ x: [-0.8, 20.8], y: [0, 0.7], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'size', height: 180, full: true, title: 'coefficient magnitudes $|c_k|$ (blue: included, grey: not yet)' });
        let info = null;
        v.animate((t) => {
          const id = wsel.value, N = nsl.value, W = WAVES[id], c = coefsOf(id, 30), th = (TAU * t) / 10;
          // chain of phasors, rotated by 90 degrees so that the real part is vertical
          let px = 0, py = 0;
          A.vline(0, { color: 'grid', width: 1 });
          const step = (re, im, k, col) => {
            const a = k * th, zr = re * Math.cos(a) - im * Math.sin(a), zi = re * Math.sin(a) + im * Math.cos(a);
            const nx = px - zi, ny = py + zr, r = Math.hypot(re, im);
            if (r > 0.004) { A.circle(px, py, r, { color: 'faint', width: 1, alpha: 0.7 }); A.line(px, py, nx, ny, { color: col, width: 2 }); }
            px = nx; py = ny;
          };
          step(c.re[0], 0, 0, 'accent');
          for (let k = 1; k <= N; k++) { step(c.re[k], c.im[k], k, 'accent'); step(c.re[k], -c.im[k], -k, 'orange'); }
          const S = py;
          A.line(px, py, 2.3, py, { color: 'gold', dash: true, alpha: 0.8 });
          A.dot(px, py, { r: 5.5, color: 'gold' });
          const ts = grid(0, TAU, 480), sv = partial(c, N, ts);
          B.fn(W.f, { domain: [0, TAU], color: 'faint', width: 1.8 });
          B.path(zip(ts, sv), { color: 'accent', width: 2.2 });
          B.dot(th % TAU, S, { r: 5.5, color: 'gold' });
          const mags = Array.from({ length: 21 }, (_, k) => mag(c, k));
          C.setView(null, [0, Math.max(...mags) * 1.2]);
          C.bars(mags, { x0: 0, color: (val, i) => (i <= N ? 'accent' : 'faint') });
          info = { id, N, S, err: Math.sqrt(tailPower(c, N, powOf(id))), th };
        }, { period: 10, still: 1.25 });
        v.legend([['accent', 'phasor $+k$ and partial sum'], ['orange', 'phasor $-k$'], ['gold', 'tip = $S_N(t)$']]);
        v.readout(() => `$N=${info.N}$: tip height $S_N(t)=${v.fix(info.S, 3)}$ at $t=${v.fix(info.th % TAU, 2)}$, root-mean-square error of the partial sum $=${v.fix(info.err, 3)}$ (computed from the omitted coefficients by Parseval, sig-4.6).`);
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Theorem',
      name: 'Coefficients by orthogonality',
      statement: String.raw`On a period $T=2\pi/\omega_0$ the exponentials are orthogonal:
$$\frac1T\int_T e^{jm\omega_0t}\,e^{-jk\omega_0t}\,dt=\begin{cases}1,&m=k,\\0,&m\ne k.\end{cases}$$
Consequently, if a periodic $x$ is a finite sum $x=\sum_m a_me^{jm\omega_0t}$ (a trigonometric polynomial), then $a_k=\frac1T\int_Tx(t)e^{-jk\omega_0t}dt$: the coefficient is the mean of $x$ after it has been spun backwards at $k\omega_0$. The same integral defines $c_k$ for any integrable $x$ (sig-4.1), and for a uniformly convergent series it is the only possible coefficient.`,
      idea: String.raw`The integral of $e^{j n\omega_0t}$ over a whole number of turns is zero unless $n=0$, because the arrow turns an integer number of times and its tip's average position is the origin. Multiply $x=\sum a_m e^{jm\omega_0t}$ by $e^{-jk\omega_0t}$ and integrate term by term: every term but $m=k$ averages to zero. This is the inner-product structure of sig-1.12 (the exponentials form an orthonormal family, pma-8.10) and the mean of the product is the projection of $x$ on the $k$-th exponential.`,
      caption: String.raw`The left panel shows the curve $x(t)e^{-jkt}$ in the complex plane for $-\pi\le t\le\pi$ (bold part: up to the sweep). The green dot is its time-average, which is exactly $c_k$. Pick the lumpy test signal $0.3+\cos3t+\frac12\sin5t$ and move $k$: the curve is centred on the origin for every $k$ except $k=0,\pm3,\pm5$, where the matching harmonic stops spinning and its constant arrow pulls the average away. The middle panel plots the running integral $\frac1{2\pi}\int_{-\pi}^{t}x e^{-jk s}ds$, which ends at $c_k$.`,
      deps: ['sig-4.1', 'pma-8.10', 'sig-1.12'],
      refs: ['Oppenheim–Willsky §3.3'],
      tags: ['orthogonality', 'Fourier series'],
      viz(v) {
        const wsel = v.select('signal', waveMenu(['mix', 'square', 'saw', 'tri', 'skew']), 'mix');
        const ksl = v.slider('harmonic $k$', -9, 9, 3, { step: 1, int: true });
        const swp = v.slider('sweep $t$ (fraction of the period)', 0.02, 1, 1, { step: 0.01 });
        const A = v.stage({ x: [-2.6, 2.6], y: [-2.6, 2.6], equal: true, axes: true, height: 320, title: 'the curve $x(t)\\,e^{-jkt}$ in the plane' });
        const B = v.stage({ x: [-PI, PI], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 320, title: 'running average of the product (Re, Im)' });
        const C = v.stage({ x: [-9.8, 9.8], y: [0, 1], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'size', height: 170, full: true, title: 'coefficient magnitudes' });
        const M = 720;
        let cache = { key: '' };
        const comp = () => {
          const id = wsel.value, k = ksl.value, key = `${id}|${k}`;
          if (cache.key === key) return cache;
          const f = WAVES[id].f, zr = [], zi = [], cr = [], ci = []; let ar = 0, ai = 0;
          for (let j = 0; j < M; j++) {
            const t = -PI + ((j + 0.5) * TAU) / M, y = f(t);
            zr.push(y * Math.cos(k * t)); zi.push(-y * Math.sin(k * t));
            ar += zr[j] / M; ai += zi[j] / M; cr.push(ar); ci.push(ai);
          }
          const cc = coefsOf(id, 12), kk = Math.abs(k), ex = [cc.re[kk], k < 0 ? -cc.im[kk] : cc.im[kk]];
          let ext = 1.2; for (let j = 0; j < M; j++) ext = Math.max(ext, Math.hypot(zr[j], zi[j]));
          cache = { key, id, k, zr, zi, cr, ci, ex, ext, cc };
          return cache;
        };
        let info = null;
        v.render(() => {
          const D = comp(), m = Math.max(2, Math.round(swp.value * M));
          const R = Math.max(1.4, D.ext * 1.15);
          A.setView([-R, R], [-R, R]);
          A.path(zip(D.zr, D.zi), { color: 'faint', width: 1.3 });
          A.path(D.zr.slice(0, m).map((a, j) => [a, D.zi[j]]), { color: 'accent', width: 2.4 });
          A.dot(D.zr[m - 1], D.zi[m - 1], { r: 5, color: 'gold' });
          A.dot(D.cr[M - 1], D.ci[M - 1], { r: 7, color: 'green', label: 'c_k', labelPos: 'ne', tex: true });
          const yr = Math.max(0.5, Math.abs(D.cr[M - 1]) * 1.4, Math.abs(D.ci[M - 1]) * 1.4, ...D.cr.map(Math.abs), ...D.ci.map(Math.abs));
          B.setView(null, [-yr, yr]);
          const T = grid(0, M - 1, M - 1).map((j) => -PI + ((j + 0.5) * TAU) / M);
          B.path(T.slice(0, m).map((t, j) => [t, D.cr[j]]), { color: 'accent', width: 2.2 });
          B.path(T.slice(0, m).map((t, j) => [t, D.ci[j]]), { color: 'orange', width: 2.2 });
          B.hline(D.ex[0], { color: 'accent', dash: true, alpha: 0.6 });
          B.hline(D.ex[1], { color: 'orange', dash: true, alpha: 0.6 });
          const cc = D.cc, vals = Array.from({ length: 19 }, (_, i) => mag(cc, Math.abs(i - 9)));
          C.setView(null, [0, Math.max(0.3, ...vals) * 1.2]);
          C.bars(vals, { x0: -9, color: (val, i) => (i - 9 === D.k ? 'green' : 'accent') });
          info = D;
        });
        v.legend([['accent', 'Re (curve and running mean)'], ['orange', 'Im (running mean)'], ['green', '$c_k$ = average of the curve', { dot: true }]]);
        v.readout(() => {
          const D = info, got = [D.cr[M - 1], D.ci[M - 1]];
          const f = (z) => `${v.fix(z[0], 3)}${z[1] < 0 ? '-' : '+'}${v.fix(Math.abs(z[1]), 3)}j`;
          return `$k=${D.k}$: the average of the spun-back signal is $c_k\\approx ${f(got)}$ (numerical integral), against $${f(D.ex)}$ from the coefficient table; difference $${v.sci(Math.hypot(got[0] - D.ex[0], got[1] - D.ex[1]), 2)}$.` + (Math.hypot(got[0], got[1]) < 1e-3 ? '\nThe curve is balanced about the origin: this harmonic is absent from the signal.' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Theorem',
      name: 'Dirichlet conditions and pointwise convergence',
      statement: String.raw`Let $x$ be $2\pi$-periodic and satisfy the **Dirichlet conditions** on a period: $x$ is absolutely integrable, has finitely many maxima and minima, and finitely many discontinuities, all of the first kind (the one-sided limits exist). Then the partial sums $S_N(t)=\sum_{|k|\le N}c_ke^{jkt}$ converge at every $t$, to
$$\lim_{N\to\infty}S_N(t)=\tfrac12\big(x(t^+)+x(t^-)\big),$$
which is $x(t)$ wherever $x$ is continuous and the midpoint of the jump at a discontinuity. The conditions are sufficient, not necessary.`,
      idea: String.raw`Write $S_N(t)=\frac1{2\pi}\int x(t-u)D_N(u)\,du$ with the Dirichlet kernel $D_N(u)=\sin((N+\tfrac12)u)/\sin(u/2)$ (pma-8.13), which has total integral 1. Splitting the integral at $u=0$ and subtracting the one-sided limits leaves $\frac1{2\pi}\int g(u)\sin((N+\frac12)u)\,du$ with $g(u)=(x(t-u)-x(t^-))/\sin(u/2)$ on one side and similarly on the other. Bounded variation near $t$ makes $g$ integrable, and the Riemann–Lebesgue lemma (rca-5.12) sends the integral to zero. The Lipschitz case is pma-8.14.`,
      caption: String.raw`Drag the gold handle along the time axis. The upper panel shows the signal and the partial sum $S_N$; the lower panel tracks the single number $S_n(t_0)$ as the number of harmonics $n$ grows. Away from jumps it homes in on $x(t_0)$ (green line); put the handle on a jump and it homes in on the midpoint of the jump instead, so the series never produces the value the function itself takes (the table value at a jump is arbitrary). Convergence is slowest near a jump.`,
      deps: ['sig-4.1', 'pma-8.14'],
      refs: ['Oppenheim–Willsky §3.4'],
      tags: ['convergence', 'Fourier series'],
      credit: 'Dirichlet, 1829',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dirichlet%E2%80%93Dini_criterion' },
      viz(v) {
        const wsel = v.select('signal', waveMenu(['square', 'saw', 'pulse', 'tri']), 'square');
        const nsl = v.slider('harmonics $N$ shown', 1, 60, 9, { step: 1, int: true });
        const A = v.stage({ x: [-PI, PI], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 280, full: true, title: 'signal and partial sum $S_N$ — drag the test point $t_0$' });
        const B = v.stage({ x: [0, 80], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 'n (number of harmonics)', height: 220, full: true, title: 'the sequence $S_n(t_0)$' });
        const h = A.handle(1.1, 0, { color: 'gold', r: 7, constrain: { x: [-PI, PI], y: [0, 0] }, label: 't₀', labelPos: 'n' });
        let info = null;
        v.render(() => {
          const id = wsel.value, N = nsl.value, W = WAVES[id], c = coefsOf(id, 80), t0 = h.x;
          const ts = grid(-PI, PI, 700);
          A.fn(W.f, { domain: [-PI, PI], color: 'faint', width: 1.8 });
          A.path(zip(ts, partial(c, N, ts)), { color: 'accent', width: 2 });
          const e = 1e-7, lo = W.f(t0 - e), hi = W.f(t0 + e), L = (lo + hi) / 2, jump = Math.abs(hi - lo) > 1e-6;
          A.vline(t0, { color: 'gold', alpha: 0.5, dash: true });
          if (jump) { A.dot(t0, lo, { r: 4, hollow: true, color: 'red' }); A.dot(t0, hi, { r: 4, hollow: true, color: 'red' }); }
          A.dot(t0, L, { r: 5.5, color: 'green' });
          const seq = seqAt(c, 80, t0);
          B.hline(L, { color: 'green', width: 1.5 });
          if (jump) { B.hline(lo, { color: 'red', dash: true, alpha: 0.6 }); B.hline(hi, { color: 'red', dash: true, alpha: 0.6 }); }
          B.path(Array.from(seq, (y, n) => [n, y]), { color: 'accent', width: 1.6 });
          B.dots(Array.from(seq, (y, n) => [n, y]), { r: 2.6, color: 'accent' });
          B.dot(N, seq[N], { r: 6, color: 'gold' });
          let late = 0; for (let n = 60; n <= 80; n++) late = Math.max(late, Math.abs(seq[n] - L));
          info = { t0, L, lo, hi, jump, sN: seq[N], N, late };
        });
        v.legend([['accent', '$S_N$'], ['green', 'limit $\\tfrac12(x(t^+)+x(t^-))$'], ['red', 'one-sided limits', { dot: true }]]);
        v.readout(() => {
          const I = info;
          return I.jump ? `$t_0=${v.fix(I.t0, 3)}$ is a jump: $x(t_0^-)=${v.fix(I.lo, 2)}$, $x(t_0^+)=${v.fix(I.hi, 2)}$; the series heads for the midpoint $${v.fix(I.L, 3)}$, and $\\max_{60\\le n\\le80}|S_n-L|=${v.fix(I.late, 3)}$.`
            : `$t_0=${v.fix(I.t0, 3)}$ is a point of continuity: $x(t_0)=${v.fix(I.L, 3)}$, $S_{${I.N}}(t_0)=${v.fix(I.sN, 3)}$, and $\\max_{60\\le n\\le80}|S_n-x(t_0)|=${v.fix(I.late, 3)}$.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Phenomenon',
      name: 'Gibbs phenomenon',
      statement: String.raw`Let $x$ be piecewise smooth with a jump of height $J$ at $t_0$. Then the partial sums $S_N$ overshoot the jump: the maximum of $S_N$ near $t_0$ exceeds the upper level by a fraction of the jump that does not shrink with $N$,
$$\lim_{N\to\infty}\Big(\max_{t\text{ near }t_0}S_N(t)-x(t_0^{\text{upper}})\Big)=J\Big(\frac1\pi\operatorname{Si}(\pi)-\frac12\Big)\approx 0.0895\,J,\qquad \operatorname{Si}(\pi)=\int_0^\pi\frac{\sin u}{u}\,du .$$
The overshoot is located about $\pi/N$ from the jump, so its width shrinks like $1/N$ while its height stays about $9\%$ of $J$ (and the dip on the other side is as large). The convergence at every fixed $t\ne t_0$ (sig-4.3) is not uniform near the jump.`,
      idea: String.raw`Near a jump, $S_N$ is the jump function smoothed by the Dirichlet kernel (pma-8.13). For the square wave the smoothing integrates $\sin((N+\frac12)u)/u$ from $0$ to $t$, and the integral $\int_0^x(\sin u)/u\,du$ in the rescaled variable $x=(N+\tfrac12)t$ peaks at $x=\pi$ with value $\operatorname{Si}(\pi)=1.8519\dots$ Rescaling by $N$ moves the peak toward the jump but cannot change its height. A single jump therefore gives the universal constant $0.0895$ for any piecewise-smooth function, with $J$ the jump height.`,
      caption: String.raw`Choose a waveform and raise $N$. The upper panel shows the whole partial sum; the lower-left zoom is centred on the jump with the upper level (gold) and the Gibbs limit (green dashed): the ripple narrows but its highest point keeps landing at the green line. The right panel plots the measured overshoot against $N$ (log axis); it levels off at $0.0895\,J$ and does not go to zero. Compare the three waveforms: the overshoot as a fraction of the jump is the same.`,
      deps: ['sig-4.3', 'pma-8.13'],
      refs: ['Oppenheim–Willsky §3.4'],
      tags: ['Gibbs phenomenon', 'convergence'],
      credit: 'Wilbraham, 1848; Gibbs, 1898–99; named by Bôcher, 1906',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gibbs_phenomenon' },
      viz(v) {
        const G = {
          square: { tj: 0, side: 1, hi: 1, J: 2 },
          saw: { tj: PI, side: -1, hi: 1, J: 2 },
          pulse: { tj: -PI / 4, side: 1, hi: 1, J: 1 },
        };
        const GC = 0.0894898722;
        const wsel = v.select('waveform', waveMenu(['square', 'saw', 'pulse']), 'square');
        const nsl = v.slider('harmonics $N$', 1, 400, 15, { step: 1, int: true, log: true });
        const A = v.stage({ x: [-PI, PI], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 250, full: true, title: 'the partial sum $S_N$' });
        const B = v.stage({ x: [-1, 1], y: [0.6, 1.4], axes: 'box', gutter: true, xlabel: 't − t₀', height: 270, title: 'zoom on the jump' });
        const C = v.stage({ x: [1, 400], y: [0, 0.16], xlog: true, axes: 'box', gutter: true, xlabel: 'N', height: 270, title: 'overshoot as a fraction of the jump' });
        const over = (c, N, g) => {
          const w = (3.2 * PI) / (N + 1), us = grid(0, w, 360), ts = us.map((u) => g.tj + g.side * u);
          const sv = partial(c, N, ts); let m = -Infinity, at = 0;
          sv.forEach((y, i) => { if (y > m) { m = y; at = us[i]; } });
          return { val: m - g.hi, at: g.side * at };
        };
        let curve = null, cid = '', info = null;
        v.render(() => {
          const id = wsel.value, N = nsl.value, W = WAVES[id], g = G[id], c = coefsOf(id, 400);
          const ts = grid(-PI, PI, 900);
          A.fn(W.f, { domain: [-PI, PI], color: 'faint', width: 1.6 });
          A.path(zip(ts, partial(c, N, ts)), { color: 'accent', width: 1.8 });
          A.vline(g.tj, { color: 'gold', dash: true, alpha: 0.4 });
          // zoom window: about eight ripple widths each side, scaled to the jump
          const half = Math.min(PI, (7 * PI) / (N + 1)), pad = g.J * 0.16;
          B.setView([-half, half], [g.hi - g.J - pad * 0.2, g.hi + pad]);
          const zs = grid(g.tj - half, g.tj + half, 700).map((t) => t), zv = partial(c, N, zs);
          B.fn((t) => W.f(g.tj + t), { domain: [-half, half], color: 'faint', width: 1.6 });
          B.path(zs.map((t, i) => [t - g.tj, zv[i]]), { color: 'accent', width: 2 });
          B.hline(g.hi, { color: 'gold', width: 1.4 });
          B.hline(g.hi + GC * g.J, { color: 'green', dash: true, width: 1.4 });
          const o = over(c, N, g);
          B.dot(o.at, g.hi + o.val, { r: 5, color: 'red' });
          if (cid !== id) {
            const Ns = [1, 2, 3, 4, 6, 8, 11, 15, 20, 28, 40, 56, 80, 110, 160, 220, 300, 400];
            curve = Ns.map((n) => [n, over(c, n, g).val / g.J]); cid = id;
          }
          C.hline(GC, { color: 'green', dash: true, width: 1.4 });
          C.path(curve, { color: 'accent', width: 2 }); C.dots(curve, { r: 3, color: 'accent' });
          C.dot(N, o.val / g.J, { r: 6, color: 'red' });
          info = { N, o: o.val, J: g.J, frac: o.val / g.J, at: o.at };
        });
        v.legend([['gold', 'upper level'], ['green', 'Gibbs limit $0.0895\\,J$ above it'], ['red', 'highest point of $S_N$', { dot: true }]]);
        v.readout(() => `$N=${info.N}$: the ripple peaks $${v.fix(info.o, 4)}$ above the upper level, which is $${v.fix(100 * info.frac, 2)}\\%$ of the jump $J=${info.J}$, at distance $${v.fix(Math.abs(info.at), 4)}$ from the jump (about $\\pi/N$). The limit is $\\frac1\\pi\\mathrm{Si}(\\pi)-\\frac12=8.949\\%$.`);
      },
    },
  ],
};
