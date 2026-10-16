// Signals & Systems — Chapter 4: Fourier series (items 4.5–4.8)
import { TAU, PI, WAVES, coefsOf, waveMenu, mag, partial, zip, grid, powerOf, tailPower, fcoef, wrap, PI_TICKS } from './ch04.shared.js';

const POW = {};
const powOf = (id) => (POW[id] ??= powerOf(WAVES[id].f));

export default {
  collection: 'sig',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Theorem',
      name: 'Mean-square convergence and best approximation',
      statement: String.raw`Let $x$ be $2\pi$-periodic with finite power $\frac1{2\pi}\int|x|^2<\infty$, and let $c_k$ be its Fourier coefficients. Among all trigonometric polynomials $p(t)=\sum_{|k|\le N}a_ke^{jkt}$ of degree at most $N$, the partial sum $S_N$ (with $a_k=c_k$) is the unique best mean-square approximation, and for every choice of the $a_k$
$$\frac1{2\pi}\int_{-\pi}^{\pi}|x-p|^2\,dt=\underbrace{\frac1{2\pi}\int|x-S_N|^2dt}_{E_N}+\sum_{|k|\le N}|c_k-a_k|^2 .$$
Moreover $E_N\to0$ as $N\to\infty$: the Fourier series converges to $x$ in the mean-square sense, whether or not it converges at any point.`,
      idea: String.raw`The error $x-S_N$ is orthogonal to every exponential of degree at most $N$ (sig-4.2), so the Pythagorean theorem in $L^2$ splits the error of any competitor $p$ into the error of $S_N$ plus the squared distance $\|S_N-p\|^2=\sum|c_k-a_k|^2$ (sig-1.12; pma-8.11 for the same statement for orthonormal systems). The convergence $E_N\to0$ is completeness of the trigonometric system: trigonometric polynomials are dense in $L^2$ (pma-8.15 for continuous functions, then approximation of $L^2$ functions by continuous ones), and by the best-approximation property $S_N$ does at least as well as any polynomial; see rca-4.26 for the Riesz–Fischer and Parseval theorems.`,
      caption: String.raw`The coloured map is the mean-square error as a function of the scales $s_1,s_2$ of two harmonics of the degree-$N$ approximation (all others kept at their Fourier values); it is a bowl whose bottom is at $s_1=s_2=1$, the Fourier coefficients. Drag the gold handle: the orange curve is the approximant, the green one the Fourier partial sum, and the readout checks the Pythagorean identity by integrating $|x-p|^2$ directly. The right panel shows $E_N$ falling to zero with $N$ (log axes).`,
      deps: ['sig-4.2', 'pma-8.11', 'rca-4.26'],
      refs: ['Oppenheim–Willsky §3.4'],
      tags: ['least squares', 'L2 convergence'],
      viz(v) {
        const PAIR = { square: [1, 3], saw: [1, 2], tri: [1, 3], pulse: [1, 2], skew: [1, 2] };
        const wsel = v.select('signal', waveMenu(['square', 'saw', 'tri', 'pulse', 'skew']), 'square');
        const nsl = v.slider('degree $N$', 3, 30, 5, { step: 1, int: true });
        const A = v.stage({ x: [-0.5, 2.1], y: [-0.5, 2.1], axes: 'box', gutter: true, xlabel: 'scale s₁ of the first harmonic', ylabel: 'scale s₂ of the second', height: 330, title: 'mean-square error $E(s_1,s_2)$ (darker = larger)' });
        const B = v.stage({ x: [-PI, PI], y: [-1.7, 1.7], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 330, title: 'signal, Fourier sum $S_N$, and the approximant at the handle' });
        const C = v.stage({ x: [1, 60], y: [1e-6, 1], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'N', height: 220, full: true, title: 'the error $E_N$ of the Fourier sum falls to zero' });
        const h = A.handle(1.65, 0.35, { color: 'gold', r: 7, constrain: { x: [-0.5, 2.1], y: [-0.5, 2.1] } });
        let info = null;
        v.render(() => {
          const id = wsel.value, N = nsl.value, c = coefsOf(id, 60), P = powOf(id), [k1, k2] = PAIR[id];
          const p1 = 2 * (c.re[k1] ** 2 + c.im[k1] ** 2), p2 = 2 * (c.re[k2] ** 2 + c.im[k2] ** 2);
          const EN = tailPower(c, N, P);
          const E = (s1, s2) => EN + p1 * (1 - s1) ** 2 + p2 * (1 - s2) ** 2;
          const top = EN + 1.1 * (p1 + p2);
          A.heat(E, { range: [EN, top], cmap: 'theme', res: 4, key: `${id}|${N}` });
          A.contour(E, [EN + 0.02 * (p1 + p2), EN + 0.1 * (p1 + p2), EN + 0.3 * (p1 + p2), EN + 0.7 * (p1 + p2)], { color: 'ink', alpha: 0.35, width: 1, res: 60 });
          A.dot(1, 1, { r: 5, color: 'green', label: 'Fourier', labelPos: 'ne' });
          const s1 = h.x, s2 = h.y, ts = grid(-PI, PI, 600), base = partial(c, N, ts);
          const hk = (k, t) => 2 * (c.re[k] * Math.cos(k * t) - c.im[k] * Math.sin(k * t));
          const app = Array.from(ts, (t, i) => base[i] + (s1 - 1) * hk(k1, t) + (s2 - 1) * hk(k2, t));
          B.fn(WAVES[id].f, { domain: [-PI, PI], color: 'faint', width: 1.6 });
          B.path(zip(ts, base), { color: 'green', width: 1.8 });
          B.path(zip(ts, app), { color: 'orange', width: 2.2 });
          // direct integration of |x − p|²
          const M = 2400; let num = 0;
          for (let j = 0; j < M; j++) { const t = -PI + ((j + 0.5) * TAU) / M, d = WAVES[id].f(t) - (partial(c, N, [t])[0] + (s1 - 1) * hk(k1, t) + (s2 - 1) * hk(k2, t)); num += d * d / M; }
          const pred = E(s1, s2);
          const Ns = Array.from({ length: 60 }, (_, i) => i + 1), pts = Ns.map((n) => [n, Math.max(1e-12, tailPower(c, n, P))]);
          C.path(pts, { color: 'accent', width: 2 }); C.dots(pts, { r: 2.4, color: 'accent' });
          C.dot(N, Math.max(1e-12, EN), { r: 6, color: 'gold' });
          info = { k1, k2, num, pred, EN, N };
        });
        v.legend([['faint', 'signal'], ['green', 'Fourier partial sum $S_N$'], ['orange', 'approximant at the handle']]);
        v.readout(() => `Harmonics $k=${info.k1}$ and $k=${info.k2}$ rescaled; $E_{${info.N}}=${v.sci(info.EN, 3)}$.\nError of the approximant by direct integration: $${v.sci(info.num, 4)}$; predicted $E_N+\\sum|c_k-a_k|^2=${v.sci(info.pred, 4)}$. The extra cost over the Fourier sum is $${v.sci(Math.max(0, info.pred - info.EN), 3)}$.`);
      },
    },
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Theorem',
      name: 'Parseval’s relation for periodic signals',
      statement: String.raw`For a $T$-periodic signal $x$ with finite average power,
$$\frac1T\int_T|x(t)|^2\,dt=\sum_{k=-\infty}^{\infty}|c_k|^2 .$$
For a real signal this is $c_0^2+2\sum_{k\ge1}|c_k|^2$: the average power is the sum of the powers of the harmonics, the $k$-th harmonic contributing $|c_k|^2$ at frequency $+k\omega_0$ and $|c_k|^2$ at $-k\omega_0$. The partial sums satisfy $\frac1T\int|x-S_N|^2=\sum_{|k|>N}|c_k|^2$.`,
      idea: String.raw`Parseval is the Pythagorean theorem for the orthonormal exponentials (sig-4.2): the squared length of $x$ is the sum of the squared lengths of its components. Take $a_k=c_k$ in the identity of sig-4.5, let $N\to\infty$ and use $E_N\to0$ (completeness). The statement for $L^2$ functions on the circle is pma-8.16; the general Riesz–Fischer form is rca-4.26.`,
      caption: String.raw`Draw your own periodic waveform in the top-left panel by dragging (it wraps around at $\pm\pi$), or start from a preset. The top-right panel gives the power of each harmonic, $c_0^2$ and $2|c_k|^2$; the bottom panel adds them up as $N$ grows and approaches the time-domain average power (green line), which is computed by integrating $x^2$ directly. The readout shows both numbers agree.`,
      deps: ['sig-4.5', 'pma-8.16'],
      refs: ['Oppenheim–Willsky §3.5'],
      tags: ['Parseval', 'power'],
      credit: 'Parseval, c. 1799 (a relation for series that was later recognised as this identity); Plancherel for the transform version',
      verify: true,
      viz(v) {
        const NN = 48, K = 60, ys = new Float64Array(NN);
        const preset = (name) => {
          for (let i = 0; i < NN; i++) {
            const t = -PI + (TAU * i) / NN;
            ys[i] = name === 'square' ? (t >= 0 ? 0.8 : -0.8) : name === 'saw' ? (0.8 * t) / PI : name === 'tri' ? 0.8 - (1.6 * Math.abs(t)) / PI
              : 0.7 * Math.sin(t) + 0.45 * Math.cos(2 * t + 0.6) + 0.25 * Math.sin(3 * t);
          }
        };
        preset('hand');
        const f = (t) => { const u = ((wrap(t) + PI) / TAU) * NN, i = Math.floor(u) % NN, a = u - Math.floor(u); return ys[i] * (1 - a) + ys[(i + 1) % NN] * a; };
        const sel = v.select('start from', [{ value: 'hand', label: 'mixture' }, { value: 'square', label: 'square' }, { value: 'saw', label: 'sawtooth' }, { value: 'tri', label: 'triangle' }], 'hand', { onChange: (val) => { preset(val); } });
        const nsl = v.slider('harmonics included $N$', 0, 30, 3, { step: 1, int: true });
        const A = v.stage({ x: [-PI, PI], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 300, title: 'drag to draw one period (it wraps)' });
        const B = v.stage({ x: [-0.8, 24.8], y: [0, 1], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'power', height: 300, title: 'power of each harmonic: $c_0^2$, $2|c_k|^2$' });
        const C = v.stage({ x: [0, 30], y: [0, 1], axes: 'box', gutter: true, xlabel: 'N', ylabel: 'power', height: 210, full: true, title: 'power collected by harmonics $0\\ldots N$' });
        let last = -1;
        A.onDrag((x, y, ph) => {
          const i = ((Math.round(((x + PI) / TAU) * NN) % NN) + NN) % NN, val = Math.max(-1.5, Math.min(1.5, y));
          if (ph === 'start' || last < 0) last = i;
          if (last !== i) { const d = Math.sign(((i - last + NN * 1.5) % NN) - NN / 2) || 1, n = (((i - last) * d) % NN + NN) % NN; const y0 = ys[last]; for (let s = 1; s <= n; s++) ys[(last + s * d + NN * 2) % NN] = y0 + ((val - y0) * s) / n; } else ys[i] = val;
          last = i; if (ph === 'end') last = -1;
        });
        let info = null;
        v.render(() => {
          const c = fcoef(f, K, 1536);
          const P = powerOf(f, 6000);
          const ts = grid(-PI, PI, 480);
          A.path(zip(ts, ts.map(f)), { color: 'accent', width: 2.2 });
          A.dots(Array.from(ys, (y, i) => [-PI + (TAU * i) / NN, y]), { r: 3, color: 'accent' });
          const pw = Array.from({ length: 25 }, (_, k) => (k === 0 ? c.re[0] ** 2 : 2 * (c.re[k] ** 2 + c.im[k] ** 2)));
          B.setView(null, [0, Math.max(0.05, ...pw) * 1.15]);
          B.bars(pw, { x0: 0, color: (val, i) => (i <= nsl.value ? 'accent' : 'faint') });
          const cum = []; let s = 0; for (let k = 0; k <= 30; k++) { s += k === 0 ? c.re[0] ** 2 : 2 * (c.re[k] ** 2 + c.im[k] ** 2); cum.push(s); }
          C.setView(null, [0, Math.max(P, 0.05) * 1.15]);
          C.hline(P, { color: 'green', width: 1.8 });
          C.bars(cum, { x0: 0, color: (val, i) => (i <= nsl.value ? 'accent' : 'faint'), barWidth: 0.8 });
          info = { P, part: cum[nsl.value], all: cum[30], N: nsl.value };
        });
        v.legend([['green', 'average power $\\frac1T\\int x^2$ (time domain)'], ['accent', 'sum of harmonic powers']]);
        v.readout(() => `Time domain: $\\frac1{2\\pi}\\int x^2\\,dt=${v.fix(info.P, 5)}$. Frequency domain: $\\sum_{|k|\\le 30}|c_k|^2=${v.fix(info.all, 5)}$ (difference $${v.sci(Math.abs(info.P - info.all), 2)}$, the power above harmonic 30). Harmonics $0\\ldots${info.N}$ already carry $${v.fix((100 * info.part) / info.P, 2)}\\%$ of the power.`);
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Proposition',
      name: 'Properties: shift, reversal, scaling and differentiation',
      statement: String.raw`Let $x$ have period $2\pi$ and coefficients $c_k$. Then
- (shift) $x(t-\tau)$ has coefficients $c_ke^{-jk\tau}$: magnitudes unchanged, phases moved by the linear term $-k\tau$;
- (reversal) $x(-t)$ has coefficients $c_{-k}$, which for a real $x$ is $\overline{c_k}$: the phases change sign;
- (scaling) for an integer $\alpha\ge1$, $x(\alpha t)$ has period $2\pi/\alpha$ and the same coefficients placed on the harmonics $\alpha k$: $c'_{\alpha k}=c_k$ and zero elsewhere;
- (differentiation) if $x$ is differentiable, $x'$ has coefficients $jk\,c_k$: harmonic $k$ is multiplied by $k$ in size and advanced by a quarter turn.`,
      idea: String.raw`Each statement is a change of variable in $c_k=\frac1{2\pi}\int x(t)e^{-jkt}dt$. Substituting $t\mapsto t-\tau$ pulls out a constant phase $e^{-jk\tau}$; $t\mapsto-t$ turns $e^{-jkt}$ into $e^{jkt}$; $t\mapsto\alpha t$ turns the $k$-th exponential into the $\alpha k$-th. For the derivative, integrate $x'e^{-jkt}$ by parts: the boundary terms cancel by periodicity and the remaining term is $jk$ times $c_k$. The same rules are the continuous-time Fourier properties in sig-5.3 and sig-5.8, and the eigenfunction property sig-3.9 is why delay and differentiation act so simply.`,
      caption: String.raw`Pick a signal and a property. Light bars and open circles are the original magnitudes and phases; solid ones are the coefficients of the transformed signal, which the program computes by integrating the transformed signal numerically (not by the formula). The dashed orange curve is the sum rebuilt from the formula's coefficients, and the readout reports the largest disagreement. Shift: the magnitudes do not move and the phases tilt linearly in $k$. Differentiate the triangle and it becomes a square wave, with ripples because that sum has only 40 terms.`,
      deps: ['sig-4.1'],
      refs: ['Oppenheim–Willsky §3.5'],
      tags: ['properties', 'Fourier series'],
      viz(v) {
        const DER = {
          tri: (t) => -(2 / PI) * Math.sign(wrap(t)),
          mix: (t) => -3 * Math.sin(3 * t) + 2.5 * Math.cos(5 * t),
          skew: (t) => (WAVES.skew.f(t + 1e-5) - WAVES.skew.f(t - 1e-5)) / 2e-5,
        };
        const wsel = v.select('signal', waveMenu(['skew', 'tri', 'mix']), 'skew');
        const psel = v.select('property', [{ value: 'shift', label: 'shift' }, { value: 'rev', label: 'reversal' }, { value: 'scale', label: 'scaling' }, { value: 'diff', label: 'derivative' }], 'shift');
        const tau = v.slider('shift $\\tau$', -PI, PI, 0.9, { step: 0.02 });
        const alpha = v.slider('scale $\\alpha$', 1, 4, 2, { step: 1, int: true });
        const A = v.stage({ x: [-PI, PI], y: [-1.6, 1.6], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 270, full: true, title: 'signal (grey) and transformed signal (blue); orange dashes: rebuilt from the formula' });
        const B = v.stage({ x: [-0.8, 16.8], y: [0, 1], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'size', height: 230, title: 'magnitudes $|c_k|$' });
        const C = v.stage({ x: [-0.8, 16.8], y: [-3.6, 3.6], axes: 'box', gutter: true, xlabel: 'k', ylabel: 'phase', yticks: [[-PI, '−π'], [0, '0'], [PI, 'π']], height: 230, title: 'phases $\\arg c_k$' });
        let info = null;
        v.render(() => {
          const id = wsel.value, prop = psel.value, c = coefsOf(id, 60), W = WAVES[id];
          tau.el.hidden = prop !== 'shift'; alpha.el.hidden = prop !== 'scale';
          const tt = tau.value, al = alpha.value;
          const g = prop === 'shift' ? (t) => W.f(t - tt) : prop === 'rev' ? (t) => W.f(-t) : prop === 'scale' ? (t) => W.f(al * t) : DER[id];
          // formula coefficients
          const pr = { re: new Float64Array(61), im: new Float64Array(61), K: 60 };
          for (let k = 0; k <= 60; k++) {
            const a = c.re[k], b = c.im[k];
            if (prop === 'shift') { pr.re[k] = a * Math.cos(k * tt) + b * Math.sin(k * tt); pr.im[k] = b * Math.cos(k * tt) - a * Math.sin(k * tt); }
            else if (prop === 'rev') { pr.re[k] = a; pr.im[k] = -b; }
            else if (prop === 'scale') { if (k % al === 0) { pr.re[k] = c.re[k / al]; pr.im[k] = c.im[k / al]; } }
            else { pr.re[k] = -k * b; pr.im[k] = k * a; }
          }
          const me = fcoef(g, 20, 2048);
          let err = 0; for (let k = 0; k <= 20; k++) err = Math.max(err, Math.hypot(me.re[k] - pr.re[k], me.im[k] - pr.im[k]));
          const ts = grid(-PI, PI, 600), ym = Math.max(1.2, ...ts.map((t) => Math.abs(g(t))), ...ts.map((t) => Math.abs(W.f(t))));
          A.setView(null, [-ym * 1.1, ym * 1.1]);
          A.fn(W.f, { domain: [-PI, PI], color: 'faint', width: 1.6 });
          A.fn(g, { domain: [-PI, PI], color: 'accent', width: 2.2 });
          A.path(zip(ts, partial(pr, prop === 'diff' ? 40 : 60, ts)), { color: 'orange', width: 1.8, dash: true });
          const K = 16, m0 = Array.from({ length: K + 1 }, (_, k) => Math.hypot(c.re[k], c.im[k])), m1 = Array.from({ length: K + 1 }, (_, k) => Math.hypot(me.re[k], me.im[k]));
          B.setView(null, [0, Math.max(0.1, ...m0, ...m1) * 1.15]);
          B.bars(m0, { x0: 0, color: 'faint', barWidth: 0.9, fillAlpha: 0.6 });
          B.bars(m1, { x0: 0, color: 'accent', barWidth: 0.45 });
          const big = Math.max(...m0, ...m1) * 0.02;
          for (let k = 0; k <= K; k++) {
            if (m0[k] > big) C.dot(k, Math.atan2(c.im[k], c.re[k]), { r: 5, hollow: true, color: 'muted' });
            if (m1[k] > big) C.dot(k, Math.atan2(me.im[k], me.re[k]), { r: 3.2, color: 'accent' });
          }
          info = { err, prop };
        });
        v.readout(() => `Largest difference between the numerically computed coefficients of the transformed signal and the formula, over $k\\le20$: $${v.sci(info.err, 2)}$` + (info.prop === 'diff' ? ' (the triangle’s derivative has jumps, so midpoint sampling limits this to about $10^{-3}$).' : '.'));
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Proposition',
      name: 'Smoothness and spectral decay',
      statement: String.raw`Let $x$ be $2\pi$-periodic.
- If $x,x',\dots,x^{(m-1)}$ are continuous and periodic and $x^{(m)}$ is piecewise continuous (finitely many jumps, otherwise bounded variation), then $|c_k|\le C/|k|^{m+1}$ for $k\ne0$. A jump in $x$ itself ($m=0$) gives $c_k\sim1/k$, a corner ($m=1$) gives $1/k^2$, and so on.
- If $x\in C^\infty$, then $c_k=O(|k|^{-p})$ for every $p$.
- If $x$ extends analytically to the strip $|\Im t|<\sigma$, then $|c_k|\le C_\varepsilon e^{-(\sigma-\varepsilon)|k|}$ for every $\varepsilon>0$ (geometric decay).
Conversely, fast decay of the $c_k$ forces smoothness. Consequently the error of the partial sum $S_N$ decays like $N^{-m-1/2}$ in the mean square for a signal of smoothness $m$.`,
      idea: String.raw`Differentiate $m$ times under the series: by sig-4.7 the coefficients of $x^{(m)}$ are $(jk)^mc_k$. Since $x^{(m)}$ is at least integrable, its coefficients tend to zero (the Riemann–Lebesgue lemma on the circle, rca-5.12), and when it is piecewise continuous with bounded variation, integration by parts once more gives $O(1/|k|)$ for them. Hence $c_k=o(|k|^{-m})$, and in fact $O(|k|^{-m-1})$. For analytic signals shift the integration contour in $c_k=\frac1{2\pi}\int x(t)e^{-jkt}dt$ to $\Im t=\mp\sigma'$ and gain a factor $e^{-\sigma'|k|}$.`,
      caption: String.raw`Five signals, each rescaled to unit power: coefficients $\propto k^{-n}$ for $n=1,2,3,4$ (jump, corner, and two smoother ones) and an analytic one with $c_k=r^{|k|}$. The left panel is the coefficient size on log–log axes (straight lines of slope $-n$; the analytic one bends down), the middle panel the mean-square error of the partial sums against $N$, the right panel the waveforms themselves, visibly smoother as $n$ grows. Switch curves on and off, and move $r$ toward 1 to make the analytic signal sharper.`,
      deps: ['sig-4.7', 'rca-5.12'],
      refs: ['Oppenheim–Willsky §3.5'],
      tags: ['smoothness', 'decay'],
      viz(v) {
        const ORD = [1, 2, 3, 4];
        const col = { 1: 'red', 2: 'orange', 3: 'gold', 4: 'green', a: 'accent' };
        const tg = {}; for (const n of ORD) tg[n] = v.toggle(`$n=${n}$`, true); tg.a = v.toggle('analytic', true);
        const rs = v.slider('analytic ratio $r$', 0.4, 0.95, 0.8, { step: 0.01 });
        const A = v.stage({ x: [1, 200], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'k', ylabel: 'size', height: 300, title: 'coefficient sizes $|c_k|$' });
        const B = v.stage({ x: [1, 200], y: [1e-8, 1], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'N', ylabel: 'RMS', height: 300, title: 'mean-square error of $S_N$ (root)' });
        const C = v.stage({ x: [-PI, PI], y: [-2.6, 2.6], axes: 'box', gutter: true, xlabel: 't', xticks: PI_TICKS, height: 240, full: true, title: 'the five waveforms, each with unit power (apart from the constant)' });
        // odd-harmonic family c_k = a_n (jk)^(-n), k odd; normalised so that sum_k |c_k|^2 = 1
        const KMAX = 6000, norm = {};
        for (const n of ORD) { let s = 0; for (let k = 1; k <= KMAX; k += 2) s += 2 * k ** (-2 * n); norm[n] = 1 / Math.sqrt(s); }
        const tails = {}; for (const n of ORD) { const arr = new Float64Array(KMAX + 2); let s = 0; for (let k = KMAX; k >= 1; k--) { if (k % 2) s += 2 * (norm[n] * k ** -n) ** 2; arr[k - 1] = s; } tails[n] = arr; }
        const cache = {};
        const wave = (n) => (cache[n] ??= (() => { const ts = grid(-PI, PI, 600); return ts.map((t) => { let s = 0; for (let k = 1; k <= 1201; k += 2) s += 2 * norm[n] * k ** -n * Math.cos(k * t - (n * PI) / 2); return [t, s]; }); })());
        let info = null;
        v.render(() => {
          const r = rs.value, kk = grid(1, 200, 199).map((x) => Math.round(x));
          const nrm = 1 / Math.sqrt((2 * r * r) / (1 - r * r)); // the non-constant part has unit power
          const slopes = [];
          for (const n of ORD) if (tg[n].value) {
            const pts = kk.filter((k) => k % 2).map((k) => [k, norm[n] * k ** -n]);
            A.path(pts, { color: col[n], width: 2 }); A.dots(pts, { r: 1.8, color: col[n] });
            const ek = Array.from({ length: 200 }, (_, i) => [i + 1, Math.max(1e-12, Math.sqrt(tails[n][i + 1] ?? 0))]);
            B.path(ek, { color: col[n], width: 2 });
            C.path(wave(n), { color: col[n], width: 1.7 });
            const kA = 11, kB = 101; slopes.push(`$n=${n}$: ${v.fix(Math.log((norm[n] * kB ** -n) / (norm[n] * kA ** -n)) / Math.log(kB / kA), 2)}`);
          }
          if (tg.a.value) {
            const pts = kk.map((k) => [k, nrm * r ** k]);
            A.path(pts, { color: col.a, width: 2 });
            const ek = Array.from({ length: 200 }, (_, i) => { const N = i + 1; return [N, Math.max(1e-12, Math.sqrt(2 * nrm * nrm * r ** (2 * N + 2) / (1 - r * r)))]; });
            B.path(ek, { color: col.a, width: 2 });
            C.path(grid(-PI, PI, 600).map((t) => { let s = 0; for (let k = 1; k <= 400; k++) s += 2 * nrm * r ** k * Math.cos(k * t); return [t, s]; }), { color: col.a, width: 1.7 });
            slopes.push(`analytic: $|c_k|=${v.fix(nrm, 2)}\\,r^k$, decay rate $e^{-${v.fix(-Math.log(r), 3)}k}$`);
          }
          info = { slopes };
        });
        v.legend([['red', '$n=1$ jump'], ['orange', '$n=2$ corner'], ['gold', '$n=3$'], ['green', '$n=4$'], ['accent', 'analytic']]);
        v.readout(() => `Log–log slope of $|c_k|$ between $k=11$ and $101$: ${info.slopes.join('; ')}.\nThe mean-square error of $S_N$ falls with slope $-(n-\\tfrac12)$; the analytic signal's error falls faster than any power.`);
      },
    },
  ],
};
