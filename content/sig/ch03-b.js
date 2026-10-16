// Signals & Systems — Chapter 3 (part b): eigenfunctions, frequency response, difference/differential equations, FIR/IIR, deconvolution, correlation, reverberation
import { KER, kerResp, kerHat, midpoint, stems, conv, arrDiff, CYCLE, drawable, bump, num, errTex } from './ch03.shared.js';

const kerMenu = (ids) => ids.map((id) => ({ value: id, label: KER[id].label }));
const ALL = Object.keys(KER);
const TAU = 2 * Math.PI;
const cmul = ([a, b], [c, d]) => [a * c - b * d, a * d + b * c];
const cdiv = ([a, b], [c, d]) => { const q = c * c + d * d; return [(a * c + b * d) / q, (b * c - a * d) / q]; };
const cabs = ([a, b]) => Math.hypot(a, b);
/** y(t) = (x ∗ h)(t) for a complex-valued x(t) = [re, im]. */
function kerRespC(K, xc, t, n = 500) {
  let re = 0, im = 0;
  for (const [T, a] of K.deltas) { const z = xc(t - T); re += a * z[0]; im += a * z[1]; }
  const h = K.T / n;
  if (K.T > 0) for (let i = 0; i < n; i++) { const tau = (i + 0.5) * h, w = K.f(tau) * h, z = xc(t - tau); re += w * z[0]; im += w * z[1]; }
  return [re, im];
}

export default {
  collection: 'sig',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Theorem',
      name: 'Complex exponentials are eigenfunctions of LTI systems',
      statement: String.raw`Let an LTI system have a (causal, for definiteness) impulse response $h$, and let $s\in\C$ be a number for which $H(s)=\int_{-\infty}^{\infty}h(\tau)e^{-s\tau}\,d\tau$ converges absolutely. Then the input $x(t)=e^{st}$, applied for all time, produces the output
$$y(t)=H(s)\,e^{st},$$
the same exponential multiplied by the complex number $H(s)$. In discrete time, $x[n]=z^n$ gives $y[n]=H(z)z^n$ with $H(z)=\sum_k h[k]z^{-k}$. If the exponential is only switched on at $t=0$, the output approaches $H(s)e^{st}$ as the transient dies out, provided $h$ decays.`,
      idea: String.raw`Plug the exponential into the convolution integral (sig-3.2): $y(t)=\int h(\tau)e^{s(t-\tau)}d\tau=e^{st}\int h(\tau)e^{-s\tau}d\tau$, and the second factor does not depend on $t$. So $e^{st}$ is an eigenfunction of every LTI system, with eigenvalue $H(s)$, just as an eigenvector of a matrix is only scaled. Time invariance does the work: shifting the input by $\tau$ multiplies $e^{st}$ by the constant $e^{-s\tau}$. With $s=j\omega$ (the sinusoids of sig-1.5) the eigenvalue $H(j\omega)$ is the frequency response (sig-3.10), and expanding signals in exponentials turns convolution into multiplication, the core idea of Fourier analysis.`,
      caption: String.raw`Left: the complex plane. The input phasor $x(t)=e^{st}$ (blue) and the output $y(t)$ (purple) are computed by convolving with the kernel you choose; the green arrow is $H(s)$ computed from $h$. Right: real parts of $x$ and $y$. Play the animation or let it loop. With *steady state* the output is exactly $H(s)x(t)$ at every instant: purple is blue rotated and scaled by $H$. Switch to *switch on at $t=0$* to see the transient, when the ratio $y/x$ has not yet reached $H(s)$. Move $\sigma$ and $\omega$ to try other exponentials.`,
      deps: ['sig-3.2', 'sig-1.5'],
      refs: ['Oppenheim–Willsky §3.2'],
      tags: ['eigenfunctions', 'frequency response'],
      viz(v) {
        const ks = v.select('system', kerMenu(ALL), 'rc');
        const sg = v.slider('$\\sigma$ (growth rate)', -0.25, 0.15, 0, { step: 0.01 });
        const om = v.slider('$\\omega$ (frequency)', 0.2, 6, 1.5, { step: 0.05 });
        const on = v.toggle('switch on at $t=0$ (shows the transient)', false);
        const TW = 8;
        const A = v.stage({ x: [-3, 3], y: [-3, 3], equal: true, axes: true, height: 330, title: 'complex plane: $x(t)=e^{st}$ and $y(t)$' });
        const B = v.stage({ x: [0, TW], y: [-3, 3], axes: 'box', gutter: true, xlabel: 't', height: 330, title: 'real parts $\\Re x$ and $\\Re y$' });
        let cache = { key: '' };
        const calc = () => {
          const key = `${ks.value}|${sg.value}|${om.value}|${on.value}`;
          if (cache.key === key) return cache;
          const K = KER[ks.value], s = sg.value, w = om.value;
          const xc = (t) => (on.value && t < 0 ? [0, 0] : [Math.exp(s * t) * Math.cos(w * t), Math.exp(s * t) * Math.sin(w * t)]);
          const Y = []; for (let i = 0; i <= 320; i++) { const t = (TW * i) / 320; Y.push(kerRespC(K, xc, t)); }
          const H = kerHat(K, s, w);
          return (cache = { key, K, Y, H, xc });
        };
        let info = null;
        v.animate((t) => {
          const { K, Y, H, xc } = calc(), s = sg.value, w = om.value, tt = Math.min(TW, t);
          let big = 1.2; for (const y of Y) big = Math.max(big, cabs(y) * 1.1, Math.exp(s * TW) * 1.1);
          const R = Math.min(8, Math.max(2.2, big)); A.setView([-R, R], [-R, R]); B.setView(null, [-R, R]);
          // trails
          const Px = [], Py = [], Qx = [], Qy = [];
          for (let i = 0; i <= 320; i++) { const u = (TW * i) / 320; if (u > tt) break; const x = xc(u); Px.push(x); Py.push(Y[i]); Qx.push([u, x[0]]); Qy.push([u, Y[i][0]]); }
          A.path(Px, { color: 'accent', width: 1.2, alpha: 0.4 }); A.path(Py, { color: 'purple', width: 1.2, alpha: 0.4 });
          const i = Math.min(320, Math.round((tt / TW) * 320)), x = xc(tt), y = Y[i];
          A.arrow(0, 0, x[0], x[1], { color: 'accent', width: 2.8, head: 10 });
          A.arrow(0, 0, y[0], y[1], { color: 'purple', width: 2.8, head: 10 });
          A.arrow(0, 0, H[0], H[1], { color: 'green', width: 2.2, head: 9 }); A.text('H(s)', H[0], H[1] + 0.25 * R / 3, { color: 'green', size: 13, align: 'center' });
          A.text('x', x[0], x[1], { color: 'accent', size: 13, math: true, dx: 8, dy: -8 }); A.text('y', y[0], y[1], { color: 'purple', size: 13, math: true, dx: 8, dy: -8 });
          B.hline(0, { color: 'faint', width: 1 });
          const fx = [], fy = []; for (let j = 0; j <= 320; j++) { const u = (TW * j) / 320; fx.push([u, xc(u)[0]]); fy.push([u, Y[j][0]]); }
          B.path(fx, { color: 'accent', width: 1, alpha: 0.35 }); B.path(fy, { color: 'purple', width: 1, alpha: 0.35 });
          B.path(Qx, { color: 'accent', width: 2.4 }); B.path(Qy, { color: 'purple', width: 2.4 });
          B.vline(tt, { color: 'gold', width: 1, dash: [4, 4] });
          const r = cdiv(y, x);
          info = { K, H, r, tt, err: cabs([r[0] - H[0], r[1] - H[1]]), x, y };
        }, { period: 9, still: 7.5 });
        v.legend([['accent', 'input $x=e^{st}$'], ['purple', 'output $y$'], ['green', '$H(s)$ from $h$']]);
        v.readout(() => {
          const { K, H, r, tt, err } = info, mag = cabs(H), ph = Math.atan2(H[1], H[0]);
          const cf = K.Hc && Math.abs(sg.value) < 1e-9 ? K.Hc(om.value) : null;
          return `$s=${v.fix(sg.value, 2)}+${v.fix(om.value, 2)}j$: $H(s)=${v.fix(H[0], 3)}${H[1] < 0 ? '-' : '+'}${v.fix(Math.abs(H[1]), 3)}j$ ($|H|=${v.fix(mag, 3)}$, $\\angle H=${v.fix(ph, 3)}$)${cf ? `, closed form $${v.fix(cf[0], 3)}${cf[1] < 0 ? '-' : '+'}${v.fix(Math.abs(cf[1]), 3)}j$` : ''}.\nAt $t=${v.fix(tt, 1)}$ the ratio $y/x=${v.fix(r[0], 3)}${r[1] < 0 ? '-' : '+'}${v.fix(Math.abs(r[1]), 3)}j$ differs from $H(s)$ by $${num(err, true)}$` + (on.value ? ' (transient: it tends to $H(s)$ as the kernel runs out).' : '.');
        });
      },
    },
    // ------------------------------------------------------------------ 3.10
    {
      num: '3.10',
      kind: 'Definition',
      name: 'System function and frequency response',
      statement: String.raw`For an LTI system with impulse response $h$ the **system function** is $H(s)=\int h(t)e^{-st}\,dt$ (the Laplace transform of $h$, on the values of $s$ where the integral converges absolutely) and, on the imaginary axis, the **frequency response** $H(j\omega)=\int h(t)e^{-j\omega t}\,dt$. A stable system answers the sinusoid $\cos(\omega t)$ with $|H(j\omega)|\cos(\omega t+\angle H(j\omega))$: amplitude scaled by the **magnitude response**, phase shifted by the **phase response**. For a real $h$, $H(-j\omega)=\overline{H(j\omega)}$.`,
      idea: String.raw`By sig-3.9, $e^{j\omega t}$ is mapped to $H(j\omega)e^{j\omega t}$. A real cosine is half the sum of $e^{j\omega t}$ and its conjugate, and by linearity (sig-2.2) and $H(-j\omega)=\overline{H(j\omega)}$ the output is $\Re\big(H(j\omega)e^{j\omega t}\big)=|H|\cos(\omega t+\angle H)$. So $H$ is measurable in a laboratory by sweeping a sinusoid and recording amplitude and phase, and is also computable as a transform of $h$; the two must agree, which is what the figure checks.`,
      caption: String.raw`Choose a system and drag the gold handle along the frequency axis. Top: the sinusoid $\cos\omega t$ (dashed) and the output obtained by convolving with $h$; a least-squares fit of that output gives a measured amplitude and phase. Middle and bottom: the magnitude and phase curves computed as the transform of $h$ (lines), with the points you have measured by dragging (dots). They sit on the curves. *Clear points* starts a new sweep.`,
      deps: ['sig-3.9'],
      refs: ['Oppenheim–Willsky §3.2'],
      tags: ['frequency response', 'transform'],
      viz(v) {
        const ks = v.select('system', kerMenu(ALL), 'res');
        const WM = 10;
        const A = v.stage({ x: [0, 8], y: [-2, 2], axes: 'box', gutter: true, xlabel: 't', full: true, height: 170, title: 'input $\\cos\\omega t$ and output (convolved with $h$)' });
        const B = v.stage({ x: [0, WM], y: [0, 2], axes: 'box', gutter: true, full: true, height: 170, xlabel: 'ω', title: 'magnitude $|H(j\\omega)|$' });
        const C = v.stage({ x: [0, WM], y: [-3.4, 3.4], axes: 'box', gutter: true, full: true, height: 170, xlabel: 'ω', title: 'phase $\\angle H(j\\omega)$', yticks: [[-3.14159, '−π'], [0, '0'], [3.14159, 'π']] });
        let pts = [], lastKey = '';
        v.button('Clear points', () => { pts = []; });
        let curve = { key: '' };
        const getCurve = () => {
          if (curve.key === ks.value) return curve;
          const K = KER[ks.value], M = [], P = []; let top = 1.2;
          for (let i = 0; i <= 200; i++) { const w = (WM * i) / 200, [re, im] = kerHat(K, 0, w, 900); M.push([w, Math.hypot(re, im)]); top = Math.max(top, Math.hypot(re, im) * 1.15); P.push(Math.abs(Math.hypot(re, im)) < 1e-9 ? null : [w, Math.atan2(im, re)]); }
          const Pb = []; for (let i = 0; i < P.length; i++) { if (P[i] && P[i - 1] && Math.abs(P[i][1] - P[i - 1][1]) > 3) Pb.push(null); Pb.push(P[i]); }
          pts = []; return (curve = { key: ks.value, M, P: Pb, top });
        };
        const hd = B.handle(2.5, 1, { color: 'gold', r: 7, constrain: (x) => [Math.max(0.05, Math.min(WM - 0.05, x)), mag(x)] });
        const mag = (w) => { const [re, im] = kerHat(KER[ks.value], 0, Math.max(0.05, w), 700); return Math.hypot(re, im); };
        let info = null;
        v.render(() => {
          const c = getCurve(), K = KER[ks.value], w = hd.x;
          hd.set(w, mag(w));
          // measure: y = ∫ h(τ) cos(ω(t−τ)) dτ, fitted to a cos ωt + b sin ωt on [0, 8]
          const ts = [], ys = []; let sc = 0, ss = 0, scc = 0, sss = 0, scs = 0, sy_c = 0, sy_s = 0;
          for (let i = 0; i <= 160; i++) { const t = i * 0.05, y = kerResp(K, (u) => Math.cos(w * u), t, 700); ts.push(t); ys.push(y); const co = Math.cos(w * t), si = Math.sin(w * t); scc += co * co; sss += si * si; scs += co * si; sy_c += y * co; sy_s += y * si; }
          const det = scc * sss - scs * scs, a = (sy_c * sss - sy_s * scs) / det, b = (sy_s * scc - sy_c * scs) / det;
          const amp = Math.hypot(a, b), ph = Math.atan2(-b, a);
          const key = `${ks.value}|${w.toFixed(3)}`;
          if (key !== lastKey) { lastKey = key; pts.push([w, amp, ph]); if (pts.length > 60) pts.shift(); }
          let ym = 1.5; for (const y of ys) ym = Math.max(ym, Math.abs(y) * 1.15); A.setView(null, [-ym, ym]);
          A.hline(0, { color: 'faint', width: 1 });
          A.fn((t) => Math.cos(w * t), { color: 'gold', width: 1.4, dash: [4, 4], n: 400 });
          A.path(ts.map((t, i) => [t, ys[i]]), { color: 'purple', width: 2.6 });
          B.setView(null, [0, c.top]); B.hline(0, { color: 'faint', width: 1 });
          B.path(c.M, { color: 'ink', width: 1.8 }); for (const p of pts) B.dot(p[0], p[1], { r: 3.4, color: 'green' });
          C.hline(0, { color: 'faint', width: 1 }); C.path(c.P, { color: 'ink', width: 1.8 }); for (const p of pts) C.dot(p[0], p[2], { r: 3.4, color: 'green' });
          C.vline(w, { color: 'gold', width: 1, dash: [4, 4] });
          const [re, im] = kerHat(K, 0, w, 1200);
          info = { w, amp, ph, Hm: Math.hypot(re, im), Hp: Math.atan2(im, re), K };
        });
        v.legend([['gold', 'input $\\cos\\omega t$', { dash: true }], ['purple', 'measured output'], ['ink', 'transform of $h$'], ['green', 'measured points', { dot: true }]]);
        v.readout(() => `$\\omega=${v.fix(info.w, 2)}$: measured from the output, amplitude $${v.fix(info.amp, 4)}$ and phase $${v.fix(info.ph, 4)}$; from the transform of $h$, $|H|=${v.fix(info.Hm, 4)}$ and $\\angle H=${v.fix(info.Hp, 4)}$` + (info.K.Hc ? `; closed form $|H|=${v.fix(cabs(info.K.Hc(info.w)), 4)}$.` : '.') + `\nAmplitude gap $${num(Math.abs(info.amp - info.Hm), true)}$ (quadrature and fit error).`);
      },
    },
    // ------------------------------------------------------------------ 3.11
    {
      num: '3.11',
      kind: 'Method',
      name: 'Linear constant-coefficient differential equations',
      statement: String.raw`A causal LTI system described by $y''+a_1y'+a_0y=b_1x'+b_0x$ (the second-order case; order $n$ works the same way) with the system initially at rest has impulse response $h=b_0g+b_1g'$, where $g$ solves the homogeneous equation $g''+a_1g'+a_0g=0$ for $t>0$ with $g(0)=0$, $g'(0)=1$. The response to any input is $y=x*h$, which solves the equation with zero initial conditions. $h$ is a sum of exponentials $e^{pt}$ over the roots $p$ of the characteristic polynomial $p^2+a_1p+a_0$, and the system is BIBO stable exactly when all roots have negative real part (sig-3.6).`,
      idea: String.raw`The homogeneous solutions are exponentials given by the characteristic polynomial (ode-3.13). The impulse $\delta$ at $t=0$ makes $g'$ jump by $1$ and leaves $g$ continuous, so for $t>0$ it just starts the homogeneous solution with those initial values; with $b_1\ne0$ the right side contains $b_1\delta$, handled by $h=b_0g+b_1g'$. At rest the system is linear and time-invariant (incremental linearity, sig-2.11, with zero initial state), so sig-3.2 gives $y=x*h$. The figure integrates the equation with a Runge–Kutta method, from the state-space form, and separately convolves with $h$.`,
      caption: String.raw`Set the coefficients with the sliders (the leading coefficient is $1$) and choose a drive. The solver's output (solid) and the output obtained by convolving the drive with the computed impulse response (dashed) lie on top of each other. The poles are shown in the readout: make $a_1$ negative and a pole moves into the right half-plane, $h$ grows, and the output blows up.`,
      deps: ['sig-3.3', 'sig-2.11', 'ode-3.13'],
      refs: ['Oppenheim–Willsky §2.4', 'Lathi ch. 2'],
      tags: ['differential equations', 'impulse response'],
      viz(v) {
        const a1 = v.slider('$a_1$', -0.4, 4, 0.6, { step: 0.05 });
        const a0 = v.slider('$a_0$', 0.5, 12, 4, { step: 0.1 });
        const b0 = v.slider('$b_0$', -3, 3, 4, { step: 0.1 });
        const b1 = v.slider('$b_1$', -2, 2, 0, { step: 0.05 });
        const ins = v.select('drive', [{ value: 'pulse', label: 'pulse' }, { value: 'sq', label: 'square wave' }, { value: 'sine', label: 'sine burst' }, { value: 'ramp', label: 'ramp' }], 'pulse');
        const X = { pulse: (t) => (t >= 1 && t < 2.5 ? 1 : 0), sq: (t) => (t >= 0.5 && t < 9 ? (Math.floor((t - 0.5) / 1.6) % 2 === 0 ? 1 : -1) * 0.8 : 0), sine: (t) => (t >= 0.5 && t < 7 ? Math.sin(2.2 * (t - 0.5)) : 0), ramp: (t) => (t >= 1 && t < 5 ? (t - 1) / 4 : t >= 5 && t < 5.4 ? 1 - (t - 5) / 0.4 : 0) };
        const W = { x: [0, 10], axes: 'box', gutter: true, xlabel: 't', full: true, height: 150 };
        const A = v.stage({ ...W, y: [-1.3, 1.3], title: 'drive $x(t)$' });
        const B = v.stage({ ...W, y: [-1, 1], title: 'impulse response $h=b_0g+b_1g\'$ from the homogeneous solution' });
        const C = v.stage({ ...W, y: [-1, 1], title: 'output at rest: Runge–Kutta solution vs $x*h$' });
        const rk = (c1, c0, x, f, T, dt) => { // z'' = x − c1 z' − c0 z, state [z, z'], outputs the list of [z, z']
          const n = Math.round(T / dt), out = new Array(n + 1); let s = [0, 0];
          const F = (q, xv) => [q[1], xv - c1 * q[1] - c0 * q[0]];
          for (let i = 0; i <= n; i++) {
            out[i] = s; const t = i * dt, k1 = F(s, x(t)), s2 = [s[0] + (dt / 2) * k1[0], s[1] + (dt / 2) * k1[1]], k2 = F(s2, x(t + dt / 2)), s3 = [s[0] + (dt / 2) * k2[0], s[1] + (dt / 2) * k2[1]], k3 = F(s3, x(t + dt / 2)), s4 = [s[0] + dt * k3[0], s[1] + dt * k3[1]], k4 = F(s4, x(t + dt));
            s = [s[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), s[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
          }
          return out;
        };
        let info = null;
        v.render(() => {
          const c1 = a1.value, c0 = a0.value, B0 = b0.value, B1 = b1.value, x = X[ins.value], dt = 0.005;
          // homogeneous solution from (g, g') = (0, 1): the same integrator with no drive and the initial state set by a unit kick
          const n = 2000, g = new Array(n + 1); { let s = [0, 1]; const F = (q) => [q[1], -c1 * q[1] - c0 * q[0]]; for (let i = 0; i <= n; i++) { g[i] = s; const k1 = F(s), k2 = F([s[0] + (dt / 2) * k1[0], s[1] + (dt / 2) * k1[1]]), k3 = F([s[0] + (dt / 2) * k2[0], s[1] + (dt / 2) * k2[1]]), k4 = F([s[0] + dt * k3[0], s[1] + dt * k3[1]]); s = [s[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), s[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])]; } }
          const h = g.map((q) => B0 * q[0] + B1 * q[1]);
          const st = rk(c1, c0, x, null, 10, dt), ys = st.map((q) => B0 * q[0] + B1 * q[1]);
          // convolution y = ∫ h(τ) x(t − τ) dτ on every 4th point
          const P = [], Q = []; let err = 0, ym = 1, hm = 0.5;
          for (let i = 0; i <= n; i += 4) {
            const t = i * dt; let s = 0; for (let j = 0; j <= i; j += 2) s += h[j] * x(t - j * dt) * 2 * dt - (j === 0 ? h[0] * x(t) * dt : 0);
            P.push([t, ys[i]]); Q.push([t, s]); err = Math.max(err, Math.abs(ys[i] - s)); ym = Math.max(ym, Math.abs(ys[i]) * 1.15, Math.abs(s) * 1.15); hm = Math.max(hm, Math.abs(h[i]) * 1.15);
          }
          ym = Math.min(ym, 30); hm = Math.min(hm, 30);
          A.hline(0, { color: 'faint', width: 1 }); A.fn(x, { color: 'orange', width: 2.4, n: 800 });
          B.setView(null, [-hm, hm]); B.hline(0, { color: 'faint', width: 1 }); B.clip(() => B.path(h.filter((_, i) => i % 4 === 0).map((q, i) => [i * 4 * dt, q]), { color: 'teal', width: 2.4 }));
          C.setView(null, [-ym, ym]); C.hline(0, { color: 'faint', width: 1 });
          C.clip(() => { C.path(P, { color: 'accent', width: 2.6 }); C.path(Q, { color: 'ink', width: 1.6, dash: [5, 4] }); });
          const disc = c1 * c1 - 4 * c0, re = -c1 / 2, im = disc < 0 ? Math.sqrt(-disc) / 2 : 0, r1 = disc >= 0 ? (-c1 + Math.sqrt(disc)) / 2 : null, r2 = disc >= 0 ? (-c1 - Math.sqrt(disc)) / 2 : null;
          info = { err, disc, re, im, r1, r2, stable: Math.max(re, r1 ?? -Infinity) < 0 };
        });
        v.legend([['orange', 'drive $x$'], ['teal', '$h$'], ['accent', 'RK4 solution'], ['ink', '$x*h$', { dash: true }]]);
        v.readout(() => `Characteristic polynomial $p^2+${v.fix(a1.value, 2)}p+${v.fix(a0.value, 2)}$: roots ${info.disc < 0 ? `$${v.fix(info.re, 3)}\\pm${v.fix(info.im, 3)}j$ (decaying oscillation at $\\omega=${v.fix(info.im, 2)}$)` : `$${v.fix(info.r1, 3)}$ and $${v.fix(info.r2, 3)}$`}: ${info.stable ? '**stable**' : '**not stable**, $h$ grows'}.\nSolver vs convolution: $\\max|y_{\\rm RK4}-x*h|=${errTex(info.err)}$ (discretisation error).`);
      },
    },
    // ------------------------------------------------------------------ 3.12
    {
      num: '3.12',
      kind: 'Definition',
      name: 'FIR and IIR systems',
      statement: String.raw`A discrete-time LTI system is **FIR** (finite impulse response) if $h[n]=0$ outside a finite set of indices, i.e. $y[n]=\sum_{k=0}^{M-1}b_kx[n-k]$, with no feedback; it is **IIR** (infinite impulse response) if $h$ has infinite support, as happens for recursive equations $y[n]=a\,y[n-1]+\sum_kb_kx[n-k]$. An FIR system is always BIBO stable ($\sum|h|$ is a finite sum). The recursive system with $b_0=1$ and $b_k=0$ otherwise has $h[n]=a^n$ for $n\ge0$ and is stable exactly when $|a|<1$.`,
      idea: String.raw`Run the difference equation on $\delta[n]$ (sig-3.1): without feedback the input sample leaves the delay line after $M$ steps and $h$ stops, while with feedback the output is fed back into the sum, so an impulse keeps echoing, each echo scaled by $a$ (the equations of sig-2.10 are the first examples). A decaying IIR response can be cut off after $L$ taps with an error of order $|a|^L$, which is how IIR filters are approximated by FIR ones; but a response with $|a|\ge1$ cannot be truncated without changing the system, and it is unstable.`,
      caption: String.raw`Choose the number of taps $M$ of the moving-average part and switch the feedback on or off with a coefficient $a$. Top: $h[n]$ (stems) from running the equation on an impulse, with the FIR truncation to $L$ taps (hollow rings, orange). Bottom: a noisy price-like series filtered by the recursive system and by its $L$-tap truncation. With feedback off, $h$ stops by itself; with feedback on, it rings on forever.`,
      deps: ['sig-2.10', 'sig-3.1'],
      refs: ['Oppenheim–Willsky §2.4'],
      tags: ['FIR', 'IIR'],
      viz(v) {
        const M = v.slider('taps $M$ of the moving average', 1, 10, 3, { step: 1, int: true });
        const fb = v.toggle('feedback on', true);
        const a = v.slider('feedback coefficient $a$', -1.1, 1.1, 0.8, { step: 0.01 });
        const L = v.slider('truncate to $L$ taps', 1, 30, 12, { step: 1, int: true });
        const NH = 31, NP = 90;
        const rng = v.rng(7); const price = []; { let p = 0; for (let n = 0; n < NP; n++) { p += rng.normal() * 0.35 + 0.02; price.push(p + 0.45 * Math.sin(n / 7)); } }
        const A = v.stage({ x: [-1, NH], y: [-1.2, 1.2], axes: 'box', gutter: true, xlabel: 'n', full: true, height: 190, title: 'impulse response $h[n]$' });
        const B = v.stage({ x: [0, NP - 1], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'n', full: true, height: 210, title: 'noisy series through the recursive system and its truncation' });
        const run = (x, aa, m) => { const y = new Array(x.length).fill(0); for (let n = 0; n < x.length; n++) { let s = 0; for (let k = 0; k < m; k++) s += (x[n - k] ?? 0) / m; y[n] = s + aa * (y[n - 1] ?? 0); } return y; };
        let info = null;
        v.render(() => {
          const m = M.value, aa = fb.value ? a.value : 0, l = L.value;
          a.el.hidden = !fb.value;
          const d = new Array(400).fill(0); d[0] = 1; const h = run(d, aa, m);
          const hl = h.map((q, n) => (n < l ? q : 0));
          let top = 1.2; for (let n = 0; n < NH; n++) top = Math.max(top, Math.abs(h[n]) * 1.15);
          top = Math.min(top, 6); A.setView(null, [-top, top]); A.hline(0, { color: 'faint', width: 1 });
          A.clip(() => { stems(A, h.slice(0, NH).map((q, n) => [n, q]), { color: 'accent' }); for (let n = 0; n < NH; n++) if (n < l) A.dot(n, hl[n], { r: 6, hollow: true, color: 'orange', width: 1.8 }); });
          A.vband(l - 0.5, NH, { color: 'faint', alpha: 0.12 });
          const y = run(price, aa, m), yl = conv(price, hl.slice(0, 60)).slice(0, NP);
          let ym = 1; for (let n = 0; n < NP; n++) ym = Math.max(ym, Math.abs(price[n]) * 1.1, Math.abs(y[n]) * 1.1);
          ym = Math.min(ym, 40); B.setView(null, [-ym, ym]); B.hline(0, { color: 'faint', width: 1 });
          B.clip(() => { B.path(price.map((q, n) => [n, q]), { color: 'muted', width: 1.2, alpha: 0.8 }); B.path(y.map((q, n) => [n, q]), { color: 'accent', width: 2.4 }); B.path(yl.map((q, n) => [n, q]), { color: 'orange', width: 1.6, dash: [5, 4] }); });
          let nz = 0; for (let n = 0; n < 400; n++) if (Math.abs(h[n]) > 1e-12) nz = n + 1;
          let sum = 0; for (let n = 0; n < 400; n++) sum += Math.abs(h[n]);
          let tail = 0; for (let n = l; n < 400; n++) tail += Math.abs(h[n]);
          info = { nz, sum, tail, aa, m, l, ylErr: arrDiff(y, yl) };
        });
        v.legend([['accent', '$h$ / recursive output'], ['orange', 'truncation to $L$ taps', { dot: true }], ['muted', 'input series']]);
        v.readout(() => (info.aa === 0 ? `**FIR**: $h[n]=\\tfrac1{${info.m}}$ for $0\\le n<${info.m}$ and $0$ afterwards; last nonzero tap $n=${info.nz - 1}$; $\\sum|h|=${v.fix(info.sum, 3)}$ (finite, so stable). The truncation to $L=${info.l}$ taps is ${info.l >= info.m ? 'exact (it keeps every nonzero tap)' : 'lossy'}.` : `**IIR**: $h[n]$ is nonzero for every $n\\ge${info.m - 1}$; its tail decays by the factor $a=${v.fix(info.aa, 2)}$ per sample${Math.abs(info.aa) >= 1 ? ' — not decaying: $\\sum|h|$ diverges, **unstable**' : `, $\\sum|h|\\approx${v.fix(info.sum, 3)}$ (stable)`}. Cutting after $L=${info.l}$ taps discards a tail of total size $${num(info.tail, true)}$ and changes the output by at most $${num(info.ylErr, true)}$ on this series.`));
      },
    },
    // ------------------------------------------------------------------ 3.13
    {
      num: '3.13',
      kind: 'Method',
      name: 'Inverse systems and deconvolution',
      statement: String.raw`An LTI system with impulse response $h$ has an LTI inverse $g$ when $h*g=\delta$, and then $x=g*(h*x)$ recovers every input from its output. For the causal FIR system $y[n]=x[n]+a\,x[n-D]$ the inverse is the recursion $\hat x[n]=y[n]-a\,\hat x[n-D]$, with impulse response $g[kD]=(-a)^k$, which is BIBO stable if and only if $|a|<1$. If $|a|\ge1$ the exact inverse exists but is unstable, and any noise added to $y$ is amplified without bound.`,
      idea: String.raw`Invertibility (sig-2.5) of an LTI system amounts to solving $h*g=\delta$. For the echo, convolving $x+ax[n-D]$ with $g$ and matching coefficients gives the geometric series $g=\sum_k(-a)^k\delta[n-kD]$, which is absolutely summable iff $|a|<1$ (sig-3.4 lets us regroup the cascade). In the presence of noise $w$, the recovered signal is $\hat x=x+g*w$, so the noise is multiplied by a filter of energy $\sum g^2=1/(1-a^2)$ per echo: the closer $|a|$ is to $1$ the worse the deconvolution, and for $|a|\ge1$ it fails altogether.`,
      caption: String.raw`Top: a clean signal and its echoed version (plus noise, if you add some). Bottom: the signal recovered by the inverse recursion, against the original. With no noise and $|a|<1$ the recovery is perfect. Add a little noise and move $a$ toward $1$: the recovered signal becomes dominated by noise, and the measured noise gain follows the formula. Past $|a|=1$ the recursion diverges.`,
      deps: ['sig-3.4', 'sig-2.5'],
      refs: ['Oppenheim–Willsky §2.3'],
      tags: ['inverse system', 'deconvolution'],
      viz(v) {
        const a = v.slider('echo strength $a$', -1.15, 1.15, 0.7, { step: 0.01 });
        const Dd = v.select('echo delay $D$', [{ value: 1, label: '1' }, { value: 4, label: '4' }, { value: 8, label: '8' }], 4);
        const sd = v.slider('noise level $\\sigma$', 0, 0.12, 0, { step: 0.002 });
        const bt = v.button('New noise', () => { seed++; });
        let seed = 3;
        const N = 96;
        const x0 = Array.from({ length: N }, (_, n) => (n >= 10 && n < 24 ? 1 : 0) + (n >= 40 && n < 70 ? 0.8 * Math.sin((Math.PI * (n - 40)) / 30) ** 2 : 0) - (n >= 78 && n < 84 ? 0.7 : 0));
        const A = v.stage({ x: [0, N - 1], y: [-1.2, 2], axes: 'box', gutter: true, xlabel: 'n', full: true, height: 190, title: 'original $x[n]$ and the observed $y[n]=x[n]+a\\,x[n-D]+{\\rm noise}$' });
        const B = v.stage({ x: [0, N - 1], y: [-1.2, 2], axes: 'box', gutter: true, xlabel: 'n', full: true, height: 210, title: 'recovered $\\hat x$ (inverse recursion) vs original' });
        let info = null;
        v.render(() => {
          const aa = a.value, D = Dd.value, r = v.rng(seed), noise = Array.from({ length: N }, () => r.normal() * sd.value);
          const y = x0.map((q, n) => q + aa * (x0[n - D] ?? 0) + noise[n]);
          const xh = new Array(N).fill(0); for (let n = 0; n < N; n++) xh[n] = y[n] - aa * (xh[n - D] ?? 0);
          let ym = 2; for (let n = 0; n < N; n++) ym = Math.max(ym, Math.abs(xh[n]) * 1.1, Math.abs(y[n]) * 1.1); ym = Math.min(ym, 60);
          A.setView(null, [-ym * 0.6, ym]); B.setView(null, [-ym * 0.6, ym]);
          A.hline(0, { color: 'faint', width: 1 }); B.hline(0, { color: 'faint', width: 1 });
          A.path(x0.map((q, n) => [n, q]), { color: 'muted', width: 1.4, dash: [5, 4] }); A.path(y.map((q, n) => [n, q]), { color: 'purple', width: 2.4 });
          B.path(x0.map((q, n) => [n, q]), { color: 'muted', width: 1.4, dash: [5, 4] });
          B.clip(() => B.path(xh.map((q, n) => [n, q]), { color: 'green', width: 2.4 }));
          let e2 = 0, e0 = 0; for (let n = 0; n < N; n++) { e0 = Math.max(e0, Math.abs(xh[n] - x0[n])); e2 += (xh[n] - x0[n]) ** 2; }
          // predicted rms noise gain: (1/N) Σ_n Σ_{k ≤ n/D} a^{2k}
          let g2 = 0; for (let n = 0; n < N; n++) { let s = 0; for (let k = 0; k <= Math.floor(n / D); k++) s += aa ** (2 * k); g2 += s; }
          info = { rms: Math.sqrt(e2 / N), pred: Math.sqrt(g2 / N), e0, aa, D };
        });
        v.legend([['muted', 'original', { dash: true }], ['purple', 'observed'], ['green', 'recovered']]);
        v.readout(() => `The inverse is $g[kD]=(-a)^k$, whose zeros/poles sit at modulus $|a|^{1/D}=${v.fix(Math.abs(info.aa) ** (1 / info.D), 3)}$: ${Math.abs(info.aa) < 1 ? 'stable' : '**unstable**'}.\n` + (sd.value === 0 ? `Without noise the recovery error is $${errTex(info.e0)}$ (rounding), growing without limit once $|a|>1$.` : `With noise $\\sigma=${v.fix(sd.value, 3)}$: rms error of $\\hat x$ is $${v.fix(info.rms, 3)}$, i.e. a noise gain of $${v.fix(info.rms / sd.value, 2)}$ (the theory for these $N$ samples predicts $${v.fix(info.pred, 2)}$).`));
      },
    },
    // ------------------------------------------------------------------ 3.14
    {
      num: '3.14',
      kind: 'Definition',
      name: 'Correlation as convolution with a time-reversed signal',
      statement: String.raw`The **cross-correlation** of a recording $r$ with a template $s$ is $c[m]=\sum_n r[n]\,s[n-m]$, the inner product of $r$ with the template slid to lag $m$ (sig-1.12). It equals the convolution of $r$ with the time-reversed template, $c=r*\tilde s$ where $\tilde s[n]=s[-n]$. If $r=A\,s[\cdot-p]+w$ with white noise $w$ of variance $\sigma^2$, the linear filter that maximises the output signal-to-noise ratio at the lag $p$ is exactly the one with impulse response $\tilde s$ (the **matched filter**), and the peak value is then $A\,E_s$ with $E_s=\sum s^2$, against noise of standard deviation $\sigma\sqrt{E_s}$.`,
      idea: String.raw`Reading $\sum_n r[n]s[n-m]$ as $\sum_n r[n]\tilde s[m-n]$ shows the identity with convolution (sig-3.1) by the substitution $k=-(n-m)$. At the true lag the template lines up with its copy and the products add up to the energy $E_s$ (Cauchy–Schwarz says no other alignment, and no other filter of the same energy, can do better). Noise adds independent contributions of variance $\sigma^2E_s$, so the peak-to-noise ratio is $A\sqrt{E_s}/\sigma$: long, energetic templates find weak signals. North derived this optimal filter for radar in 1943 (also found independently by Van Vleck and Middleton).`,
      caption: String.raw`A template is buried in noise at a hidden position (orange marks where the template really is, if you tick *show truth*). Raise the noise: the recording stops showing the template, but the correlation (bottom) still peaks at the right lag as long as the noise level $\sigma$ stays below roughly $A\sqrt{E_s}/3$. Drag the gold handle along the lags to see the template slid there and the products added up; the readout checks that the sliding dot product and the convolution with the reversed template agree. *Wrong template* swaps in a different template and the peak disappears.`,
      deps: ['sig-3.2', 'sig-1.12'],
      refs: ['Lathi ch. 2'],
      credit: 'D. O. North, 1943 (matched filter; independently Van Vleck & Middleton)',
      tags: ['correlation', 'matched filter'],
      viz(v) {
        const NR = 300, LS = 50;
        const tp = v.select('template', [{ value: 'chirp', label: 'chirp' }, { value: 'pulse', label: 'pulse' }, { value: 'doub', label: 'doublet' }], 'chirp');
        const sd = v.slider('noise level $\\sigma$', 0, 3, 1.0, { step: 0.05 });
        const pos = v.slider('hidden position $p$', 20, 230, 140, { step: 1, int: true });
        const wrong = v.toggle('wrong template', false);
        const truth = v.toggle('show truth', false);
        v.button('New noise', () => { seed++; });
        let seed = 11;
        const TPL = {
          chirp: Array.from({ length: LS }, (_, n) => Math.sin(0.25 * n + 0.012 * n * n) * Math.sin((Math.PI * n) / (LS - 1)) ** 0.5),
          pulse: Array.from({ length: LS }, (_, n) => (n >= 10 && n < 40 ? Math.sin((Math.PI * (n - 10)) / 30) : 0)),
          doub: Array.from({ length: LS }, (_, n) => (n < 25 ? 1 : -1) * Math.sin((Math.PI * n) / (LS - 1)) ** 2),
        };
        const A = v.stage({ x: [0, NR], y: [-4, 4], axes: 'box', gutter: true, xlabel: 'n', full: true, height: 150, title: 'recording $r[n]$ = hidden template + noise' });
        const T = v.stage({ x: [0, LS], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 'n', height: 140, title: 'template $s[n]$ (what we look for)' });
        const C = v.stage({ x: [0, NR], y: [-30, 30], axes: 'box', gutter: true, xlabel: 'lag m', full: true, height: 190, title: 'correlation $c[m]=\\sum_n r[n]\\,s[n-m]$' });
        const hd = C.handle(100, 0, { color: 'gold', r: 7, constrain: (x) => [Math.max(0, Math.min(NR - LS, Math.round(x))), 0] });
        let info = null;
        v.render(() => {
          const s = TPL[tp.value], Es = s.reduce((q, z) => q + z * z, 0), p = pos.value;
          const r0 = v.rng(seed), r = new Array(NR).fill(0).map(() => r0.normal() * sd.value);
          for (let n = 0; n < LS; n++) r[p + n] += 2 * s[n];
          const use = wrong.value ? TPL[tp.value === 'chirp' ? 'doub' : 'chirp'] : s, Eu = use.reduce((q, z) => q + z * z, 0);
          const lags = NR - LS + 1, direct = new Array(lags), conv2 = conv(r, use.slice().reverse());
          for (let m = 0; m < lags; m++) { let q = 0; for (let n = 0; n < LS; n++) q += r[m + n] * use[n]; direct[m] = q; }
          const viaConv = Array.from({ length: lags }, (_, m) => conv2[m + LS - 1]);
          let pk = 0; for (let m = 0; m < lags; m++) if (direct[m] > direct[pk]) pk = m;
          const lm = hd.x;
          A.hline(0, { color: 'faint', width: 1 });
          if (truth.value) A.vband(p, p + LS, { color: 'orange', alpha: 0.18 });
          A.path(r.map((q, n) => [n, q]), { color: 'ink', width: 1.4 });
          A.path(use.map((q, n) => [lm + n, 2 * q]), { color: 'gold', width: 2.2, alpha: 0.9 });
          T.hline(0, { color: 'faint', width: 1 }); T.path(use.map((q, n) => [n, q]), { color: wrong.value ? 'red' : 'orange', width: 2.4 });
          let cm = 10; for (const q of direct) cm = Math.max(cm, Math.abs(q) * 1.15);
          C.setView(null, [-cm, cm]); C.hline(0, { color: 'faint', width: 1 });
          C.path(direct.map((q, m) => [m, q]), { color: 'accent', width: 2 });
          C.dot(pk, direct[pk], { r: 6, color: 'green', ring: true, label: `peak at ${pk}`, labelPos: 'n' });
          if (truth.value) C.vline(p, { color: 'orange', width: 1.2, dash: [4, 4] });
          hd.set(lm, direct[lm]);
          info = { pk, p, peak: direct[pk], Es, Eu, lagv: direct[lm], lm, dv: arrDiff(direct, viaConv), sd: sd.value, wrongT: wrong.value };
        });
        v.legend([['ink', 'recording'], ['gold', 'template slid to the handle'], ['accent', 'correlation'], ['orange', 'true position']]);
        v.readout(() => `Largest correlation at lag $${info.pk}$` + (truth.value ? ` (true position $${info.p}$: ${info.pk === info.p ? '**found**' : '**missed**'})` : '') + `; value there $${v.fix(info.peak, 2)}$. At the handle ($m=${info.lm}$): $${v.fix(info.lagv, 2)}$.\nSliding dot product vs convolution with the reversed template: largest difference $${errTex(info.dv)}$. ` + (info.wrongT ? 'The wrong template shares little energy with the hidden one, so no lag stands out.' : `For the matched template the expected peak is $2E_s=${v.fix(2 * info.Es, 1)}$, and noise adds a spread of $\\sigma\\sqrt{E_s}=${v.fix(info.sd * Math.sqrt(info.Es), 2)}$ at every lag.`));
      },
    },
    // ------------------------------------------------------------------ 3.15
    {
      num: '3.15',
      kind: 'Phenomenon',
      name: 'Reverberation as convolution with a room response',
      statement: String.raw`A listener in a room hears the source signal $x$ convolved with the room's impulse response $h$ between the source and the listener's position: $y=x*h$ (an LTI model, valid for small signals and a fixed room). $h$ consists of the direct sound followed by ever denser reflections whose strength dies off roughly exponentially; the time for the energy to fall by 60 dB is the **reverberation time** $T_{60}$. For a roughly diffuse field, Sabine's formula estimates $T_{60}\approx 0.161\,V/(S\bar\alpha)$ seconds, with $V$ the room volume in m³, $S$ the wall area in m² and $\bar\alpha$ the average energy absorption coefficient.`,
      idea: String.raw`The impulse response of a room is its echo pattern (sig-3.3): one clap yields the direct sound and its reflections. By the convolution theorem of this chapter, speech is a stack of such claps, so the output is a sum of delayed, scaled copies of the speech, which is why a long $h$ smears words into each other. The figure computes $h$ with the *image method* of Allen and Berkley (1979), which replaces each reflection off a wall by a mirror-image source in a lattice of mirrored rooms, so $h$ is a sum of impulses with delays $d/c$ and gains $\beta^{\#\text{reflections}}/(4\pi d)$. The decay curve is Schroeder's backward integral of $h^2$ (1965).`,
      caption: String.raw`Choose a room, drag the source (orange) and the microphone (blue) in the plan view, and change the wall reflectivity $\beta$. The plan view shows the direct path (green) and the four first reflections off the side walls (blue). Middle: the computed impulse response; bottom: its energy decay curve in dB, with the measured $T_{60}$ and Sabine's estimate. The speaker buttons play a synthetic voice-like clip (made of three buzzed vowels, not a recording) dry and after convolution with the room response: lengthen the decay and the words smear. The room is a bare rectangular box with the same $\beta$ on every wall, so the numbers are an illustration, not a measurement of a real room.`,
      deps: ['sig-3.3'],
      refs: ['Oppenheim–Willsky §2.2'],
      credit: 'Image method: J. B. Allen & D. A. Berkley, 1979; decay curve: M. R. Schroeder, 1965',
      tags: ['reverberation', 'impulse response'],
      viz(v) {
        const SR = 8000, C0 = 343, TMAX = 3;
        const ROOMS = {
          closet: { label: 'closet', d: [1.2, 1.0, 2.2], beta: 0.8, src: [0.4, 0.5], mic: [0.9, 0.6] },
          living: { label: 'living room', d: [5, 4, 2.6], beta: 0.8, src: [1, 1.2], mic: [3.6, 2.8] },
          stairs: { label: 'stairwell', d: [3, 3, 12], beta: 0.9, src: [0.8, 0.8], mic: [2.2, 2.2] },
          hall: { label: 'hall', d: [20, 12, 10], beta: 0.9, src: [4, 6], mic: [13, 7] },
        };
        const sel = v.select('room', Object.entries(ROOMS).map(([value, o]) => ({ value, label: o.label })), 'living', { onChange: (k) => { const R = ROOMS[k]; beta.set(R.beta); hs.set(...R.src); hm.set(...R.mic); } });
        const beta = v.slider('wall reflectivity $\\beta$', 0.5, 0.97, 0.8, { step: 0.01 });
        const A = v.stage({ x: [-1, 6], y: [-1, 5], equal: true, axes: false, height: 300, title: 'plan view (drag the source and the microphone)' });
        const B = v.stage({ x: [0, 0.3], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't (s)', height: 190, title: 'room impulse response $h(t)$' });
        const D = v.stage({ x: [0, 2.5], y: [-70, 3], axes: 'box', gutter: true, xlabel: 't (s)', height: 190, title: 'energy decay (dB)' });
        const dims = () => ROOMS[sel.value].d;
        const clamp = (x, y) => { const [Lx, Ly] = dims(); return [Math.max(0.1, Math.min(Lx - 0.1, x)), Math.max(0.1, Math.min(Ly - 0.1, y))]; };
        const hs = A.handle(...ROOMS.living.src, { color: 'orange', r: 8, label: 'source', labelPos: 'n', constrain: clamp });
        const hm = A.handle(...ROOMS.living.mic, { color: 'accent', r: 8, label: 'mic', labelPos: 'n', constrain: clamp });
        const axisList = (L, s, m, bt) => {
          const maxd = C0 * TMAX, Nn = Math.min(Math.ceil(maxd / (2 * L)) + 1, Math.ceil(Math.log(1e-5) / (2 * Math.log(bt))) + 1), out = [];
          for (let n = -Nn; n <= Nn; n++) for (const q of [0, 1]) out.push([(1 - 2 * q) * s + 2 * n * L - m, Math.abs(n - q) + Math.abs(n)]);
          return out;
        };
        const image = (d, s, m, bt) => {
          const N = Math.round(TMAX * SR), h = new Float32Array(N), X = axisList(d[0], s[0], m[0], bt), Y = axisList(d[1], s[1], m[1], bt), Z = axisList(d[2], s[2], m[2], bt), maxd = C0 * TMAX;
          for (const [dx, rx] of X) for (const [dy, ry] of Y) { const r2 = dx * dx + dy * dy; if (r2 > maxd * maxd) continue; for (const [dz, rz] of Z) { const dd = Math.sqrt(r2 + dz * dz); if (dd > maxd) continue; const refl = rx + ry + rz, amp = bt ** refl / (4 * Math.PI * Math.max(dd, 0.1)); if (amp < 1e-7) continue; const i = Math.round((dd / C0) * SR); if (i < N) h[i] += amp; } }
          return h;
        };
        const voice = () => {
          const n = Math.round(1.3 * SR), out = new Float32Array(n), syl = [[0.05, 0.4, 700, 1200, 120], [0.5, 0.85, 300, 2300, 140], [0.9, 1.25, 500, 900, 110]];
          for (const [t0, t1, f1, f2, f0] of syl) { let ph = 0, a1 = 0, a2 = 0, b1 = 0, b2 = 0; const r1 = Math.exp((-Math.PI * 90) / SR), r2 = Math.exp((-Math.PI * 130) / SR), c1 = 2 * r1 * Math.cos((TAU * f1) / SR), c2 = 2 * r2 * Math.cos((TAU * f2) / SR);
            for (let i = Math.round(t0 * SR); i < Math.round(t1 * SR); i++) { const t = i / SR, env = Math.sin((Math.PI * (t - t0)) / (t1 - t0)) ** 0.6; ph += (f0 * (1 + 0.06 * Math.sin(5 * t))) / SR; ph -= Math.floor(ph); const g = (ph - 0.5) * env; const y1 = g + c1 * a1 - r1 * r1 * a2; a2 = a1; a1 = y1; const y2 = g + c2 * b1 - r2 * r2 * b2; b2 = b1; b1 = y2; out[i] += y1 + 0.6 * y2; } }
          let m = 0; for (const q of out) m = Math.max(m, Math.abs(q)); for (let i = 0; i < n; i++) out[i] *= 0.5 / m; return out;
        };
        const dry = voice();
        let cur = null;
        const fftConv = (a, b) => { const M = v.M; let n = 1; while (n < a.length + b.length) n <<= 1; const ar = new Float64Array(n), ai = new Float64Array(n), br = new Float64Array(n), bi = new Float64Array(n); ar.set(a); br.set(b); M.fft(ar, ai); M.fft(br, bi); for (let i = 0; i < n; i++) { const re = ar[i] * br[i] - ai[i] * bi[i], im = ar[i] * bi[i] + ai[i] * br[i]; ar[i] = re; ai[i] = im; } M.ifft(ar, ai); return Float32Array.from(ar.subarray(0, a.length + b.length - 1)); };
        const nrm = (x, peak = 0.5) => { let m = 0; for (const q of x) m = Math.max(m, Math.abs(q)); const o = new Float32Array(x.length); for (let i = 0; i < x.length; i++) o[i] = (x[i] * peak) / m; return o; };
        v.soundButton('Dry voice-like clip', (snd) => snd.samples(dry, SR, { gain: 0.8 }));
        v.soundButton('Through the room', (snd) => { if (!cur) return; const w = nrm(fftConv(dry, cur.h.subarray(0, Math.min(cur.h.length, Math.round(2.5 * SR))))); snd.samples(w, SR, { gain: 0.8 }); });
        v.render(() => {
          const R = ROOMS[sel.value], d = R.d, bt = beta.value, zs = Math.min(1.5, d[2] / 2), zm = Math.min(1.6, d[2] * 0.55);
          const key = `${sel.value}|${bt}|${hs.x.toFixed(2)},${hs.y.toFixed(2)}|${hm.x.toFixed(2)},${hm.y.toFixed(2)}`;
          if (!cur || cur.key !== key) {
            const h = image(d, [hs.x, hs.y, zs], [hm.x, hm.y, zm], bt), N = h.length, edc = new Float64Array(N); let s = 0;
            for (let i = N - 1; i >= 0; i--) { s += h[i] * h[i]; edc[i] = s; }
            const tot = edc[0], db = (i) => 10 * Math.log10(Math.max(edc[i] / tot, 1e-30));
            // regress the decay curve between −5 and −25 dB
            let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
            for (let i = 0; i < N; i++) { const q = db(i); if (q <= -5 && q >= -25) { const t = i / SR; n++; sx += t; sy += q; sxx += t * t; sxy += t * q; } }
            const slope = n > 5 ? (n * sxy - sx * sy) / (n * sxx - sx * sx) : NaN, t60 = slope < 0 ? -60 / slope : NaN;
            const V = d[0] * d[1] * d[2], S = 2 * (d[0] * d[1] + d[0] * d[2] + d[1] * d[2]), al = 1 - bt * bt, sab = (24 * Math.LN10 / C0) * V / (S * al);
            const dist = Math.hypot(hs.x - hm.x, hs.y - hm.y, zs - zm);
            cur = { key, h, edc, tot, db, t60, sab, slope, dist, N };
          }
          const [Lx, Ly] = d, mg = Math.max(Lx, Ly) * 0.08 + 0.1;
          A.setView([-mg, Lx + mg], [-mg, Ly + mg]);
          A.rect(0, 0, Lx, Ly, { fill: 'accent', fillAlpha: 0.05, color: 'ink', width: 2 });
          const S = [hs.x, hs.y], M = [hm.x, hm.y];
          A.line(S[0], S[1], M[0], M[1], { color: 'green', width: 2.4 });
          const pathVia = (img, wallAxis, wallVal) => { // image source → mic, crossing the wall plane at the reflection point
            const t = (wallVal - img[wallAxis]) / (M[wallAxis] - img[wallAxis]), P = [img[0] + t * (M[0] - img[0]), img[1] + t * (M[1] - img[1])];
            A.path([S, P, M], { color: 'accent', width: 1.4, alpha: 0.75 });
          };
          pathVia([-S[0], S[1]], 0, 0); pathVia([2 * Lx - S[0], S[1]], 0, Lx); pathVia([S[0], -S[1]], 1, 0); pathVia([S[0], 2 * Ly - S[1]], 1, Ly);
          const tMax = 0.3; let hmx = 1e-9; for (let i = 0; i < Math.round(tMax * SR); i++) hmx = Math.max(hmx, Math.abs(cur.h[i]));
          B.hline(0, { color: 'faint', width: 1 });
          const Pb = []; for (let i = 0; i < Math.round(tMax * SR); i++) if (cur.h[i] !== 0) Pb.push([i / SR, cur.h[i] / hmx]);
          for (const [t, q] of Pb) B.line(t, 0, t, q, { color: 'accent', width: 1.2 });
          B.line(cur.dist / C0, 0, cur.dist / C0, 1, { color: 'green', width: 2.4 });
          B.text('direct sound', cur.dist / C0 + 0.005, 0.92, { color: 'green', size: 12, baseline: 'top' });
          const Pd = []; for (let i = 0; i < cur.N; i += 20) Pd.push([i / SR, Math.max(-70, cur.db(i))]);
          D.hline(-60, { color: 'faint', width: 1, dash: [4, 4] }); D.text('−60 dB', 2.45, -58, { color: 'muted', size: 11, align: 'right' });
          D.path(Pd, { color: 'accent', width: 2.4 });
          if (isFinite(cur.t60)) D.line(0, 0, cur.t60, -60, { color: 'orange', width: 1.6, dash: [5, 4] });
          if (isFinite(cur.sab) && cur.sab < 2.5) D.line(0, 0, cur.sab, -60, { color: 'purple', width: 1.6, dash: [2, 3] });
        });
        v.legend([['green', 'direct path / sound'], ['accent', 'reflections / decay'], ['orange', 'measured $T_{60}$ (−5…−25 dB fit)', { dash: true }], ['purple', 'Sabine $T_{60}$', { dash: true }]]);
        v.readout(() => cur ? `Direct sound after $${v.fix((cur.dist / C0) * 1000, 1)}$ ms (path $${v.fix(cur.dist, 2)}$ m at $c=343$ m/s). Measured $T_{60}\\approx${isFinite(cur.t60) ? v.fix(cur.t60, 2) : '—'}$ s from the decay curve; Sabine $0.161V/(S\\bar\\alpha)=${v.fix(cur.sab, 2)}$ s with $\\bar\\alpha=1-\\beta^2=${v.fix(1 - beta.value ** 2, 2)}$. They need not agree: Sabine assumes a diffuse field, which a small bare box is not.` : '');
      },
    },
  ],
};
