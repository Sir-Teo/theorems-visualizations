// Signals & Systems — Chapter 4: Fourier series (items 4.9–4.12)
import { TAU, PI, WAVES, coefsOf, waveMenu, mag, partial, zip, grid, wrap, stems, PI_TICKS, PI2_TICKS } from './ch04.shared.js';

export default {
  collection: 'sig',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Theorem',
      name: 'Periodic convolution and products of coefficients',
      statement: String.raw`For $2\pi$-periodic integrable $x$ and $y$ with coefficients $c_k$ and $d_k$, define the periodic (circular) convolution
$$(x\circledast y)(t)=\frac1{2\pi}\int_{-\pi}^{\pi}x(\tau)\,y(t-\tau)\,d\tau .$$
It is again $2\pi$-periodic and continuous, and its Fourier coefficients are the products $c_kd_k$. (With the unnormalised integral over a period $T$, the coefficients are $T\,c_kd_k$.) Conversely, the coefficients of the pointwise product $xy$ are the discrete convolution $\sum_mc_m d_{k-m}$.`,
      idea: String.raw`Insert the definition of the convolution into $\frac1{2\pi}\int(x\circledast y)(t)e^{-jkt}dt$ and exchange the order of integration (Fubini, legitimate since both functions are integrable). Substituting $u=t-\tau$ factors the double integral into $c_k$ times $d_k$ using $e^{-jkt}=e^{-jk\tau}e^{-jku}$. This is the periodic version of the convolution theorem sig-5.6 and the reason LTI systems are diagonal on harmonics (sig-3.2, sig-4.10); in the language of algebra, the coefficient map turns convolution into ordinary multiplication.`,
      caption: String.raw`Drag the gold handle $t$. The top panel slides the flipped copy of $y$ (orange, wrapped around the circle) under $x$ (blue); the green area is the integral, so the height of the middle panel at $t$ is that area divided by $2\pi$. The orange dashes in the middle panel are the series with coefficients $c_kd_k$ (60 terms): they sit on the directly computed convolution. The bars compare $|c_k|$, $|d_k|$ and $|c_kd_k|$: even a pair of discontinuous signals convolve into something much smoother, because the product decays faster.`,
      deps: ['sig-4.2', 'sig-3.2'],
      refs: ['Oppenheim–Willsky §3.5'],
      tags: ['convolution', 'Fourier series'],
      viz(v) {
        const xs = v.select('$x$', waveMenu(['pulse', 'square', 'saw', 'tri', 'skew']), 'pulse');
        const ys = v.select('$y$', waveMenu(['skew', 'tri', 'pulse', 'square', 'saw']), 'tri');
        const A = v.stage({ x: [-PI, PI], y: [-1.7, 1.7], axes: 'box', gutter: true, xlabel: 'τ', xticks: PI_TICKS, height: 260, full: true, title: '$x(\\tau)$, the flipped and slid $y(t-\\tau)$, and their product' });
        const B = v.stage({ x: [-PI, PI], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 230, title: 'output $(x\\circledast y)(t)$' });
        const C = v.stage({ x: [-0.8, 13], y: [0, 0.7], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'size', height: 230, title: 'magnitudes $|c_k|$, $|d_k|$, $|c_kd_k|$' });
        const h = A.handle(0.7, 0, { color: 'gold', r: 7, constrain: { x: [-PI, PI], y: [0, 0] }, label: 't', labelPos: 'n' });
        const M = 600;
        let cache = { key: '' };
        const comp = () => {
          const key = `${xs.value}|${ys.value}`;
          if (cache.key === key) return cache;
          const f = WAVES[xs.value].f, g = WAVES[ys.value].f, fv = [], gv = [];
          for (let j = 0; j < M; j++) { const t = -PI + ((j + 0.5) * TAU) / M; fv.push(f(t)); gv.push(g(t)); }
          const ts = grid(-PI, PI, 240), out = ts.map((t) => { let s = 0; for (let j = 0; j < M; j++) s += fv[j] * g(t - (-PI + ((j + 0.5) * TAU) / M)); return s / M; });
          const cx = coefsOf(xs.value, 60), cy = coefsOf(ys.value, 60);
          const pr = { re: new Float64Array(61), im: new Float64Array(61), K: 60 };
          for (let k = 0; k <= 60; k++) { pr.re[k] = cx.re[k] * cy.re[k] - cx.im[k] * cy.im[k]; pr.im[k] = cx.re[k] * cy.im[k] + cx.im[k] * cy.re[k]; }
          const ser = partial(pr, 60, ts);
          let err = 0; ts.forEach((t, i) => { err = Math.max(err, Math.abs(ser[i] - out[i])); });
          let ext = 1; out.forEach((o) => { ext = Math.max(ext, Math.abs(o) * 1.2); });
          cache = { key, f, g, ts, out, ser, err, cx, cy, pr, ext };
          return cache;
        };
        let info = null;
        v.render(() => {
          const D = comp(), t = h.x;
          A.fn(D.f, { domain: [-PI, PI], color: 'accent', width: 2 });
          A.fn((tau) => D.g(t - tau), { domain: [-PI, PI], color: 'orange', width: 2 });
          const prod = (tau) => D.f(tau) * D.g(t - tau);
          A.fn(prod, { domain: [-PI, PI], color: 'green', fill: true, base: 0, fillAlpha: 0.35, width: 1.5 });
          A.vline(t, { color: 'gold', dash: true, alpha: 0.5 });
          let area = 0; for (let j = 0; j < 1200; j++) area += prod(-PI + ((j + 0.5) * TAU) / 1200) / 1200;
          B.setView(null, [-D.ext, D.ext]);
          B.path(zip(D.ts, D.out), { color: 'accent', width: 2.4 });
          B.path(zip(D.ts, D.ser), { color: 'orange', width: 1.8, dash: true });
          B.dot(t, area, { r: 6, color: 'gold' });
          const K = 12, mx = (c) => Array.from({ length: K + 1 }, (_, k) => mag(c, k));
          const a = mx(D.cx), b = mx(D.cy), p = mx(D.pr);
          C.setView(null, [0, Math.max(0.1, ...a, ...b) * 1.15]);
          C.bars(a, { x0: -0.28, color: 'accent', barWidth: 0.26 }); C.bars(b, { x0: 0, color: 'orange', barWidth: 0.26 }); C.bars(p, { x0: 0.28, color: 'green', barWidth: 0.26 });
          info = { area, t, err: D.err };
        });
        v.legend([['accent', '$x$'], ['orange', 'flipped $y$ / series of $c_kd_k$'], ['green', 'product and $|c_kd_k|$']]);
        v.readout(() => `At $t=${v.fix(info.t, 2)}$ the shaded area divided by $2\\pi$ is $${v.fix(info.area, 4)}$. Over the whole period the series with coefficients $c_kd_k$ differs from the directly integrated convolution by at most $${v.sci(info.err, 2)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.10
    {
      num: '4.10',
      kind: 'Method',
      name: 'LTI response to periodic inputs',
      statement: String.raw`Let $H$ be a stable LTI system with frequency response $H(j\omega)$ (sig-3.10) and let the input be periodic with $x(t)=\sum_kc_ke^{jk\omega_0t}$. Then the output, after the transient has died away, is the periodic signal
$$y(t)=\sum_{k=-\infty}^{\infty}c_k\,H(jk\omega_0)\,e^{jk\omega_0t}.$$
Each harmonic is multiplied by the value of the frequency response at its own frequency, and the output has the same period as the input; a filter can only reweight and rephase harmonics, never create new ones. For a real system and a real input, $y$ is real because $H(-j\omega)=\overline{H(j\omega)}$.`,
      idea: String.raw`Each $e^{jk\omega_0t}$ is an eigenfunction of the system with eigenvalue $H(jk\omega_0)$ (sig-3.9), so by linearity the response to the sum is the sum of the responses; for a finite sum this is just linearity, and for a general periodic input the steady-state output is the periodic convolution of $x$ with the periodised impulse response $\sum_mh(t+mT)$ (sig-3.2), whose coefficients are $c_kH(jk\omega_0)$ by sig-4.9. The same recipe underlies mech-4.12 for a driven oscillator.`,
      caption: String.raw`A resonant band-pass filter $H(j\omega)=1/(1+jQ(\omega/\omega_r-\omega_r/\omega))$ is driven by a periodic input of fundamental frequency 1. The left panel shows the input harmonics (grey), the filter's magnitude (orange) and the output harmonics (blue). The right panel overlays the Fourier-synthesised steady-state output (blue) on a direct time-domain simulation of the filter's differential equation from rest (green dots), run for many periods. Press *tune to the 3rd harmonic* and the output of a square wave becomes nearly a pure sine at three times the frequency; raise $Q$ and it gets purer.`,
      deps: ['sig-4.1', 'sig-3.10', 'mech-4.12'],
      refs: ['Oppenheim–Willsky §3.8'],
      tags: ['filtering', 'frequency response'],
      viz(v) {
        const isel = v.select('input', waveMenu(['square', 'saw', 'tri', 'pulse']), 'square');
        const wr = v.slider('centre frequency $\\omega_r$', 0.3, 12, 3, { step: 0.01 });
        const Q = v.slider('quality factor $Q$', 1, 40, 8, { log: true, sig: 2 });
        v.button('tune to the 3rd harmonic', () => wr.set(3));
        v.button('tune to the fundamental', () => wr.set(1));
        const A = v.stage({ x: [0, 14.5], y: [0, 1.1], axes: 'box', gutter: true, xlabel: 'frequency ω (the input fundamental is 1)', ylabel: 'size', height: 300, title: 'harmonics: input (grey), $|H|$ (orange), output (blue)' });
        const B = v.stage({ x: [0, TAU], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 't', xticks: PI2_TICKS, height: 300, title: 'one period: input, output, and simulation' });
        const Hf = (w, wrv, q) => { if (w === 0) return [0, 0]; const u = q * (w / wrv - wrv / w), d = 1 + u * u; return [1 / d, -u / d]; };
        let info = null;
        v.render(() => {
          const id = isel.value, c = coefsOf(id, 60), w0 = wr.value, q = Q.value, W = WAVES[id];
          const co = { re: new Float64Array(61), im: new Float64Array(61), K: 60 };
          for (let k = 0; k <= 60; k++) { const [h1, h2] = Hf(k, w0, q); co.re[k] = c.re[k] * h1 - c.im[k] * h2; co.im[k] = c.re[k] * h2 + c.im[k] * h1; }
          // harmonic amplitudes 2|c_k| (k>=1)
          const ain = [], aout = [];
          for (let k = 1; k <= 14; k++) { ain.push(2 * mag(c, k)); aout.push(2 * mag(co, k)); }
          const top = Math.max(...ain) * 1.15;
          A.setView(null, [0, top]);
          A.bars(ain, { x0: 1, color: 'faint', barWidth: 0.7, fillAlpha: 0.7 });
          A.bars(aout, { x0: 1, color: 'accent', barWidth: 0.34 });
          A.path(grid(0.05, 14.5, 600).map((w) => { const [a, b] = Hf(w, w0, q); return [w, Math.hypot(a, b) * top * 0.92]; }), { color: 'orange', width: 2 });
          // steady-state output from the series
          const ts = grid(0, TAU, 480), ys = partial(co, 60, ts);
          // direct simulation of q'' + (wr/Q) q' + wr² q = u, y = (wr/Q) q'; exact zero-order hold with fine steps
          const S = 480, dt = TAU / S, a = w0 / q, Ac = [[0, 1], [-w0 * w0, -a]];
          const Ad = v.M.expm(Ac.map((r) => r.map((e) => e * dt))), rhs = [Ad[0][1], Ad[1][1] - 1], Bd = v.M.solve(Ac, rhs);
          const tau = (2 * q) / w0, periods = Math.min(300, Math.ceil((12 * tau) / TAU) + 2);
          let x1 = 0, x2 = 0; const sim = [];
          for (let p = 0; p < periods; p++) for (let n = 0; n < S; n++) {
            if (p === periods - 1) sim.push([n * dt, a * x2]);
            const u = W.f(n * dt + dt / 2), n1 = Ad[0][0] * x1 + Ad[0][1] * x2 + Bd[0] * u, n2 = Ad[1][0] * x1 + Ad[1][1] * x2 + Bd[1] * u; x1 = n1; x2 = n2;
          }
          let err = 0; sim.forEach(([t, y], i) => { err = Math.max(err, Math.abs(y - ys[i])); });
          const m = Math.max(1.2, ...ys.map(Math.abs), ...sim.map((s) => Math.abs(s[1]))) * 1.1;
          B.setView(null, [-m, m]);
          B.fn(W.f, { domain: [0, TAU], color: 'faint', width: 1.4 });
          B.path(zip(ts, ys), { color: 'accent', width: 2.4 });
          B.dots(sim.filter((_, i) => i % 12 === 0), { r: 2.6, color: 'green' });
          const kk = aout.indexOf(Math.max(...aout)) + 1;
          info = { err, periods, kk, frac: aout[kk - 1] / Math.hypot(...aout) };
        });
        v.legend([['accent', 'output = $\\sum c_kH(jk)e^{jkt}$'], ['green', 'simulated from rest', { dot: true }], ['orange', '$|H(j\\omega)|$']]);
        v.readout(() => `Strongest output harmonic: $k=${info.kk}$, carrying $${v.fix(100 * info.frac * info.frac, 1)}\\%$ of the output's harmonic power. The simulation (${info.periods} periods from rest) and the series differ by at most $${v.sci(info.err, 2)}$ — the transient has decayed and the two descriptions agree.`);
      },
    },
    // ------------------------------------------------------------------ 4.11
    {
      num: '4.11',
      kind: 'Definition',
      name: 'Discrete-time Fourier series',
      statement: String.raw`A sequence $x[n]$ with period $N$ is expanded in the $N$ distinct harmonics $e^{j2\pi kn/N}$, $k=0,\dots,N-1$:
$$x[n]=\sum_{k=0}^{N-1}a_k\,e^{j2\pi kn/N},\qquad a_k=\frac1N\sum_{n=0}^{N-1}x[n]\,e^{-j2\pi kn/N}.$$
The coefficients are themselves periodic, $a_{k+N}=a_k$ (sig-1.6: discrete frequencies repeat every $2\pi$), so there are only $N$ of them and the expansion is a finite identity: it holds exactly for every $N$-periodic sequence, with no convergence question. Power is preserved: $\frac1N\sum_n|x[n]|^2=\sum_k|a_k|^2$.`,
      idea: String.raw`The $N$ vectors $e_k[n]=e^{j2\pi kn/N}$ are orthogonal in $\mathbb C^N$ under $\langle u,w\rangle=\frac1N\sum u[n]\overline{w[n]}$, because the sum of $e^{j2\pi mn/N}$ over a period is $N$ for $m\equiv0$ and a vanishing geometric sum otherwise. $N$ orthogonal vectors in an $N$-dimensional space form a basis, so the expansion is exact and the formula for $a_k$ is the orthogonality argument of sig-4.2 with sums for integrals. The continuous-time series needs an infinite sum and a notion of convergence; here it is linear algebra.`,
      caption: String.raw`Drag the stems of $x[n]$ (the middle period is editable; the pattern repeats on both sides) and change the period $N$. The middle panel shows $|a_k|$, which repeats with period $N$ (grey copies). The bottom panel rebuilds $x$ by adding the harmonics with $|k|\le K$: with $K$ small you get a smooth approximation, and the moment $K=\lfloor N/2\rfloor$ includes every harmonic the reconstruction lands exactly on $x$ (rings), whatever you drew.`,
      deps: ['sig-4.1', 'sig-1.6'],
      refs: ['Oppenheim–Willsky §3.6'],
      tags: ['discrete time', 'Fourier series'],
      viz(v) {
        const xs = [0.9, 0.5, -0.3, -0.8, -0.2, 0.6, 0.3, -0.5, 0, 0.7, -0.6, 0.2, 0.4, -0.4, 0.8, -0.1];
        const preset = (name, N) => { for (let n = 0; n < 16; n++) xs[n] = name === 'impulse' ? (n === 0 ? 1 : 0) : name === 'square' ? (n < N / 2 ? 0.8 : -0.8) : name === 'ramp' ? (2 * n) / N - 1 : name === 'cos' ? Math.cos((2 * PI * 2 * n) / N) : xs[n]; };
        const Nsl = v.slider('period $N$', 4, 16, 8, { step: 1, int: true });
        const Ksl = v.slider('harmonics up to $K$', 0, 8, 2, { step: 1, int: true });
        v.select('preset', [{ value: 'mine', label: 'keep mine' }, { value: 'impulse', label: 'impulse' }, { value: 'square', label: 'square' }, { value: 'ramp', label: 'ramp' }, { value: 'cos', label: 'cosine' }], 'mine', { onChange: (val) => { preset(val, Nsl.value); } });
        const A = v.stage({ x: [-17, 33], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'n', height: 210, full: true, title: '$x[n]$ — drag the stems of the middle period $0\\ldots N-1$' });
        const B = v.stage({ x: [-17, 33], y: [0, 1], axes: 'box', gutter: true, xlabel: 'k', height: 210, full: true, title: '$|a_k|$ — periodic in $k$ with period $N$' });
        const C = v.stage({ x: [-17, 33], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'n', height: 210, full: true, title: 'rebuilt from harmonics $|k|\\le K$ (rings: the true $x$)' });
        A.onDrag((px, py) => { const n = Math.round(px); if (n >= 0 && n < Nsl.value) xs[n] = Math.max(-1.4, Math.min(1.4, Math.round(py * 20) / 20)); });
        let info = null;
        v.render(() => {
          const N = Nsl.value, K = Math.min(Ksl.value, Math.floor(N / 2));
          const a = Array.from({ length: N }, (_, k) => { let re = 0, im = 0; for (let n = 0; n < N; n++) { re += xs[n] * Math.cos((TAU * k * n) / N); im -= xs[n] * Math.sin((TAU * k * n) / N); } return [re / N, im / N]; });
          const rec = (n) => { let s = 0; for (let k = -K; k <= K; k++) { const kk = ((k % N) + N) % N, ph = (TAU * k * n) / N; s += a[kk][0] * Math.cos(ph) - a[kk][1] * Math.sin(ph); } return s; };
          const ns = grid(-16, 32, 48);
          for (let p = -2; p <= 2; p++) { const lo = p * N, hi = lo + N; A.vband(lo - 0.5, hi - 0.5, { color: p === 0 ? 'accent' : 'faint', alpha: p === 0 ? 0.08 : 0.0 }); }
          A.hline(0, { color: 'faint', width: 1 }); B.hline(0, { color: 'faint', width: 1 }); C.hline(0, { color: 'faint', width: 1 });
          stems(A, ns.map((n) => [n, xs[((n % N) + N) % N]]), { color: 'accent' });
          const ak = ns.map((k) => [k, Math.hypot(...a[((k % N) + N) % N])]);
          B.setView(null, [0, Math.max(0.2, ...ak.map((q) => q[1])) * 1.2]);
          stems(B, ak.filter(([k]) => k >= 0 && k < N), { color: 'orange' });
          stems(B, ak.filter(([k]) => k < 0 || k >= N), { color: 'faint' });
          const rs = ns.map((n) => [n, rec(n)]);
          stems(C, rs, { color: 'green' });
          for (const n of ns) C.dot(n, xs[((n % N) + N) % N], { r: 6, hollow: true, color: 'ink', width: 1.2 });
          let err = 0; for (let n = 0; n < N; n++) err = Math.max(err, Math.abs(rec(n) - xs[n]));
          let pw = 0, pk = 0; for (let n = 0; n < N; n++) pw += xs[n] ** 2 / N; for (let k = 0; k < N; k++) pk += a[k][0] ** 2 + a[k][1] ** 2;
          info = { N, K, err, pw, pk, full: K >= Math.floor(N / 2) };
        });
        v.readout(() => `$N=${info.N}$, $K=${info.K}$: the largest error of the rebuilt sequence is $${v.sci(info.err, 2)}$` + (info.full ? ' — every harmonic is in, so the reconstruction is exact to rounding.' : '; raise $K$ to $\\lfloor N/2\\rfloor$ and it vanishes.') + `\nPower: $\\frac1N\\sum|x|^2=${v.fix(info.pw, 6)}$, $\\sum|a_k|^2=${v.fix(info.pk, 6)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.12
    {
      num: '4.12',
      kind: 'Proposition',
      name: 'Spectra of square, triangle and sawtooth waves',
      statement: String.raw`With fundamental angular frequency $\omega_0=2\pi f_0$, the three classic waveforms of unit peak have the following Fourier series (real form):
- square wave: $\displaystyle\frac4\pi\sum_{k\text{ odd}}\frac{\sin k\omega_0t}{k}$, only odd harmonics, amplitudes $\propto1/k$;
- sawtooth (rising, $x=\omega_0t/\pi$ on $|\omega_0t|<\pi$): $\displaystyle\frac2\pi\sum_{k\ge1}(-1)^{k+1}\frac{\sin k\omega_0t}{k}$, all harmonics, amplitudes $\propto1/k$;
- triangle: $\displaystyle\frac8{\pi^2}\sum_{k\text{ odd}}\frac{\cos k\omega_0t}{k^2}$, only odd harmonics, amplitudes $\propto1/k^2$.
So the square wave's third harmonic is $1/3$ of its fundamental ($-9.5$ dB), the triangle's is $1/9$ ($-19.1$ dB), and the sawtooth also has a second harmonic at $1/2$. The slower decay for the waveforms with jumps and the faster decay for the one with corners is sig-4.8.`,
      idea: String.raw`All three coefficients come from the orthogonality formula (sig-4.2) by one or two integrations by parts: the square wave is odd with a jump of 2 at each end, giving $c_k=\frac{2}{j\pi k}$ for odd $k$ and $0$ for even $k$ because of half-wave symmetry; the triangle is its integral, so each coefficient picks up another factor $1/(jk)$ (sig-4.7), and the sawtooth is odd with a single jump per period, so even harmonics survive. The $1/k$ and $1/k^2$ rates are the smoothness-decay rule sig-4.8.`,
      caption: String.raw`Choose a waveform and its pitch and press *play*: the ear hears the same relative amplitudes shown in the spectrum (it largely ignores the phases): a square wave is hollow, a sawtooth bright and buzzy, and a triangle is mellow, close to a sine. The spectrum is drawn at the harmonics of the pitch $f_0$; the dashed curve is the envelope $\propto1/k$ or $1/k^2$. Switch to decibels to see the $1/k^2$ fall at 12 dB per octave against 6 dB for the others. The pulse train (a quarter of the period high) has missing harmonics at multiples of 4.`,
      deps: ['sig-4.2', 'sig-4.8'],
      refs: ['Oppenheim–Willsky §3.3', 'Lathi ch. 6'],
      tags: ['spectrum', 'waveforms', 'audio'],
      viz(v) {
        const wsel = v.select('waveform', waveMenu(['square', 'saw', 'tri', 'pulse']), 'square');
        const f0 = v.slider('pitch $f_0$ (Hz)', 110, 880, 220, { log: true, sig: 3 });
        const db = v.toggle('decibels', false);
        const A = v.stage({ x: [0, 3], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'time (periods)', height: 260, title: 'the waveform' });
        const B = v.stage({ x: [0, 21], y: [0, 1.4], axes: 'box', gutter: true, xlabel: 'harmonic number k (frequency k·f₀)', ylabel: 'amplitude', height: 260, title: 'harmonic amplitudes $2|c_k|$' });
        const amps = (id) => { const c = coefsOf(id, 40); return Array.from({ length: 40 }, (_, i) => 2 * mag(c, i + 1)); };
        const ENV = { square: [4 / PI, 1], saw: [2 / PI, 1], tri: [8 / (PI * PI), 2], pulse: [2 / PI, 1] };
        v.soundButton('Play the waveform', (snd) => {
          const a = amps(wsel.value), fr = f0.value, parts = [];
          a.forEach((amp, i) => { const f = fr * (i + 1); if (amp > 1e-4 && f < 12000) parts.push([f, amp]); });
          return snd.tone(parts, { duration: 1.8, gain: 0.22 });
        });
        v.soundButton('Play a pure sine at $f_0$', (snd) => snd.tone(f0.value, { duration: 1.4, gain: 0.22 }));
        let info = null;
        v.render(() => {
          const id = wsel.value, a = amps(id), c = coefsOf(id, 40), [e0, p] = ENV[id];
          A.hline(0, { color: 'faint', width: 1 });
          A.fn((t) => WAVES[id].f(TAU * t), { domain: [0, 3], color: 'faint', width: 1.6 });
          const ts = grid(0, 3, 600); A.path(zip(ts, partial(c, 20, ts.map((t) => TAU * t))), { color: 'accent', width: 1.8 });
          const K = 20, ks = Array.from({ length: K }, (_, i) => i + 1);
          const dB = (x) => Math.max(-70, 20 * Math.log10(Math.max(x, 1e-9) / a[0]));
          if (db.value) {
            B.setView([0, 21], [-70, 5]); B.setLabels(undefined, 'dB re fundamental');
            stems(B, ks.map((k) => [k, dB(a[k - 1])]), { color: 'accent', base: -70 });
            B.path(ks.map((k) => [k, 20 * Math.log10((e0 / k ** p) / a[0])]), { color: 'orange', dash: true, width: 1.6 });
          } else {
            B.setView([0, 21], [0, Math.max(...a.slice(0, K)) * 1.2]); B.setLabels(undefined, 'amplitude');
            stems(B, ks.map((k) => [k, a[k - 1]]), { color: 'accent' });
            B.path(grid(1, 20, 190).map((k) => [k, e0 / k ** p]), { color: 'orange', dash: true, width: 1.6 });
          }
          info = { id, a, db: db.value };
        });
        v.legend([['accent', 'harmonic amplitude'], ['orange', 'envelope $\\propto k^{-n}$']]);
        v.readout(() => {
          const a = info.a, r = (k) => (a[k - 1] / a[0]);
          const dd = (x) => (x > 1e-9 ? `${v.fix(20 * Math.log10(x), 1)} dB` : 'absent');
          return `Relative to the fundamental: 2nd harmonic $${v.fix(r(2), 3)}$ (${dd(r(2))}), 3rd $${v.fix(r(3), 3)}$ (${dd(r(3))}), 4th $${v.fix(r(4), 3)}$ (${dd(r(4))}), 5th $${v.fix(r(5), 3)}$ (${dd(r(5))}). Fundamental amplitude $${v.fix(a[0], 3)}$.`;
        });
      },
    },
  ],
};
