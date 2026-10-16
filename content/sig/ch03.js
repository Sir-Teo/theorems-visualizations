// Signals & Systems — Chapter 3: LTI systems and convolution
import {
  CYCLE, KER, sg, convSg, addSg, sgAt, sgPts, sgDiff, sgMax, midpoint, kerResp, kerSg, drawKer, conv, arrDiff,
  DT, iOf, tOf, sample, firstOrder, SYS, bump, stems, drawable, bdBlock, bdSum, bdWire, num, errTex,
} from './ch03.shared.js';

const SMOOTH = ['rc', 'box', 'tri', 'res'];
const kerMenu = (ids) => ids.map((id) => ({ value: id, label: KER[id].label }));
const unitStep = (t) => (t >= 0 ? 1 : 0);

export default {
  collection: 'sig',
  chapter: 3,
  title: 'LTI systems and convolution',
  summary: String.raw`Linearity and time invariance together are very strong: write the input as a superposition of shifted impulses, and the output must be the same superposition of shifted impulse responses. That sum, or in continuous time that integral, is convolution, and it means a single function, the impulse response, determines the system completely. Convolution is commutative, associative and distributive, so cascades multiply in the transform domain and parallels add. Causality, memory and stability become simple conditions on the impulse response; the step response is its running integral. Complex exponentials pass through every LTI system unchanged except for a complex gain, which is the seed of Fourier analysis and gives the frequency response. Linear constant-coefficient differential equations, FIR and IIR filters, deconvolution, correlation and room reverberation are the chapter's main worked examples.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Theorem',
      name: 'The convolution sum',
      statement: String.raw`Let $S$ be a discrete-time system that is linear and time-invariant, and let $h[n]=S\{\delta\}[n]$ be its response to the unit impulse $\delta[n]$ (sig-1.7). Then for every input $x$ for which the sums below converge,
$$y[n]=S\{x\}[n]=\sum_{k=-\infty}^{\infty}x[k]\,h[n-k]=(x*h)[n].$$
Thus the output is the sum of copies of $h$, the copy launched at time $k$ being shifted by $k$ and scaled by $x[k]$. Linearity and time invariance are both needed: a system that is only linear, or only time-invariant, is not determined by $h$.`,
      idea: String.raw`Every signal is a superposition of shifted impulses, $x[n]=\sum_k x[k]\,\delta[n-k]$ (sig-1.7). Time invariance (sig-2.3) turns the response to $\delta[n-k]$ into $h[n-k]$, and linearity (sig-2.2) lets $S$ pass through the sum and the scalars $x[k]$. For an infinite sum one also needs $S$ to commute with the limit; for finitely supported $x$ (as here) no such assumption is needed. The picture shows the argument in action: each input sample spawns one copy, and the output is the stack of copies.`,
      caption: String.raw`Drag the stems of the input $x[n]$ to reshape it and choose a system. The middle panel adds the copies $x[k]\,h[n-k]$ one at a time (button or slider); the bottom panel is their running sum, which grows into the true output $y$ of the system itself (hollow rings, computed by running the system on $x$). For the first four systems the sum lands on the rings. Choose the squarer or the time-varying system, which are not both linear and time-invariant, and the sum misses them (red).`,
      deps: ['sig-2.2', 'sig-2.3', 'sig-1.7'],
      refs: ['Oppenheim–Willsky §2.1'],
      tags: ['convolution', 'LTI'],
      viz(v) {
        const NN = 48, OFF = 8, K0 = 8; // sample index i ↔ n = i − OFF; inputs live on n = 0 … 7
        const S3 = {
          echo: { label: 'echo', tex: 'y[n]=x[n]+0.6\\,x[n-3]', run: (x) => x.map((_, i) => x[i] + 0.6 * (x[i - 3] ?? 0)) },
          avg: { label: '3-pt average', tex: 'y[n]=\\tfrac13(x[n]+x[n-1]+x[n-2])', run: (x) => x.map((_, i) => (x[i] + (x[i - 1] ?? 0) + (x[i - 2] ?? 0)) / 3) },
          leaky: { label: 'leaky accumulator', tex: 'y[n]=0.7\\,y[n-1]+x[n]', run: (x) => { const y = new Array(NN).fill(0); for (let i = 0; i < NN; i++) y[i] = 0.7 * (y[i - 1] ?? 0) + x[i]; return y; } },
          diff: { label: 'first difference', tex: 'y[n]=x[n]-x[n-1]', run: (x) => x.map((_, i) => x[i] - (x[i - 1] ?? 0)) },
          sq: { label: 'squarer', tex: 'y[n]=x[n]^2', run: (x) => x.map((a) => a * a) },
          tv: { label: 'time-varying', tex: 'y[n]=x[n]+0.1\\,n\\,x[n-1]', run: (x) => x.map((_, i) => x[i] + 0.1 * (i - OFF) * (x[i - 1] ?? 0)) },
        };
        const sel = v.select('system', Object.entries(S3).map(([value, o]) => ({ value, label: o.label })), 'echo');
        const X = new Array(NN).fill(0); [1, 0.6, -0.4, 0.8, 0.3, -0.7, 0.5, 0.2].forEach((a, k) => { X[OFF + k] = a; });
        const kk = v.slider('impulses added', 0, K0, 3, { step: 1, int: true });
        v.button('Add the next copy', () => kk.set(Math.min(K0, kk.value + 1)));
        const W = { x: [-1.6, 14.6], height: 150, axes: 'box', gutter: true, full: true };
        const s1 = v.stage({ ...W, y: [-1.6, 1.6], xlabel: 'n', title: 'input $x[n]$ (drag the stems); gold = the copy being added' });
        const s2 = v.stage({ ...W, y: [-1.6, 1.6], xlabel: 'n', title: 'copies $x[k]\\,h[n-k]$ of the impulse response' });
        const s3 = v.stage({ ...W, y: [-2.5, 2.5], xlabel: 'n', title: 'running sum of the copies  vs  the real output (rings)' });
        s1.onDrag((px, py, ph) => { const n = Math.round(px); if (n >= 0 && n < K0) X[OFF + n] = Math.max(-1.5, Math.min(1.5, Math.round(py * 20) / 20)); });
        let info = null;
        v.render(() => {
          const sys = S3[sel.value], delta = new Array(NN).fill(0); delta[OFF] = 1;
          const h = sys.run(delta), y = sys.run(X), K = kk.value;
          const hh = (m) => { const i = m + OFF; return i >= 0 && i < NN ? h[i] : 0; };
          const sum = new Array(NN).fill(0), P = [];
          for (let k = 0; k < K0; k++) { for (let n = -1; n <= 14; n++) { const c = X[OFF + k] * hh(n - k); if (k < K) sum[n + OFF] += c; } }
          // panel 1
          s1.hline(0, { color: 'faint', width: 1 });
          stems(s1, Array.from({ length: K0 }, (_, k) => [k, X[OFF + k]]), { color: 'accent' });
          if (K >= 1) stems(s1, [[K - 1, X[OFF + K - 1]]], { color: 'gold', r: 5.2, width: 2.6 });
          // panel 2
          s2.hline(0, { color: 'faint', width: 1 });
          for (let k = 0; k < K; k++) { const Pk = []; for (let n = -1; n <= 14; n++) { const c = X[OFF + k] * hh(n - k); if (c !== 0) Pk.push([n + (k - 3.5) * 0.06, c]); } stems(s2, Pk, { color: k === K - 1 ? 'gold' : CYCLE[k % 8], alpha: k === K - 1 ? 1 : 0.65, r: 2.8, width: 1.8 }); }
          if (!K) s2.text('no copies yet: press “Add the next copy”', 6.5, 0.8, { color: 'muted', size: 12.5, align: 'center' });
          // panel 3
          let m = 1.6; for (let n = -1; n <= 14; n++) m = Math.max(m, Math.abs(y[n + OFF]) * 1.15, Math.abs(sum[n + OFF]) * 1.15);
          s3.setView(null, [-m, m]); s3.hline(0, { color: 'faint', width: 1 });
          const Ps = []; for (let n = -1; n <= 14; n++) Ps.push([n, sum[n + OFF]]);
          let full = 0; for (let n = -1; n <= 14; n++) { let c = 0; for (let k = 0; k < K0; k++) c += X[OFF + k] * hh(n - k); full = Math.max(full, Math.abs(c - y[n + OFF])); if (K === K0 && Math.abs(c - y[n + OFF]) > 1e-9) s3.line(n, c, n, y[n + OFF], { color: 'red', width: 2 }); }
          stems(s3, Ps, { color: 'accent' });
          for (let n = -1; n <= 14; n++) s3.dot(n, y[n + OFF], { r: 6.5, hollow: true, color: 'ink', width: 1.5 });
          info = { sys, err: full, K };
        });
        v.legend([['accent', 'sum of the first copies'], ['gold', 'the newest copy'], ['ink', 'true output of the system', { dot: true }]]);
        v.readout(() => {
          const { sys, err, K } = info;
          return `$${sys.tex}$ — its impulse response $h$ is the system's reaction to $\\delta$; the output predicted by $\\sum_k x[k]h[n-k]$ differs from the real output by at most $${errTex(err)}$ (all ${K0} copies)\n` + (err < 1e-9 ? 'Linear and time-invariant: the convolution sum reproduces the system exactly.' : 'Not linear and time-invariant: knowing $h$ is not enough, and the sum misses the true output.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Theorem',
      name: 'The convolution integral',
      statement: String.raw`Let $S$ be a continuous-time linear time-invariant system whose response to the unit impulse (sig-1.8) is $h(t)$. Then for inputs for which the integral converges,
$$y(t)=\int_{-\infty}^{\infty}x(\tau)\,h(t-\tau)\,d\tau=(x*h)(t).$$
The output at time $t$ is the area under the product of $x(\tau)$ and the kernel $h$ flipped about $\tau=0$ and slid to $t$. If the kernel were not flipped the integral would be a correlation instead (sig-3.14), and the two agree only for symmetric $h$.`,
      idea: String.raw`Approximate $x$ by narrow rectangles of width $\Delta$; each is a scaled, shifted near-impulse $x(k\Delta)\,\Delta\,\delta_\Delta(t-k\Delta)$ (sig-1.8), so by linearity and time invariance the output is $\sum_k x(k\Delta)\,h(t-k\Delta)\,\Delta$, the discrete convolution sum of sig-3.1 with weights $\Delta$. As $\Delta\to 0$ this is a Riemann sum for the integral; the sifting property (sig-1.9) is the limit statement $x(t)=\int x(\tau)\delta(t-\tau)d\tau$. A rigorous version for operators that commute with translations is fa-6.33.`,
      caption: String.raw`Drag the gold handle along the $\tau$ axis to move $t$. Orange is the kernel flipped and slid to $t$, blue the input, and the green area is $\int x(\tau)h(t-\tau)\,d\tau$. The lower panel traces $y(t)$ as that area changes. Switch *flip the kernel* off to see the correlation $\int x(\tau)h(\tau-t)\,d\tau$ instead, which differs for an asymmetric kernel.`,
      deps: ['sig-3.1', 'sig-1.9', 'fa-6.33'],
      refs: ['Oppenheim–Willsky §2.2', 'Lathi ch. 2'],
      tags: ['convolution', 'LTI'],
      viz(v) {
        const XS = {
          pulse: { label: 'pulse', f: (t) => (t >= 0 && t < 1.5 ? 1 : 0) },
          ramp: { label: 'sawtooth', f: (t) => (t >= 0 && t < 2 ? t / 2 : 0) },
          wig: { label: 'two bumps', f: (t) => 0.9 * bump(t, 0.9, 0.9) - 0.6 * bump(t, 3.2, 1) },
        };
        const xs = v.select('input', Object.entries(XS).map(([value, o]) => ({ value, label: o.label })), 'pulse');
        const ks = v.select('kernel', kerMenu(SMOOTH), 'rc');
        const flip = v.toggle('flip the kernel', true);
        const A = v.stage({ x: [-3, 9], y: [-1.5, 1.6], axes: 'box', gutter: true, xlabel: 'τ', full: true, height: 230, title: 'integrand: input $x(\\tau)$, kernel $h(t-\\tau)$, product' });
        const B = v.stage({ x: [-3, 9], y: [-0.6, 1.6], axes: 'box', gutter: true, xlabel: 't', full: true, height: 170, title: 'output $y(t)$' });
        const hd = A.handle(1.4, 0, { color: 'gold', r: 7, constrain: { x: [-2, 8], y: [0, 0] }, label: 't', labelPos: 'n' });
        let cache = { key: '' };
        const curve = () => {
          const key = `${xs.value}|${ks.value}|${flip.value}`;
          if (cache.key === key) return cache;
          const x = XS[xs.value].f, K = KER[ks.value], f = K.f, P = [];
          for (let i = 0; i <= 240; i++) { const t = -3 + i * 0.05; P.push([t, midpoint(flip.value ? (tau) => f(tau) * x(t - tau) : (tau) => f(tau) * x(t + tau), 0, K.T, 700)]); }
          return (cache = { key, P });
        };
        let info = null;
        v.render(() => {
          const x = XS[xs.value].f, K = KER[ks.value], f = K.f, t = hd.x, { P } = curve();
          const hf = flip.value ? (tau) => f(t - tau) : (tau) => f(tau - t);
          A.hline(0, { color: 'faint', width: 1 });
          A.fn((tau) => x(tau) * hf(tau), { fill: true, base: 0, color: 'green', fillAlpha: 0.35, n: 900, width: 1.5 });
          A.fn(x, { color: 'accent', width: 2.4, n: 900 });
          A.fn(hf, { color: 'orange', width: 2.2, n: 900 });
          A.vline(t, { color: 'gold', width: 1, dash: [4, 4] });
          const area = midpoint((tau) => x(tau) * hf(tau), -3, 9, 1200);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(P, { color: 'purple', width: 1.4, alpha: 0.35 });
          B.path(P.filter((p) => p[0] <= t + 1e-9), { color: 'purple', width: 2.6 });
          B.dot(t, area, { r: 6, color: 'gold', ring: true });
          B.vline(t, { color: 'gold', width: 1, dash: [4, 4] });
          const other = midpoint(flip.value ? (tau) => f(tau) * x(t - tau) : (tau) => f(tau) * x(t + tau), 0, K.T, 700);
          let closed = null;
          if (xs.value === 'pulse' && ks.value === 'rc' && flip.value) closed = t < 0 ? 0 : t <= 1.5 ? 1 - Math.exp(-t) : Math.exp(-t) * (Math.exp(1.5) - 1);
          const bo = flip.value ? -1 : 1;
          info = { area, closed, t, other: bo };
        });
        v.legend([['accent', 'input $x(\\tau)$'], ['orange', 'kernel at $t$'], ['green', 'product (area = $y(t)$)', { area: true }], ['purple', 'output $y$']]);
        v.readout(() => `$t=${v.fix(info.t, 2)}$: area of the product $=${v.fix(info.area, 4)}$` + (info.closed != null ? `; closed form for a unit pulse of length $1.5$ through $e^{-t}u(t)$: $${v.fix(info.closed, 4)}$.` : '.') + (flip.value ? '' : '\nUnflipped (correlation): this is not the system output unless $h$ is symmetric.'));
      },
    },
    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Definition',
      name: 'Impulse response',
      statement: String.raw`The **impulse response** of a continuous-time system is its output $h(t)=S\{\delta\}(t)$ to the unit impulse (for a causal system started at rest, this is the response to an input applied at $t=0$). In practice an impulse is approximated by a pulse $p_w(t)=\frac1w\mathbf 1_{[0,w)}(t)$ of unit area and width $w$: for an LTI system with a reasonable $h$, the response to $p_w$ converges to $h$ as $w\to0$. Once $h$ is known, the output for any input is $y=x*h$ (sig-3.2).`,
      idea: String.raw`The unit impulse is not a function, so $h$ is defined by a limit (sig-1.8): feed a pulse of unit area and shrinking width and look at the output. Because a pulse of width $w$ is $\frac1w(u(t)-u(t-w))$ (sig-1.7), an LTI system answers with $\frac1w(s(t)-s(t-w))$, a difference quotient of its step response $s$, which tends to $s'(t)=h(t)$ (sig-3.7). The figure uses three systems defined by differential equations and integrates them numerically.`,
      caption: String.raw`Top: shrink the width $w$ of a unit-area pulse (orange) and watch the response approach the exact $h(t)$ (dashed); the readout gives the largest gap. Bottom: draw any input; the system is integrated numerically (RK4), and compared with the convolution of that input with the exact $h$.`,
      deps: ['sig-3.2'],
      refs: ['Oppenheim–Willsky §2.2'],
      tags: ['impulse response', 'LTI'],
      viz(v) {
        const SY = {
          rc: { label: 'RC lowpass', tex: "y'+y=x", dim: 1, F: (s, x) => [-s[0] + x], out: (s) => s[0], h: (t) => (t >= 0 ? Math.exp(-t) : 0), htex: 'h=e^{-t}u(t)' },
          res: { label: 'resonator', tex: "y''+y'+9.25\\,y=3x", dim: 2, F: (s, x) => [s[1], -s[1] - 9.25 * s[0] + 3 * x], out: (s) => s[0], h: (t) => (t >= 0 ? Math.exp(-0.5 * t) * Math.sin(3 * t) : 0), htex: 'h=e^{-t/2}\\sin 3t\\,u(t)' },
          crit: { label: 'critically damped', tex: "y''+2y'+y=x", dim: 2, F: (s, x) => [s[1], -2 * s[1] - s[0] + x], out: (s) => s[0], h: (t) => (t >= 0 ? t * Math.exp(-t) : 0), htex: 'h=t\\,e^{-t}u(t)' },
        };
        const sel = v.select('system', Object.entries(SY).map(([value, o]) => ({ value, label: o.label })), 'res');
        const w = v.slider('pulse width $w$', 0.02, 2, 0.6, { log: true, sig: 2 });
        const simulate = (sy, xf, T, dt) => {
          const n = Math.round(T / dt), out = new Float64Array(n + 1); let s = new Array(sy.dim).fill(0);
          const add = (a, b, c) => a.map((q, i) => q + c * b[i]);
          for (let i = 0; i <= n; i++) {
            out[i] = sy.out(s); const t = i * dt;
            const k1 = sy.F(s, xf(t)), k2 = sy.F(add(s, k1, dt / 2), xf(t + dt / 2)), k3 = sy.F(add(s, k2, dt / 2), xf(t + dt / 2)), k4 = sy.F(add(s, k3, dt), xf(t + dt));
            s = s.map((q, j) => q + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
          }
          return out;
        };
        const A = v.stage({ x: [-0.4, 8], y: [-0.2, 0.7], axes: 'box', gutter: true, xlabel: 't', full: true, height: 210, title: 'response to a pulse of unit area vs the impulse response $h$' });
        const B = v.stage({ x: [-0.4, 8], y: [-0.2, 0.7], axes: 'box', gutter: true, xlabel: 't', full: true, height: 210, title: 'any input (drag to draw) → numerical output vs $x*h$' });
        const sig = drawable(B, 0, 8, 64, (t) => (t >= 0.5 && t < 2.2 ? 0.6 : 0) + (t >= 4 && t < 4.6 ? -0.4 : 0) + (t >= 5.5 && t < 7 ? 0.5 * Math.sin((Math.PI * (t - 5.5)) / 1.5) : 0), [-0.65, 0.65], { edge: 8 });
        let info = null;
        v.render(() => {
          const sy = SY[sel.value], ww = w.value, dt = Math.min(0.004, ww / 8), T = 8;
          const yp = simulate(sy, (t) => (t >= 0 && t < ww ? 1 / ww : 0), T, dt);
          let gap = 0, top = 0.25; for (let i = 0; i < yp.length; i++) { const t = i * dt; gap = Math.max(gap, Math.abs(yp[i] - sy.h(t))); top = Math.max(top, sy.h(t) * 1.4); }
          const ymax = Math.max(0.5, top);
          let hmin = 0; for (let i = 0; i < 400; i++) hmin = Math.min(hmin, sy.h(i * 0.02)); for (let i = 0; i < yp.length; i++) hmin = Math.min(hmin, yp[i]);
          A.setView(null, [Math.min(-0.12 * ymax, hmin * 1.2), ymax]);
          A.hline(0, { color: 'faint', width: 1 });
          A.rect(0, 0, ww, ymax * 0.92, { fill: 'orange', fillAlpha: 0.3, color: 'orange', width: 1.4 });
          A.text(`pulse: width ${v.fix(ww, 2)}, height 1/w (clipped), area 1`, 0.6, ymax * 0.93, { color: 'orange', size: 11.5, baseline: 'top' });
          A.fn(sy.h, { color: 'ink', width: 1.6, dash: [5, 4], n: 500 });
          const P = []; for (let i = 0; i < yp.length; i += 2) P.push([i * dt, yp[i]]);
          A.path(P, { color: 'accent', width: 2.4 });
          // lower panel
          const dt2 = 0.01, xf = sig.f, ys = simulate(sy, xf, T, dt2), Q = [], R = [];
          let err2 = 0, lo = 0.7, hi = 0.7;
          for (let i = 0; i <= 800; i += 2) { const t = i * dt2, yc = midpoint((tau) => sy.h(tau) * xf(t - tau), 0, Math.min(t, 14), 300); Q.push([t, ys[i]]); R.push([t, yc]); err2 = Math.max(err2, Math.abs(ys[i] - yc)); lo = Math.min(lo, ys[i] * 1.2); hi = Math.max(hi, ys[i] * 1.2); }
          B.setView(null, [Math.min(-0.2, lo), Math.max(0.7, hi)]);
          B.hline(0, { color: 'faint', width: 1 });
          B.path(Q, { color: 'accent', width: 2.6 });
          B.path(R, { color: 'ink', width: 1.6, dash: [5, 4] });
          B.fn(xf, { color: 'orange', width: 1.8, n: 300 });
          info = { gap, err2, sy };
        });
        v.legend([['accent', 'numerical output'], ['ink', 'exact $h$ (top) / $x*h$ (bottom)', { dash: true }], ['orange', 'input']]);
        v.readout(() => `$${info.sy.tex}$, $${info.sy.htex}$.\nTop: $\\max_t|y_w(t)-h(t)|=${errTex(info.gap)}$ for $w=${v.fix(w.value, 2)}$. Bottom: $\\max_t|y(t)-(x*h)(t)|=${errTex(info.err2)}$ (RK4 and midpoint-rule error only).`);
      },
    },
    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Proposition',
      name: 'Convolution is commutative, associative and distributive',
      statement: String.raw`For signals for which the integrals converge (for instance $L^1$ functions, rca-8.14),
$$x*h=h*x,\qquad (x*h_1)*h_2=x*(h_1*h_2),\qquad x*(h_1+h_2)=x*h_1+x*h_2.$$
In system terms, the order of a cascade of LTI systems does not matter, regrouping a cascade does not change it, and two systems in parallel have the impulse response $h_1+h_2$. The first statement fails once a block is not time-invariant.`,
      idea: String.raw`Commutativity is the change of variables $\tau\mapsto t-\tau$ in the defining integral (sig-3.2). Associativity is Fubini's theorem on the double integral $\iint x(a)h_1(b)h_2(t-a-b)\,da\,db$, which is symmetric in the three roles; distributivity is linearity of the integral. Every route in the picture is computed from its own arrays of samples, so the agreement is a check, not a tautology. A time-varying gain between filters, on the other hand, does not commute with them: shifting then amplifying is not amplifying then shifting.`,
      caption: String.raw`Pick a property and two kernels. The same input is carried through the two routes drawn at the top and the curves are overlaid: the difference is at rounding level. For *order of a cascade*, switch on the time-varying gain $g(t)=0.6+0.3t$ in place of $h_2$ and the two orders no longer agree.`,
      deps: ['sig-3.2', 'rca-8.14'],
      refs: ['Oppenheim–Willsky §2.3'],
      tags: ['convolution', 'algebra'],
      viz(v) {
        const XS = {
          pulse: { label: 'pulse', f: (t) => (t >= 0 && t < 1.5 ? 1 : 0) },
          wig: { label: 'two bumps', f: (t) => 0.9 * bump(t, 0.9, 0.9) - 0.6 * bump(t, 2.6, 0.8) },
          saw: { label: 'sawtooth', f: (t) => (t >= 0 && t < 2 ? t / 2 : 0) },
        };
        const prop = v.select('property', [{ value: 'order', label: 'order of a cascade' }, { value: 'group', label: 'grouping' }, { value: 'split', label: 'distributivity' }], 'order');
        const xs = v.select('input', Object.entries(XS).map(([value, o]) => ({ value, label: o.label })), 'wig');
        const k1 = v.select('$h_1$', kerMenu(SMOOTH), 'rc');
        const k2 = v.select('$h_2$', kerMenu(SMOOTH), 'box');
        const tvar = v.toggle('time-varying gain instead of $h_2$ (order only)', false);
        const D = 0.02, T0 = 0;
        const Z = v.stage({ x: [0, 20], y: [0, 4], axes: false, height: 120, full: true });
        const P = v.stage({ x: [-0.5, 11], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't', full: true, height: 230, title: 'the two routes' });
        const Q = v.stage({ x: [-0.5, 11], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't', full: true, height: 120, title: 'difference of the two routes' });
        const g = (t) => 0.6 + 0.3 * t;
        const route = (s, y, blocks, col) => {
          let x = 1.2; s.text('x', 0.4, y, { math: true, size: 15, color: 'muted', align: 'center' });
          for (const [lab, bc] of blocks) { bdWire(s, [[x - 0.45, y], [x + 0.45, y]], { color: 'muted' }); bdBlock(s, x + 2.55, y, 4.3, 1.1, lab, { color: bc || col, size: 14 }); x += 5.9; }
          bdWire(s, [[x - 0.45, y], [x + 0.6, y]], { color: 'muted' }); s.text('y', x + 1.1, y, { math: true, size: 15, color: col, align: 'center' });
        };
        let info = null;
        v.render(() => {
          const x = sg(XS[xs.value].f, -0.5, 4.5, D), Ka = KER[k1.value], Kb = KER[k2.value];
          const h1 = kerSg(Ka, D), h2 = kerSg(Kb, D);
          const tv = prop.value === 'order' && tvar.value;
          const gain = (S) => ({ ...S, a: Float64Array.from(S.a, (q, i) => q * g(S.t0 + i * S.D)) });
          let A, B, labA, labB;
          if (prop.value === 'order') {
            if (tv) { A = gain(convSg(x, h1)); B = convSg(gain(x), h1); labA = [['h_1'], ['g(t)\\cdot']]; labB = [['g(t)\\cdot'], ['h_1']]; }
            else { A = convSg(convSg(x, h1), h2); B = convSg(convSg(x, h2), h1); labA = [['h_1'], ['h_2']]; labB = [['h_2'], ['h_1']]; }
          } else if (prop.value === 'group') { A = convSg(convSg(x, h1), h2); B = convSg(x, convSg(h1, h2)); labA = [['h_1'], ['h_2']]; labB = [['h_1 * h_2']]; }
          else { A = convSg(x, addSg(h1, h2)); B = addSg(convSg(x, h1), convSg(x, h2)); labA = [['h_1 + h_2']]; labB = [['h_1'], ['h_2']]; }
          if (prop.value === 'split') {
            route(Z, 3.0, labA, 'accent');
            Z.text('parallel routes: one block with $h_1+h_2$, or two blocks whose outputs are added', 10, 1.6, { size: 12, color: 'muted', align: 'center' });
            route(Z, 0.7, [['h_1 \\ \\text{and} \\ h_2 \\text{ in parallel, summed}', 'orange']], 'orange');
          } else { route(Z, 3.0, labA, 'accent'); route(Z, 0.9, labB, 'orange'); }
          const D2 = []; let m = 0.5, dm = 0;
          for (let t = -0.5; t <= 11; t += 0.05) { const a = sgAt(A, t), b = sgAt(B, t); m = Math.max(m, Math.abs(a), Math.abs(b)); dm = Math.max(dm, Math.abs(a - b)); D2.push([t, a - b]); }
          P.setView(null, [-1.15 * m, 1.15 * m]); P.hline(0, { color: 'faint', width: 1 });
          P.path(sgPts(A, -0.5, 11), { color: 'accent', width: 3 });
          P.path(sgPts(B, -0.5, 11), { color: 'orange', width: 1.6, dash: [6, 4] });
          const dmax = Math.max(dm * 1.3, 0.05 * m); Q.setView(null, [-dmax, dmax]); Q.hline(0, { color: 'faint', width: 1 });
          Q.path(D2, { color: 'red', width: 2 });
          info = { dm, tv };
        });
        v.legend([['accent', 'route 1'], ['orange', 'route 2', { dash: true }], ['red', 'route 1 − route 2']]);
        v.readout(() => (info.dm < 1e-9 ? `The two routes agree: $\\max|{\\rm route\\ 1}-{\\rm route\\ 2}|=${errTex(info.dm)}$ (rounding).` : `The routes disagree: $\\max|{\\rm route\\ 1}-{\\rm route\\ 2}|=${v.fix(info.dm, 3)}$ — ${info.tv ? 'the gain $g(t)$ is not time-invariant, so it does not commute with the filter.' : 'unexpected.'}`));
      },
    },
    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Proposition',
      name: 'Causality and memory from the impulse response',
      statement: String.raw`An LTI system with impulse response $h$ is **causal** if and only if $h[n]=0$ for all $n<0$ (in continuous time, $h(t)=0$ for $t<0$), and then $y[n]=\sum_{k\ge0}h[k]\,x[n-k]$ uses only present and past inputs. It is **memoryless** if and only if $h[n]=c\,\delta[n]$ for a constant $c$, so that $y[n]=c\,x[n]$.`,
      idea: String.raw`Causality (sig-2.4) says that the output cannot react before the input does. Feed the impulse: $y=h$ must be $0$ before the impulse arrives, so $h[n]=0$ for $n<0$. Conversely, in $y[n]=\sum_k h[k]x[n-k]$ the terms with $k<0$ involve the future inputs $x[n-k]$, $n-k>n$, and drop out exactly when $h[k]=0$ there. Memorylessness is the same argument applied to the present: the output at $n$ may depend on $x[n]$ only if no other $h[k]$ survives.`,
      caption: String.raw`Choose a kernel or drag the stems of $h[n]$ yourself, and feed the system the impulse, a short pulse or a step (all switching on at $n=0$). Any nonzero tap left of zero makes the red part of the output appear before the input starts. The readout classifies $h$ and measures where the output first moves.`,
      deps: ['sig-3.3', 'sig-2.4'],
      refs: ['Oppenheim–Willsky §2.3'],
      tags: ['causality', 'impulse response'],
      viz(v) {
        const NR = 5; // taps h[−5 … 5]
        const PRE = {
          delay: { label: 'delay by 2', h: { 2: 1 } },
          advance: { label: 'advance by 2', h: { '-2': 1 } },
          trail: { label: 'trailing average', h: { 0: 1 / 3, 1: 1 / 3, 2: 1 / 3 } },
          centred: { label: 'centred average', h: { '-1': 1 / 3, 0: 1 / 3, 1: 1 / 3 } },
          echo: { label: 'echo', h: { 0: 1, 3: 0.6 } },
          gain: { label: 'gain', h: { 0: 1.2 } },
          mine: { label: 'yours', h: {} },
        };
        const H = new Array(2 * NR + 1).fill(0), setH = (o) => { H.fill(0); for (const [n, a] of Object.entries(o)) H[+n + NR] = a; };
        setH(PRE.centred.h);
        const sel = v.select('system', Object.entries(PRE).map(([value, o]) => ({ value, label: o.label })), 'centred', { onChange: (k) => { if (k !== 'mine') setH(PRE[k].h); } });
        const inp = v.select('input', [{ value: 'imp', label: 'impulse' }, { value: 'pulse', label: 'pulse' }, { value: 'step', label: 'step' }], 'pulse');
        const W = { x: [-7.6, 15.6], height: 150, axes: 'box', gutter: true, full: true };
        const A = v.stage({ ...W, x: [-7.6, 7.6], y: [-1.4, 1.4], xlabel: 'n', title: 'impulse response $h[n]$ (drag the stems)' });
        const B = v.stage({ ...W, y: [-0.4, 1.4], xlabel: 'n', title: 'input $x[n]$' });
        const C = v.stage({ ...W, y: [-1.6, 1.6], xlabel: 'n', title: 'output $y=x*h$' });
        A.onDrag((px, py) => { const n = Math.round(px); if (n >= -NR && n <= NR) { H[n + NR] = Math.max(-1.3, Math.min(1.3, Math.round(py * 20) / 20)); sel.value = 'mine'; } });
        let info = null;
        v.render(() => {
          const xf = (n) => (inp.value === 'imp' ? (n === 0 ? 1 : 0) : inp.value === 'pulse' ? (n >= 0 && n < 3 ? 1 : 0) : n >= 0 ? 1 : 0);
          const y = {}; let firstN = null;
          for (let n = -7; n <= 15; n++) { let s = 0; for (let k = -NR; k <= NR; k++) s += H[k + NR] * xf(n - k); y[n] = s; if (firstN == null && Math.abs(s) > 1e-9) firstN = n; }
          const nonc = H.some((a, i) => i < NR && Math.abs(a) > 1e-9);
          A.vband(-7.6, -0.5, { color: 'red', alpha: 0.08 }); A.hline(0, { color: 'faint', width: 1 });
          stems(A, H.map((a, i) => [i - NR, a]), { color: 'orange' });
          for (let n = -NR; n < 0; n++) if (Math.abs(H[n + NR]) > 1e-9) stems(A, [[n, H[n + NR]]], { color: 'red', r: 4.6 });
          B.hline(0, { color: 'faint', width: 1 });
          const Px = []; for (let n = -7; n <= 15; n++) if (xf(n)) Px.push([n, xf(n)]);
          stems(B, Px, { color: 'accent' });
          C.vband(-7.6, -0.5, { color: 'red', alpha: 0.08 }); C.hline(0, { color: 'faint', width: 1 });
          let m = 1.6; for (let n = -7; n <= 15; n++) m = Math.max(m, Math.abs(y[n]) * 1.15);
          C.setView(null, [-m, m]);
          const Py = [], Pr = []; for (let n = -7; n <= 15; n++) (n < 0 ? Pr : Py).push([n, y[n]]);
          stems(C, Py, { color: 'purple' }); stems(C, Pr.filter((p) => Math.abs(p[1]) > 1e-9), { color: 'red', r: 4.6 });
          const mless = H.every((a, i) => i === NR || Math.abs(a) < 1e-9) && Math.abs(H[NR]) > 1e-9;
          info = { nonc, firstN, mless, zero: H.every((a) => Math.abs(a) < 1e-9) };
        });
        v.legend([['orange', 'taps at $n\\ge0$'], ['red', 'taps / output before time 0'], ['purple', 'output']]);
        v.readout(() => `${info.nonc ? '**Non-causal**: some $h[n]\\ne0$ for $n<0$' : '**Causal**: $h[n]=0$ for all $n<0$'}; ${info.mless ? '**memoryless** ($h$ is a single tap at $0$)' : info.zero ? 'the zero system' : 'has **memory** ($h$ has a tap away from $n=0$)'}. The output first moves at $n=${info.firstN == null ? '—' : info.firstN}$ while the input switches on at $n=0$${info.firstN != null && info.firstN < 0 ? ' — the system anticipates its input.' : '.'}`);
      },
    },
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Theorem',
      name: 'BIBO stability iff ∫|h| is finite',
      statement: String.raw`A continuous-time LTI system with impulse response $h$ is BIBO stable (every bounded input gives a bounded output, sig-2.6) if and only if $\int_{-\infty}^{\infty}|h(t)|\,dt<\infty$. In that case $|y(t)|\le \|x\|_\infty\int|h|$, and the constant $\int|h|$ cannot be improved. (Discrete time: $\sum_n|h[n]|<\infty$.)`,
      idea: String.raw`If $\int|h|<\infty$, then $|y(t)|=|\int h(\tau)x(t-\tau)d\tau|\le \|x\|_\infty\int|h|$ by sig-3.2. Conversely, to defeat a system with $\int|h|=\infty$ pick the bounded input $x_T(s)=\operatorname{sgn}h(T-s)$ for $0\le s\le T$: then $y(T)=\int_0^T|h|$, unbounded as $T\to\infty$. The same input also shows that the bound is sharp. Note that $\int h$ itself may converge while $\int|h|$ does not (third kernel).`,
      caption: String.raw`Choose a kernel and its parameter. Top: $|h|$ with the area up to $T$. Middle: the worst-case input $\pm1$ built from the sign of the flipped kernel and the output it produces: at time $T$ the output equals the area. Bottom: that area against $T$ (solid), with $\int_0^T h$ without absolute values (dashed). Decaying exponentials and $(1+t)^{-p}$ with $p>1$ have bounded area; $p\le1$ and $a\ge0$ do not.`,
      deps: ['sig-3.2', 'sig-2.6'],
      refs: ['Oppenheim–Willsky §2.3'],
      tags: ['stability', 'impulse response'],
      viz(v) {
        const KS = {
          exp: { label: '$e^{at}u(t)$', f: (t, p) => Math.exp(p.a * t) },
          pow: { label: '$(1+t)^{-p}$', f: (t, p) => (1 + t) ** -p.p },
          osc: { label: '$\\sin t/(1+t)$', f: (t) => Math.sin(t) / (1 + t) },
        };
        const sel = v.select('kernel', Object.entries(KS).map(([value, o]) => ({ value, label: o.label })), 'exp');
        const a = v.slider('$a$', -1.5, 0.5, -0.4, { step: 0.05 });
        const pp = v.slider('$p$', 0.3, 2.5, 0.8, { step: 0.05 });
        const TT = v.slider('horizon $T$', 1, 40, 12, { step: 0.5 });
        const TM = 40, D = 0.02;
        const W = { x: [0, TM], axes: 'box', gutter: true, full: true, xlabel: 't' };
        const A = v.stage({ ...W, y: [-0.4, 1.1], height: 150, title: '$|h(t)|$ and the area up to $T$' });
        const B = v.stage({ ...W, y: [-1.5, 1.5], height: 150, title: 'worst-case bounded input $x_T(s)=\\operatorname{sgn}h(T-s)$ and the output it produces' });
        const C = v.stage({ x: [0, TM], y: [0, 5], axes: 'box', gutter: true, full: true, xlabel: 'T', height: 170, title: 'area $\\int_0^T|h|$ (solid) and $\\int_0^T h$ (dashed)' });
        let cache = { key: '' };
        const run = () => {
          const k = sel.value, par = { a: a.value, p: pp.value }, key = `${k}|${par.a}|${par.p}|${TT.value}`;
          if (cache.key === key) return cache;
          const f = (t) => (t >= 0 ? KS[k].f(t, par) : 0), T = TT.value;
          const n = Math.round(TM / D) + 1, hA = new Float64Array(n), R = new Float64Array(n), R2 = new Float64Array(n);
          let s = 0, s2 = 0; for (let i = 0; i < n; i++) { const t = i * D, q = f(t); hA[i] = q; s += Math.abs(q) * D; s2 += q * D; R[i] = s; R2[i] = s2; }
          const iT = Math.round(T / D), x = new Float64Array(n), y = new Float64Array(n);
          for (let i = 0; i <= iT; i++) x[i] = Math.sign(hA[iT - i]);
          for (let i = 0; i < n; i++) { let q = 0; for (let j = 0; j <= i && j <= iT + 1; j++) q += hA[i - j] * x[j]; y[i] = q * D; }
          return (cache = { key, hA, R, R2, x, y, iT, n });
        };
        let info = null;
        v.render(() => {
          a.el.hidden = sel.value !== 'exp'; pp.el.hidden = sel.value !== 'pow';
          const { hA, R, R2, x, y, iT, n } = run(), T = TT.value;
          A.hline(0, { color: 'faint', width: 1 });
          const Pa = [], Pf = [], Pb = []; for (let i = 0; i < n; i += 4) { Pa.push([i * D, hA[i]]); }
          const Pi = []; for (let i = 0; i <= iT; i += 4) Pi.push([i * D, Math.abs(hA[i])]);
          A.path([[0, 0], ...Pi, [iT * D, 0]], { fill: 'green', fillAlpha: 0.25, color: 'green', width: 0.5, close: true });
          A.path(Pa, { color: 'orange', width: 2.2 });
          A.vline(T, { color: 'gold', width: 1.2, dash: [4, 4] });
          B.hline(0, { color: 'faint', width: 1 });
          const Px = [], Py = []; for (let i = 0; i < n; i += 2) { Px.push([i * D, x[i]]); }
          B.path(Px, { color: 'accent', width: 1.2, alpha: 0.7 });
          let ym = 1.5; for (let i = 0; i < n; i += 2) { Py.push([i * D, y[i]]); ym = Math.max(ym, Math.abs(y[i]) * 1.15); }
          B.setView(null, [-ym, ym]); B.path(Py, { color: 'purple', width: 2.4 }); B.dot(T, y[iT], { r: 6, color: 'gold', ring: true }); B.vline(T, { color: 'gold', width: 1.2, dash: [4, 4] });
          let top = 1; for (let i = 0; i < n; i += 5) top = Math.max(top, R[i] * 1.12, Math.abs(R2[i]) * 1.12);
          C.setView(null, [Math.min(0, ...R2) - 0.1, top]); C.hline(0, { color: 'faint', width: 1 });
          const Pr = [], Pr2 = []; for (let i = 0; i < n; i += 5) { Pr.push([i * D, R[i]]); Pr2.push([i * D, R2[i]]); }
          C.path(Pr, { color: 'green', width: 2.6 }); C.path(Pr2, { color: 'ink', width: 1.6, dash: [5, 4] }); C.dot(T, R[iT], { r: 6, color: 'gold', ring: true }); C.vline(T, { color: 'gold', width: 1.2, dash: [4, 4] });
          let lim = null; if (sel.value === 'exp') lim = a.value < 0 ? 1 / -a.value : Infinity; else if (sel.value === 'pow') lim = pp.value > 1 ? 1 / (pp.value - 1) : Infinity;
          if (lim != null && isFinite(lim) && lim < top) C.hline(lim, { color: 'green', width: 1.2, dash: [3, 4] });
          info = { yT: y[iT], areaT: R[iT], lim, areaEnd: R[n - 1] };
        });
        v.legend([['orange', '$h$'], ['accent', 'worst-case input'], ['purple', 'its output'], ['green', 'area $\\int_0^T|h|$', { area: true }]]);
        v.readout(() => `At $T=${v.fix(TT.value, 1)}$: output of the worst-case input $y(T)=${v.fix(info.yT, 4)}$, area $\\int_0^T|h|=${v.fix(info.areaT, 4)}$ (equal, up to the grid).\n` + (info.lim == null ? 'The area keeps growing as $T$ grows (a logarithm for $\\sin t/(1+t)$): not BIBO stable, although $\\int h$ converges.' : isFinite(info.lim) ? `$\\int_0^\\infty|h|=${v.fix(info.lim, 3)}$ (exact): BIBO stable, and no bounded input with $|x|\\le1$ gives an output above that.` : 'The area is infinite: not BIBO stable. The worst-case input is bounded by 1 but its output at time $T$ is the area, which grows without bound with $T$.'));
      },
    },
    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Definition',
      name: 'Step response',
      statement: String.raw`The **step response** of an LTI system is its output $s=S\{u\}$ to the unit step. Since $u(t)=\int_{-\infty}^{t}\delta$ (sig-1.10), and $S$ is linear and time-invariant,
$$s(t)=\int_{-\infty}^{t}h(\tau)\,d\tau,\qquad h(t)=s'(t)$$
(in the sense of distributions: a jump of size $a$ in $s$ corresponds to a term $a\,\delta(t-T)$ in $h$). Discrete time: $s[n]=\sum_{k\le n}h[k]$ and $h[n]=s[n]-s[n-1]$.`,
      idea: String.raw`The step is the running integral of the impulse (sig-1.10), and convolution with $u$ is the running integral operator: $(h*u)(t)=\int h(\tau)u(t-\tau)d\tau=\int_{-\infty}^t h$ (sig-3.2). Hence the step response can be measured instead of the impulse response, which is nicer in a laboratory (a unit step is easy to apply, a unit-area impulse is not), and $h$ is recovered by differentiating. Overshoot, rise time and settling time are read from $s$.`,
      caption: String.raw`Choose a kernel and drag the gold handle. The shaded area under $h$ up to $t$ (top) is the height of the step response (bottom); point masses (arrows) contribute jumps. The solid purple curve is computed by actually filtering a unit step, the dashed ink curve by integrating $h$, and the readout compares them and also compares $s'$ with $h$.`,
      deps: ['sig-3.3', 'sig-1.10'],
      refs: ['Oppenheim–Willsky §2.3'],
      tags: ['step response', 'impulse response'],
      viz(v) {
        const ks = v.select('kernel', kerMenu(Object.keys(KER)), 'res');
        const A = v.stage({ x: [-1, 12], y: [-1.2, 1.7], axes: 'box', gutter: true, xlabel: 'τ', full: true, height: 190, title: 'impulse response $h(\\tau)$; shaded: $\\int_{-\\infty}^{t}h$' });
        const B = v.stage({ x: [-1, 12], y: [-0.5, 2], axes: 'box', gutter: true, xlabel: 't', full: true, height: 190, title: 'step response $s(t)$' });
        const hd = A.handle(3, 0, { color: 'gold', r: 7, constrain: { x: [-0.5, 11.5], y: [0, 0] }, label: 't', labelPos: 'n' });
        let cache = { key: '' };
        const get = () => {
          if (cache.key === ks.value) return cache;
          const K = KER[ks.value], n = 650, S = [], I = [];
          // integral of h by a fine cumulative sum
          const m = 6000, hh = K.T / m, cum = new Float64Array(m + 1); for (let i = 0; i < m; i++) cum[i + 1] = cum[i] + K.f((i + 0.5) * hh) * hh;
          const integ = (t) => { let s = K.deltas.reduce((q, [T, a]) => q + (t >= T ? a : 0), 0); const u = Math.min(Math.max(t, 0), K.T) / hh, i = Math.min(m - 1, Math.floor(u)); return s + (t <= 0 ? 0 : cum[i] + (cum[i + 1] - cum[i]) * (u - i)); };
          let gap = 0, top = 1, bot = 0;
          for (let i = 0; i <= n; i++) { const t = -1 + (13 * i) / n, sd = kerResp(K, unitStep, t, 2400), si = integ(t); S.push([t, sd]); I.push([t, si]); gap = Math.max(gap, Math.abs(sd - si)); top = Math.max(top, si); bot = Math.min(bot, si); }
          // derivative of the integral against h away from point masses
          let dg = 0; const eps = 0.02;
          for (let t = 0.25; t < Math.min(10, K.T + 0.2); t += 0.07) { if (K.deltas.some(([T]) => Math.abs(T - t) < 0.1)) continue; const d = (integ(t + eps) - integ(t - eps)) / (2 * eps); dg = Math.max(dg, Math.abs(d - K.f(t))); }
          return (cache = { key: ks.value, S, I, integ, gap, dg, top, bot });
        };
        let info = null;
        v.render(() => {
          const K = KER[ks.value], c = get(), t = hd.x;
          const hm = Math.max(0.3, ...Array.from({ length: 200 }, (_, i) => Math.abs(K.f((K.T * i) / 200))), ...K.deltas.map(([, a]) => Math.abs(a)));
          A.setView(null, [-1.2 * hm, 1.5 * hm]); A.hline(0, { color: 'faint', width: 1 });
          const fill = []; for (let i = 0; i <= 300; i++) { const tau = Math.max(0, (t * i) / 300); fill.push([tau, K.f(tau)]); }
          if (t > 0) A.path([[0, 0], ...fill, [t, 0]], { fill: 'green', fillAlpha: 0.3, color: 'green', width: 0.5, close: true });
          drawKer(A, K, { color: 'orange' });
          for (const [T, a] of K.deltas) if (t >= T) A.arrow(T, 0, T, a, { color: 'green', width: 3, head: 8 });
          A.vline(t, { color: 'gold', width: 1, dash: [4, 4] });
          B.setView(null, [Math.min(-0.2, c.bot * 1.2), Math.max(1.2, c.top * 1.2)]); B.hline(0, { color: 'faint', width: 1 });
          B.path(c.I, { color: 'ink', width: 1.6, dash: [5, 4] });
          B.path(c.S, { color: 'purple', width: 2.6, alpha: 0.35 });
          B.path(c.S.filter((p) => p[0] <= t), { color: 'purple', width: 2.8 });
          const st = c.integ(t); B.dot(t, st, { r: 6, color: 'gold', ring: true }); B.vline(t, { color: 'gold', width: 1, dash: [4, 4] });
          info = { st, K, c };
        });
        v.legend([['orange', '$h$'], ['green', 'area so far', { area: true }], ['purple', '$s$ from filtering a step'], ['ink', '$\\int_{-\\infty}^t h$', { dash: true }]]);
        v.readout(() => `$${info.K.tex}$ — $s(${v.fix(hd.x, 2)})=${v.fix(info.st, 4)}$. Largest gap between the filtered step and $\\int h$ over the plot: $${errTex(info.c.gap)}$ (quadrature error, jumps included); largest gap between $s'$ and $h$ (away from point masses): $${errTex(info.c.dg)}$.`);
      },
    },
    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Proposition',
      name: 'Cascades convolve, parallels add',
      statement: String.raw`If LTI systems with impulse responses $h_1,h_2$ are connected in cascade (the output of the first is the input of the second), the whole is LTI with impulse response $h_1*h_2$, whatever the order. If they are connected in parallel (same input, outputs added), the whole is LTI with impulse response $h_1+h_2$. By induction the same holds for any series–parallel network.`,
      idea: String.raw`Series: $y=(x*h_1)*h_2=x*(h_1*h_2)$ by associativity (sig-3.4), so the combined impulse response is $h_1*h_2$; commutativity says the order is immaterial. Parallel: $y=x*h_1+x*h_2=x*(h_1+h_2)$ by distributivity. The block diagrams of sig-2.7 can therefore be reduced to a single $h$. The simulations below do not use these formulas: each block is a real discrete-time filter (an exact discretisation of a first-order circuit, or a moving average), the wired diagram is run on a test signal, and the result is compared with the formula.`,
      caption: String.raw`Choose the wiring and the two blocks; drag the sliders for their time constants. The diagram shows the topology. Middle: the impulse responses of the blocks and the one predicted for the whole ($h_1*h_2$ or $h_1+h_2$). Bottom: a test signal is passed through the wired blocks (solid) and through the predicted single filter (dashed); the readout gives the difference.`,
      deps: ['sig-3.4', 'sig-2.7'],
      refs: ['Oppenheim–Willsky §2.3'],
      tags: ['block diagrams', 'convolution'],
      viz(v) {
        const BL = {
          lp: { label: 'lowpass', tex: (t) => `\\text{RC low-pass},\\ \\tau=${t}`, run: (xs, t) => firstOrder(xs, -1 / t, 1 / t) },
          avg: { label: 'average', tex: () => '\\text{moving average},\\ \\text{width }1', run: (xs) => SYS.mavg.run(xs), fixed: true },
          bp: { label: 'band-pass', tex: (t) => `\\text{difference of low-passes},\\ \\tau=${t}`, run: (xs, t) => { const a = firstOrder(xs, -1 / t, 1 / t), b = firstOrder(xs, -0.5 / t, 0.5 / t); return a.map((q, i) => q - b[i]); } },
        };
        const bs = Object.entries(BL).map(([value, o]) => ({ value, label: o.label }));
        const topo = v.select('wiring', [{ value: 'ser', label: 'cascade' }, { value: 'par', label: 'parallel' }], 'ser');
        const b1 = v.select('block 1', bs, 'lp'), b2 = v.select('block 2', bs, 'avg');
        const t1 = v.slider('$\\tau_1$', 0.2, 3, 0.6, { step: 0.05 }), t2 = v.slider('$\\tau_2$', 0.2, 3, 1.2, { step: 0.05 });
        const Z = v.stage({ x: [0, 20], y: [0, 5], axes: false, height: 120, full: true });
        const P = v.stage({ x: [-0.3, 10], y: [-0.4, 1.2], axes: 'box', gutter: true, xlabel: 't', full: true, height: 190, title: 'impulse responses' });
        const Q = v.stage({ x: [-0.3, 10], y: [-0.5, 1.2], axes: 'box', gutter: true, xlabel: 't', full: true, height: 200, title: 'test signal through the wired blocks vs through the single predicted filter' });
        const test = sample((t) => bump(t, 1.4, 1.0) - 0.7 * bump(t, 3.6, 0.7) + (t >= 5.5 && t < 7 ? 0.5 : 0));
        const imp = new Float64Array(test.length); imp[iOf(0)] = 1 / DT;
        const i0 = iOf(0), i1 = iOf(10);
        const win = (a) => { const o = new Float64Array(i1 - i0 + 1); for (let i = i0; i <= i1; i++) o[i - i0] = a[i]; return o; };
        const conv0 = (a, b) => { const n = a.length, o = new Float64Array(n); for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j <= i; j++) s += a[j] * b[i - j]; o[i] = s * DT; } return o; };
        let info = null;
        v.render(() => {
          t1.el.hidden = BL[b1.value].fixed; t2.el.hidden = BL[b2.value].fixed;
          const B1 = BL[b1.value], B2 = BL[b2.value], ser = topo.value === 'ser';
          const run1 = (x) => B1.run(x, t1.value), run2 = (x) => B2.run(x, t2.value);
          const wired = ser ? (x) => run2(run1(x)) : (x) => { const a = run1(x), b = run2(x); return a.map((q, i) => q + b[i]); };
          const h1 = win(run1(imp)), h2 = win(run2(imp)), hw = win(wired(imp));
          const hp = ser ? conv0(h1, h2) : h1.map((q, i) => q + h2[i]);
          const yw = win(wired(test)), xw = win(test), yp = conv0(xw, hp);
          let e1 = 0, e2 = 0, m = 0.8; for (let i = 0; i < hp.length; i++) { e1 = Math.max(e1, Math.abs(hw[i] - hp[i])); e2 = Math.max(e2, Math.abs(yw[i] - yp[i])); m = Math.max(m, Math.abs(yw[i]) * 1.15, Math.abs(xw[i]) * 1.1); }
          // diagram
          const ys = 2.5;
          bdWire(Z, [[0.5, ys], [2.3, ys]], { color: 'muted' }); Z.text('x', 0.6, ys + 0.7, { math: true, size: 15, color: 'muted' });
          if (ser) {
            bdBlock(Z, 4.6, ys, 4.4, 1.5, 'h_1', { color: 'orange' }); bdWire(Z, [[6.8, ys], [9.0, ys]], { color: 'muted' });
            bdBlock(Z, 11.2, ys, 4.4, 1.5, 'h_2', { color: 'teal' }); bdWire(Z, [[13.4, ys], [18.6, ys]], { color: 'muted' }); Z.text('y = x ∗ h₁ ∗ h₂', 17.2, ys + 0.8, { size: 13, color: 'accent', align: 'center' });
          } else {
            Z.line(2.3, ys, 3.0, ys, { color: 'muted', width: 1.7 }); Z.line(3, 1, 3, 4, { color: 'muted', width: 1.7 });
            bdWire(Z, [[3, 4], [4.6, 4]], { color: 'muted' }); bdWire(Z, [[3, 1], [4.6, 1]], { color: 'muted' });
            bdBlock(Z, 7.2, 4, 4.4, 1.3, 'h_1', { color: 'orange' }); bdBlock(Z, 7.2, 1, 4.4, 1.3, 'h_2', { color: 'teal' });
            Z.line(9.4, 4, 13, 4, { color: 'muted', width: 1.7 }); Z.line(9.4, 1, 13, 1, { color: 'muted', width: 1.7 });
            bdWire(Z, [[13, 4], [13, 2.9]], { color: 'muted' }); bdWire(Z, [[13, 1], [13, 2.1]], { color: 'muted' });
            bdSum(Z, 13, 2.5, 13, { n: '+', s: '+' });
            bdWire(Z, [[13.6, 2.5], [18.6, 2.5]], { color: 'muted' }); Z.text('y = x ∗ (h₁ + h₂)', 16.6, 3.3, { size: 13, color: 'accent', align: 'center' });
          }
          Z.text('y', 19.4, ys, { math: true, size: 15, color: 'accent', align: 'center' });
          // impulse responses
          P.hline(0, { color: 'faint', width: 1 });
          const pa = (a) => { const o = []; for (let i = 0; i < a.length; i += 4) o.push([i * DT, a[i]]); return o; };
          let ym = 0.5; for (const a of [h1, h2, hp]) for (let i = 0; i < a.length; i += 4) ym = Math.max(ym, Math.abs(a[i]) * 1.1);
          P.setView(null, [-ym * 0.5, ym * 1.1]);
          P.path(pa(h1), { color: 'orange', width: 1.8 }); P.path(pa(h2), { color: 'teal', width: 1.8 });
          P.path(pa(hp), { color: 'accent', width: 2.8 }); P.path(pa(hw), { color: 'ink', width: 1.4, dash: [5, 4] });
          Q.setView(null, [-m, m]); Q.hline(0, { color: 'faint', width: 1 });
          Q.path(pa(xw), { color: 'muted', width: 1.4, alpha: 0.7 });
          Q.path(pa(yw), { color: 'purple', width: 2.8 }); Q.path(pa(yp), { color: 'ink', width: 1.4, dash: [5, 4] });
          info = { e1, e2, ser };
        });
        v.legend([['orange', '$h_1$'], ['teal', '$h_2$'], ['accent', 'predicted $h_1*h_2$ / $h_1+h_2$'], ['ink', 'measured / predicted (dashed)', { dash: true }], ['purple', 'wired output'], ['muted', 'test signal']]);
        v.readout(() => `${info.ser ? 'Cascade' : 'Parallel'}: the impulse response measured on the wired diagram differs from ${info.ser ? '$h_1*h_2$' : '$h_1+h_2$'} by at most $${errTex(info.e1)}$; for the test signal the wired output differs from $x*{\\rm (predicted\\ }h)$ by at most $${errTex(info.e2)}$ (a true impulse is a one-sample spike of height $1/\\Delta t$ on a grid of step $\\Delta t=0.01$).`);
      },
    },
  ],
};
