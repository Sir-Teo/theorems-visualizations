// Control Theory — Chapter 4: Time-domain response (items 4.1 – 4.5; 4.6 – 4.9 are in ch04-b.js)
import {
  clamp, tf, stepExact, trace, stepInfo, second, mpOfZeta, fx, TAU, proots, xMark,
} from './ch04.shared.js';

import { secondOrderValue, secondOrderMetrics } from './ctrl-source-audit.shared.js';

export default {
  collection: 'ctrl',
  chapter: 4,
  title: 'Time-domain response',
  summary: String.raw`Designers speak in terms of rise time, overshoot, settling time and steady-state error. For the standard second-order system these specifications map neatly onto regions of the complex plane, which turns time-domain wishes into pole locations. Zeros, extra poles and delays modify the picture, and the system type determines which reference signals can be tracked without error — a fact made general by the internal model principle.`,
  items: [
    // ------------------------------------------------------------------ 4.1
    {
      num: '4.1',
      kind: 'Definition',
      name: 'Step-response specifications',
      statement: String.raw`Feed a stable system a unit step $r(t)=1$ for $t\ge0$ and let $y(t)$ be the output, settling at $y_\infty$. The standard specifications are:
(a) the **rise time** $t_r$, the time the response needs to go from $10\,\%$ to $90\,\%$ of $y_\infty$ (some books use $0$ to $100\,\%$);
(b) the **peak time** $t_p$ and the **percent overshoot** $M_p=100\,\dfrac{y_{\max}-y_\infty}{y_\infty}$ when the response exceeds its final value;
(c) the **settling time** $t_s$, the time after which $y$ stays within a tolerance band $|y-y_\infty|\le\delta\,y_\infty$ ($\delta=2\,\%$ or $5\,\%$);
(d) the **steady-state error** $e_\infty=1-y_\infty$ for a unit reference.
Rise time and peak time measure *speed*; overshoot and settling time measure *damping and the quality of the settling*; $e_\infty$ measures *accuracy*.`,
      idea: String.raw`The unit step is the standard test because it is the simplest input that excites every mode of the system at once, and the response to it (sig-3.7) determines the response to any input by superposition. The specifications compress a whole curve into four numbers that a customer can write into a contract. They are *measurements on the curve*, not properties of the transfer function itself: a different tolerance band gives a different $t_s$, and for a high-order system there is no formula, which is why the next results study the second-order case where there is.`,
      caption: String.raw`Choose a system and drag its parameters. The guide lines on the plot mark each specification as it is defined in the statement: the **gold** points are the 10 % and 90 % crossings (rise time), the **red** peak (overshoot and peak time), the **green** band and its last exit (settling time) and the double arrow between the final value and the reference (steady-state error). Hover over the plot to read the curve. For the second-order system the readout also compares the measurements with the textbook formulas; for the loop with proportional control only, no choice of the gain removes the steady-state error.`,
      deps: ['sig-3.7'],
      refs: ['Franklin–Powell §3.4', 'Åström–Murray §6.3'],
      tags: ['step response', 'specifications'],
      scope: String.raw`Defined for stable, essentially monotone-settling responses; the numerical values depend on the chosen band ($2\,\%$ or $5\,\%$) and on the definition of rise time.`,
      viz(v) {
        const sysS = v.select('system', [{ value: 'under', label: 'second order' }, { value: 'offset', label: 'loop with offset' }, { value: 'lag3', label: 'third order' }], 'under', { onChange: () => setup() });
        const zS = v.slider('damping $\\zeta$', 0.1, 1.5, 0.35, { step: 0.01 });
        const wS = v.slider('$\\omega_n$ (rad/s)', 0.5, 4, 1.5, { step: 0.05 });
        const kS = v.slider('loop gain $K$', 0.5, 40, 4, { step: 0.1 });
        const tolS = v.select('band', [{ value: 0.02, label: '±2 %' }, { value: 0.05, label: '±5 %' }], 0.02);
        const setup = () => { const off = sysS.value === 'offset'; kS.el.hidden = !off; zS.el.hidden = off; wS.el.hidden = off; };
        setup();
        const st = v.stage({ x: [0, 10], y: [0, 1.7], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'output y(t)', height: 380, hover: true, full: true });
        let info = null, sys = null, T = 10, fin = 1, hov = null;
        v.render(() => {
          const z = zS.value, wn = wS.value, K = kS.value;
          if (sysS.value === 'under') { sys = second(z, wn); T = clamp(7 / (z * wn), 5, 40); }
          else if (sysS.value === 'offset') { sys = tf([K], [2 + K, 3, 1]); T = 9; }
          else { const a3 = 3 * wn, c = wn * wn, bb = 2 * z * wn; sys = tf([a3 * c], [a3 * c, c + a3 * bb, a3 + bb, 1]); T = clamp(8 / (z * wn), 6, 40); }
          const N = 800, r = stepExact(v.M, sys, T, N);
          fin = sys.num[0] / sys.den[0];
          info = stepInfo(r.t, r.y, fin, tolS.value);
          const ymax = Math.max(1.3, info.ypeak * 1.15);
          st.setView([0, T], [0, ymax]);
          const tol = tolS.value;
          st.hband(fin * (1 - tol), fin * (1 + tol), { color: 'green', alpha: 0.16 });
          st.hline(1, { color: 'muted', dash: [2, 4] });
          st.hline(fin, { color: 'ink', width: 1, alpha: 0.5, dash: [6, 4] });
          st.hline(0.1 * fin, { color: 'faint', width: 1 }); st.hline(0.9 * fin, { color: 'faint', width: 1 });
          trace(st, r.t, r.y, { color: 'accent', width: 3 });
          if (info.tr !== null) {
            const t10 = ((i) => r.t[i])(r.y.findIndex((q) => q >= 0.1 * fin)), t90 = r.t[r.y.findIndex((q) => q >= 0.9 * fin)];
            st.dot(t10, 0.1 * fin, { r: 5, color: 'gold' }); st.dot(t90, 0.9 * fin, { r: 5, color: 'gold' });
            st.measure(t10, 0.2 * fin, t90, 0.2 * fin, `tr = ${fx(info.tr, 2)} s`);
          }
          if (info.tp !== null) {
            st.dot(info.tp, info.ypeak, { r: 6, color: 'red' });
            st.vline(info.tp, { color: 'red', width: 1, dash: [3, 4], alpha: 0.7 });
            st.text(`$M_p=${fx(100 * info.Mp, 1)}\\,\\%,\\ t_p=${fx(info.tp, 2)}$`, info.tp, info.ypeak, { size: 12, color: 'red', dx: 10, dy: -8, align: 'left' });
          }
          if (isFinite(info.ts) && info.ts > 0) { st.vline(info.ts, { color: 'green', width: 2, dash: [5, 3] }); st.text(`$t_s=${fx(info.ts, 2)}$`, info.ts, ymax * 0.88, { size: 12, color: 'green', dx: 6, align: 'left' }); }
          if (Math.abs(1 - fin) > 1e-6) { st.measure(T * 0.93, fin, T * 0.93, 1, `e = ${fx(1 - fin, 3)}`); }
          st.text('reference r = 1', T * 0.99, 1, { size: 11, color: 'muted', align: 'right', dy: -8 });
          const p = st.pointer;
          hov = null;
          if (p && p.inside) {
            const i = clamp(Math.round((p.x / T) * N), 0, N); hov = [r.t[i], r.y[i]];
            st.vline(r.t[i], { color: 'gold', width: 1, alpha: 0.8 }); st.dot(r.t[i], r.y[i], { r: 5, color: 'gold' });
          }
        });
        v.legend([['accent', 'step response y(t)'], ['gold', '10 % and 90 % levels'], ['red', 'peak'], ['green', 'settling band', { area: true }]]);
        v.readout(() => {
          if (!info) return '';
          const z = zS.value, wn = wS.value, under = sysS.value === 'under' && z < 1;
          const wd = wn * Math.sqrt(Math.max(0, 1 - z * z));
          let s = `$y_\\infty=${fx(fin, 3)}$, $e_\\infty=${fx(1 - fin, 3)}$ · $t_r=${fx(info.tr, 2)}$ s · $M_p=${fx(100 * info.Mp, 1)}\\,\\%$ · $t_p=${fx(info.tp, 2)}$ s · $t_s(${tolS.value * 100}\\,\\%)=${fx(info.ts, 2)}$ s`;
          if (under) s += `\nformulas for the second-order system: $M_p=e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}=${fx(100 * mpOfZeta(z), 1)}\\,\\%$ · $t_p=\\pi/\\omega_d=${fx(Math.PI / wd, 2)}$ s · $t_s\\approx 4/(\\zeta\\omega_n)=${fx(4 / (z * wn), 2)}$ s (2 %) · $t_r\\approx1.8/\\omega_n=${fx(1.8 / wn, 2)}$ s (rule of thumb, best near $\\zeta=0.5$)`;
          if (hov) s += `\ncursor: $t=${fx(hov[0], 2)}$, $y=${fx(hov[1], 3)}$`;
          return s;
        });
      },
    },
    // ------------------------------------------------------------------ 4.2
    {
      num: '4.2',
      kind: 'Model',
      name: 'The standard second-order system',
      statement: String.raw`The **standard second-order system** is
$$G(s)=\frac{\omega_n^2}{s^2+2\zeta\omega_ns+\omega_n^2},$$
with **natural frequency** $\omega_n>0$ and **damping ratio** $\zeta$. Its poles are $s=-\zeta\omega_n\pm i\omega_n\sqrt{1-\zeta^2}$. For $0<\zeta<1$ (underdamped) they are a complex pair at distance $\omega_n$ from the origin, making the angle $\beta=\arccos\zeta$ with the negative real axis, and the unit step response is
$$y(t)=1-\frac{e^{-\zeta\omega_nt}}{\sqrt{1-\zeta^2}}\sin(\omega_dt+\beta),\qquad\omega_d=\omega_n\sqrt{1-\zeta^2}.$$
For $\zeta=1$ the poles coincide on the negative real axis (critical damping) and for $\zeta>1$ they are real and distinct (overdamped); for $\zeta=0$ they lie on the imaginary axis (undamped) and for $\zeta<0$ in the right half-plane (unstable).`,
      idea: String.raw`The model is the most general system whose characteristic polynomial has degree two and whose DC gain is one, and it is the building block that higher-order responses are compared with (sig-6.9 treats the same system in the frequency domain). Its two parameters are the polar coordinates of a pole: the radius is $\omega_n$ and the cosine of the angle from the negative real axis is $\zeta$. The real part $-\zeta\omega_n$ is the decay rate of the envelope $e^{-\zeta\omega_nt}$ and the imaginary part is the frequency of the ringing, so the geometry of the pole position *is* the shape of the response.`,
      caption: String.raw`Drag the **gold** pole in the $s$-plane (its mirror image follows) or use the sliders. Radius circles mark $\omega_n$ and rays mark equal damping ratios. The right panel shows the step response with its decaying envelope $1\pm e^{-\zeta\omega_nt}/\sqrt{1-\zeta^2}$. Push the pole to the imaginary axis and beyond, and the response stops decaying and then grows; for $\zeta\ge1$ the two poles are real and the handle disappears (set $\zeta$ with the slider).`,
      deps: ['sig-6.9'],
      refs: ['Franklin–Powell §3.4'],
      tags: ['second-order', 'poles'],
      viz(v) {
        const zS = v.slider('damping $\\zeta$', -0.3, 2, 0.4, { step: 0.01 });
        const wS = v.slider('$\\omega_n$ (rad/s)', 0.5, 4, 2, { step: 0.05 });
        const sp = v.stage({ x: [-5.5, 2], y: [-4.2, 4.2], equal: true, axes: true, height: 380, xlabel: 'Re s', ylabel: 'Im s' });
        const st = v.stage({ x: [0, 12], y: [-0.3, 2.2], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'step response y(t)', height: 380, weight: 1.3 });
        const h = sp.handle(-0.8, 1.83, { color: 'gold', r: 8, label: 'pole', labelPos: 'ne' });
        h.onDrag = () => {
          const w = clamp(Math.hypot(h.x, h.y), 0.5, 4); let zz = clamp(-h.x / w, -0.3, 0.999);
          wS.set(w); zS.set(zz);
        };
        let R = null;
        v.render(() => {
          const z = zS.value, wn = wS.value;
          // polar grid: circles |s| = 1..5, rays at equal ζ
          for (let r = 1; r <= 5; r++) sp.curve((t) => [r * Math.cos(t), r * Math.sin(t)], 0, TAU, { color: 'grid', width: 1 });
          for (const zz of [0.1, 0.3, 0.5, 0.7, 0.9]) {
            const b = Math.acos(zz);
            sp.path([[0, 0], [-5.5 * Math.cos(b), 5.5 * Math.sin(b)]], { color: 'grid', width: 1, dash: [3, 4] });
            sp.path([[0, 0], [-5.5 * Math.cos(b), -5.5 * Math.sin(b)]], { color: 'grid', width: 1, dash: [3, 4] });
            sp.text(`ζ=${zz}`, -3.3 * Math.cos(b), 3.3 * Math.sin(b), { size: 10, color: 'muted', align: 'center', dy: -2 });
          }
          sp.vline(0, { color: 'red', width: 1.5, alpha: 0.5 });
          let poles;
          if (z < 1) {
            const wd = wn * Math.sqrt(1 - z * z); poles = [[-z * wn, wd], [-z * wn, -wd]];
            h.visible = true; h.set(-z * wn, wd);
            const b = Math.acos(clamp(z, -1, 1));
            sp.path([[0, 0], [-z * wn, wd]], { color: 'orange', width: 2 });
            sp.curve((t) => [wn * Math.cos(t), wn * Math.sin(t)], Math.PI - b, Math.PI, { color: 'orange', width: 2 });
            sp.text('β', -0.55 * Math.cos(b / 2) * 1.0 - 0.1, 0.55 * Math.sin(b / 2) + 0.15, { size: 11, color: 'orange' });
          } else {
            const q = Math.sqrt(z * z - 1); poles = [[-wn * (z - q), 0], [-wn * (z + q), 0]];
            h.visible = false;
          }
          for (const p of poles) xMark(sp, p[0], p[1], { color: 'accent', r: 6, width: 2.6 });
          if (z < 1) sp.tex(String.raw`\omega_n=${fx(wn, 2)}`, -wn * 0.72, -wn * 0.72 - 0.1, { size: 12, color: 'orange' });
          const T = 12, r = stepExact(v.M, second(z, wn), T, 900);
          R = r;
          if (z > 0 && z < 1) {
            const f = (t) => Math.exp(-z * wn * t) / Math.sqrt(1 - z * z);
            st.fn((t) => 1 + f(t), { color: 'orange', width: 1.5, dash: [5, 4] }); st.fn((t) => 1 - f(t), { color: 'orange', width: 1.5, dash: [5, 4] });
          }
          st.hline(1, { color: 'muted', dash: [2, 4] });
          st.clip(() => trace(st, r.t, r.y, { color: 'accent', width: 3 }));
        });
        v.legend([['accent', 'poles and step response'], ['orange', 'angle β = arccos ζ, radius ωn, envelope']]);
        v.readout(() => {
          const z = zS.value, wn = wS.value;
          const kind = z < 0 ? 'unstable (poles in the right half-plane)' : z === 0 ? 'undamped' : z < 1 ? 'underdamped' : z === 1 ? 'critically damped' : 'overdamped (two real poles)';
          const q = z >= 1 ? Math.sqrt(z * z - 1) : 0;
          const pl = z < 1 ? `$s=${fx(-z * wn, 2)}\\pm ${fx(wn * Math.sqrt(1 - z * z), 2)}\\,i$, $\\omega_d=${fx(wn * Math.sqrt(1 - z * z), 2)}$` : `$s=${fx(-wn * (z - q), 2)},\\ ${fx(-wn * (z + q), 2)}$`;
          const info = R ? stepInfo(R.t, R.y, 1, 0.02) : null;
          return `$\\zeta=${fx(z, 2)}$, $\\omega_n=${fx(wn, 2)}$: ${kind}; poles ${pl}\n` + (z > 0 && info ? `measured $M_p=${fx(100 * info.Mp, 1)}\\,\\%$ (formula ${fx(100 * mpOfZeta(z), 1)} %) · $t_s(2\\,\\%)=${fx(info.ts, 2)}$ s (rule $4/(\\zeta\\omega_n)=${fx(4 / (z * wn), 2)}$ s)` : '');
        });
      },
    },
    // ------------------------------------------------------------------ 4.3
    {
      num: '4.3',
      kind: 'Proposition',
      name: 'Overshoot depends only on the damping ratio',
      statement: String.raw`For the standard second-order system with $0<\zeta<1$ (and no zeros or further poles), the peak of the unit step response occurs at $t_p=\pi/\omega_d$ and the peak overshoot is
$$M_p=\exp\!\Big(-\frac{\pi\zeta}{\sqrt{1-\zeta^2}}\Big),$$
which depends on $\zeta$ alone: it is the same for every natural frequency $\omega_n$. Multiplying $\omega_n$ by $c$ compresses the whole response by the factor $c$ in time, $y_{c\omega_n}(t)=y_{\omega_n}(ct)$, without changing its shape. The function is decreasing: $M_p\approx 100\,\%$ as $\zeta\to0$, $16\,\%$ near $\zeta=0.5$, $4.6\,\%$ at $\zeta=0.7$ and $0$ at $\zeta=1$.`,
      idea: String.raw`Differentiating the step response gives $\dot y(t)=\dfrac{\omega_n}{\sqrt{1-\zeta^2}}e^{-\zeta\omega_nt}\sin\omega_dt$, which first vanishes at $\omega_dt=\pi$; substituting $t_p=\pi/\omega_d$ into $y$ gives $1+e^{-\pi\zeta/\sqrt{1-\zeta^2}}$. The scaling statement is the time-scaling property of the Laplace transform (sig-9.6): replacing $s$ by $s/c$ in $G$ replaces $\omega_n$ by $c\omega_n$ and stretches time by $1/c$. Both facts rest on the response formula of ctrl-4.2.`,
      caption: String.raw`Pick a damping ratio. Three pole pairs on the same ray (different $\omega_n$, **left**) give three responses of the same height but different speed (**middle**), and all three measured overshoots land on the same point of the curve $M_p(\zeta)$ (**right**). Drag the middle pole pair along the ray, or change the angle with the slider. Then **break the hypothesis**: add a zero. If it scales with $\omega_n$, the shape is still the same for all three, but no longer the formula's; if the zero is fixed, the overshoot depends on $\omega_n$ again.`,
      deps: ['ctrl-4.2'],
      refs: ['Franklin–Powell §3.4'],
      tags: ['overshoot', 'damping'],
      scope: String.raw`Exact for the pure second-order system; zeros or extra poles change the overshoot (see ctrl-4.5).`,
      viz(v) {
        const W = [1, 2, 3.5], COL = ['purple', 'accent', 'orange'];
        const zS = v.slider('damping $\\zeta$', 0.05, 0.98, 0.45, { step: 0.01 });
        const exS = v.select('extra zero', [{ value: 'none', label: 'none' }, { value: 'scaled', label: 'at $-1.5\\omega_n$' }, { value: 'fixed', label: 'fixed at $-3$' }], 'none');
        const sp = v.stage({ x: [-4.2, 1], y: [-4, 4], equal: true, axes: true, height: 330, xlabel: 'Re s', ylabel: 'Im s', minWidth: 230 });
        const st = v.stage({ x: [0, 14], y: [0, 1.9], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'y(t)', height: 330, minWidth: 260 });
        const mp = v.stage({ x: [0, 1], y: [0, 100], axes: 'box', gutter: true, xlabel: 'damping ratio ζ', ylabel: 'overshoot (%)', height: 330, minWidth: 230 });
        const h = sp.handle(-0.9, 1.79, { color: 'accent', r: 7 });
        h.onDrag = () => { const w = Math.hypot(h.x, h.y); zS.set(clamp(-h.x / w, 0.05, 0.98)); };
        let meas = [];
        const resp = (z, w) => {
          const ex = exS.value;
          let num = [w * w], den = [w * w, 2 * z * w, 1];
          if (ex !== 'none') { const zz = ex === 'scaled' ? 1.5 * w : 3; num = [w * w, w * w / zz]; }
          return stepExact(v.M, tf(num, den), 14, 700);
        };
        v.render(() => {
          const z = zS.value, b = Math.acos(z);
          sp.path([[0, 0], [-4.2 * Math.cos(b), 4.2 * Math.sin(b)]], { color: 'muted', width: 1.2, dash: [4, 4] });
          sp.path([[0, 0], [-4.2 * Math.cos(b), -4.2 * Math.sin(b)]], { color: 'muted', width: 1.2, dash: [4, 4] });
          sp.vline(0, { color: 'red', width: 1.5, alpha: 0.5 });
          if (exS.value !== 'none') W.forEach((w, i) => { const zz = exS.value === 'scaled' ? 1.5 * w : 3; if (zz < 4.2) sp.dot(-zz, 0, { r: 5, hollow: true, color: COL[i] }); });
          meas = [];
          W.forEach((w, i) => {
            const zr = [-z * w, w * Math.sqrt(1 - z * z)];
            xMark(sp, zr[0], zr[1], { color: COL[i], r: 5, width: 2.4 }); xMark(sp, zr[0], -zr[1], { color: COL[i], r: 5, width: 2.4 });
            const r = resp(z, w), info = stepInfo(r.t, r.y, 1, 0.02);
            meas.push(100 * info.Mp);
            trace(st, r.t, r.y, { color: COL[i], width: 2.6 });
            if (info.tp !== null) st.dot(info.tp, info.ypeak, { r: 5, color: COL[i] });
          });
          st.hline(1, { color: 'muted', dash: [2, 4] });
          st.hline(1 + mpOfZeta(z), { color: 'red', width: 1.3, dash: [6, 4] });
          mp.fn((x) => 100 * mpOfZeta(x), { color: 'ink', width: 2.6, domain: [0.005, 0.999] });
          mp.vline(z, { color: 'gold', width: 1.4, alpha: 0.8 });
          meas.forEach((m, i) => mp.dot(z, m, { r: 6 - i, color: COL[i] }));
          mp.text(`${fx(100 * mpOfZeta(z), 1)} %`, z, 100 * mpOfZeta(z), { size: 12, color: 'red', dx: 10, dy: -8, align: 'left' });
        });
        v.legend([['purple', 'ωn = 1'], ['accent', 'ωn = 2'], ['orange', 'ωn = 3.5'], ['red', 'formula 1 + Mp', { dash: true }], ['ink', 'Mp(ζ)']]);
        v.readout(() => {
          const z = zS.value;
          return `$\\zeta=${fx(z, 2)}$ (ray at $\\beta=${fx((Math.acos(z) * 180) / Math.PI, 1)}^\\circ$): measured $M_p=${meas.map((m) => fx(m, 2) + '\\,\\%').join(' / ')}$ for $\\omega_n=1,\\,2,\\,3.5$ · formula $e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}=${fx(100 * mpOfZeta(z), 2)}\\,\\%$ · $t_p=\\pi/\\omega_d$ equals $${W.map((w) => fx(Math.PI / (w * Math.sqrt(1 - z * z)), 2)).join(',\\ ')}$ s` +
            (exS.value === 'fixed' ? '\nthe zero at $-3$ is fixed: the three overshoots now differ, because the zero is "closer" to the slower pole pairs.' : exS.value === 'scaled' ? '\nthe zero scales with $\\omega_n$: all three shapes agree with each other, but differ from the formula (larger overshoot).' : '');
        });
      },
    },
    // ------------------------------------------------------------------ 4.4
    {
      num: '4.4',
      kind: 'Proposition',
      name: 'Specifications as regions of the s-plane',
      statement: String.raw`For the stable, zero-free, unit-DC-gain second-order system $G(s)=\omega_n^2/(s^2+2\zeta\omega_ns+\omega_n^2)$ with $0<\zeta<1$ and poles $s=-\sigma\pm i\omega_d$ ($\sigma=\zeta\omega_n$), the usual specifications translate into pole regions:
(a) rise time $t_r\lesssim t_r^{\max}$ is estimated by the design rule (a rough moderate-damping approximation; the normalized 10–90 % rise is about $1.638$ at $\zeta=0.5$, and equals $1.8$ near $\zeta=0.577$) using $\omega_n\ge\omega_{\min}\approx1.8/t_r^{\max}$: poles *outside* the circle of radius $\omega_{\min}$;
(b) overshoot $M_p\le M^{\max}$ is equivalent to $\zeta\ge\zeta_{\min}=-\ln M^{\max}\big/\sqrt{\pi^2+\ln^2M^{\max}}$: poles inside the *wedge* $|\arg(-s)|\le\arccos\zeta_{\min}$;
(c) settling time $t_s\le t_s^{\max}$ (2 % band) is estimated by the design rule $\sigma\ge4/t_s^{\max}$: poles in the *half-plane* $\operatorname{Re}s\le-4/t_s^{\max}$.
The intersection meets these design inequalities; it does not guarantee the exact rise and settling specifications. Only (b) is exact for the second-order system; (a) and (c) are standard design rules of thumb.`,
      idea: String.raw`The overshoot condition is ctrl-4.3 solved for $\zeta$. The decay rate $\sigma$ is the exponent of the envelope in ctrl-4.2, but its envelope has prefactor $1/\sqrt{1-\zeta^2}$. Thus $t_{\rm env}=\ln(50/\sqrt{1-\zeta^2})/\sigma$ is a sufficient 2 % settling bound; $4/\sigma$ drops that prefactor and is only an approximation, and the rise time is, to a good approximation for moderate damping, inversely proportional to $\omega_n$ by the time scaling of ctrl-4.3. Because the pole location *is* the pair $(\sigma,\omega_d)$, each requirement draws a boundary (a vertical line, a ray, an arc) in the complex plane (sig-9.7 for poles and the pole–zero plot). The design problem is then geometric: put the closed-loop poles in the shaded region.`,
      caption: String.raw`Set the three limits with the sliders: the **green** region is where a pole pair meets the three design inequalities (outside the circle, inside the wedge, left of the line). Drag the **gold** pole: its step response appears on the right with the three limits drawn, and the readout lists the measured values. Compare the design region with the independently evaluated response: the rise and settling inequalities can disagree with the true specifications. The readout solves the actual first 10 %/90 % crossings and the final 2 % band entrance, with no finite-window settling assumption. Drag into the right half-plane to break stability; then no steady-state metrics are assigned.`,
      verify: false, // source audit awaits integration; 1.8 is explicitly an approximation
      deps: ['ctrl-4.3', 'sig-9.7'],
      refs: ['Franklin–Powell §3.4', 'Raginsky–Liberzon, ECE486 Lecture 6', 'Bayen, EE C128 Chapter 4, slides 32–38'],
      tags: ['pole regions', 'specifications'],
      scope: String.raw`Exact for overshoot; $t_r\approx1.8/\omega_n$ and $t_s\approx4/\sigma$ are approximations that hold for second-order systems without zeros, and are the standard starting point for higher-order designs.`,
      viz(v) {
        const trS = v.slider('rise time $t_r\\le$ (s)', 0.3, 3, 1.5, { step: 0.05 });
        const mS = v.slider('overshoot $M_p\\le$ (%)', 3, 50, 20, { step: 1 });
        const tsS = v.slider('settling time $t_s\\le$ (s)', 1, 10, 6, { step: 0.1 });
        const sp = v.stage({ x: [-8, 1.5], y: [-5, 5], equal: true, axes: true, height: 400, xlabel: 'Re s', ylabel: 'Im s', weight: 1.1 });
        const st = v.stage({ x: [0, 8], y: [0, 1.8], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'step response', height: 400 });
        const h = sp.handle(-1.1, 1.9, { color: 'gold', r: 8, label: 'pole', labelPos: 'ne', constrain: (x, y) => [clamp(x, -7.8, 1.4), clamp(Math.abs(y), 0.05, 4.9)] });
        let R = null;
        v.render(() => {
          const wmin = 1.8 / trS.value, zmin = (() => { const l = Math.log(mS.value / 100); return -l / Math.sqrt(Math.PI * Math.PI + l * l); })(), sig = 4 / tsS.value;
          const key = [wmin, zmin, sig].join('|');
          sp.raster((x, y) => (Math.hypot(x, y) >= wmin && -x >= zmin * Math.hypot(x, y) && -x >= sig ? v.rgb('green').slice(0, 3).concat(70) : null), { res: 3, key });
          sp.curve((t) => [wmin * Math.cos(t), wmin * Math.sin(t)], Math.PI / 2, (3 * Math.PI) / 2, { color: 'orange', width: 2 });
          const b = Math.acos(zmin);
          sp.path([[0, 0], [-8 * Math.cos(b), 8 * Math.sin(b)]], { color: 'purple', width: 2 }); sp.path([[0, 0], [-8 * Math.cos(b), -8 * Math.sin(b)]], { color: 'purple', width: 2 });
          sp.vline(-sig, { color: 'accent', width: 2 });
          sp.vline(0, { color: 'red', width: 1.3, alpha: 0.5 });
          sp.tex(String.raw`\omega_n=${fx(wmin, 2)}`, 0.15, wmin + 0.35, { size: 12, color: 'orange', align: 'left' });
          sp.tex(String.raw`\zeta=${fx(zmin, 2)}`, -6.5 * Math.cos(b) - 0.2, 6.5 * Math.sin(b) + 0.3, { size: 12, color: 'purple' });
          sp.tex(String.raw`\sigma=${fx(sig, 2)}`, -sig - 0.1, -4.4, { size: 12, color: 'accent', align: 'right' });
          const px = h.x, py = Math.abs(h.y);
          xMark(sp, px, py, { color: 'gold', r: 6, width: 2.6 }); xMark(sp, px, -py, { color: 'gold', r: 6, width: 2.6 });
          const wn = Math.hypot(px, py), z = -px / wn;
          const info = secondOrderMetrics(z, wn), T = info ? Math.max(8, 1.1 * info.ts, tsS.value * 1.1) : 8;
          const N = Math.min(12000, Math.max(800, Math.ceil(T * wn * 50))), r = { t: [], y: [] };
          for (let i = 0; i <= N; i++) { const t = T * i / N; r.t.push(t); r.y.push(secondOrderValue(z, wn, t)); }
          st.setView([0, T], [0, info ? Math.max(1.8, 1.08 * (1 + info.Mp)) : 1.8]);
          R = { r, wn, z, wmin, zmin, sig, info, inside: wn >= wmin && z >= zmin && -px >= sig };
          st.hband(0.98, 1.02, { color: 'green', alpha: 0.12 });
          st.hline(1 + mS.value / 100, { color: 'purple', width: 1.6, dash: [6, 4] });
          st.vline(tsS.value, { color: 'accent', width: 1.6, dash: [6, 4] });
          const t10 = info?.t10 ?? 0;
          st.hline(0.9, { color: 'orange', width: 1, alpha: 0.5 }); st.hline(0.1, { color: 'orange', width: 1, alpha: 0.5 });
          if (info) st.measure(t10, 0.3, t10 + info.tr, 0.3, `tr = ${fx(info.tr, 2)} s`);
          st.measure(t10, 0.55, t10 + trS.value, 0.55, `tr limit ${trS.value} s`);
          st.clip(() => trace(st, r.t, r.y, { color: info && info.tr <= trS.value && 100 * info.Mp <= mS.value && info.ts <= tsS.value ? 'green' : 'red', width: 3 }));
        });
        v.legend([['orange', '$t_r$: outside circle'], ['purple', '$M_p$: inside wedge'], ['accent', '$t_s$: left of line'], ['green', 'design-rule region', { area: true }]]);
        v.readout(() => {
          if (!R) return '';
          const I = R.info, ok = (c) => (c ? '✓' : '✗');
          if (!I) return 'Unstable or undamped pole pair: no settling to a unit steady state. The response is clipped to the plotted vertical window.';
          return `pole: $\\omega_n=${fx(R.wn, 2)}$, $\\zeta=${fx(R.z, 2)}$, $\\sigma=${fx(R.wn * R.z, 2)}$ — **${R.inside ? 'inside' : 'outside'}** the design-rule region\n` +
            `exact response: $t_r=${fx(I.tr, 2)}$ s ${ok(I.tr !== null && I.tr <= trS.value)} (limit ${trS.value}) · $M_p=${fx(100 * I.Mp, 1)}\\,\\%$ ${ok(100 * I.Mp <= mS.value + 1e-9)} (limit ${mS.value}) · $t_s=${fx(I.ts, 2)}$ s ${ok(isFinite(I.ts) && I.ts <= tsS.value)} (limit ${tsS.value}); sufficient envelope bound $t_{\\rm env}=${fx(I.envelope, 2)}$ s.`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.5
    {
      num: '4.5',
      kind: 'Phenomenon',
      name: 'Zeros, extra poles and non-minimum-phase undershoot',
      statement: String.raw`Start from the standard second-order system and add one real **zero** at $s=z_0$, giving $G(s)=(1-s/z_0)\,\omega_n^2/(s^2+2\zeta\omega_ns+\omega_n^2)$ (DC gain still one), or one extra real **pole** at $s=-p$, giving $G(s)=\omega_n^2p/\big((s+p)(s^2+2\zeta\omega_ns+\omega_n^2)\big)$.
(a) A zero in the left half-plane ($z_0<0$) *increases* the overshoot, the more so the closer it lies to the origin; far to the left it is harmless.
(b) An extra pole in the left half-plane *slows* the response and reduces the overshoot; far to the left it is harmless.
(c) A zero in the right half-plane ($z_0>0$, a **non-minimum-phase** system) forces an **undershoot**: for a stable system with positive DC gain, the step response must become negative at some time before it settles at $+1$. The closer the zero is to the origin, the deeper the dip.`,
      idea: String.raw`A zero adds a term proportional to $s$, so the response becomes $y_0(t)-\dot y_0(t)/z_0$: the original step response minus its own (scaled) derivative. For $z_0<0$ the derivative term is added, boosting the overshoot; for $z_0>0$ it is subtracted, and in the first moments the derivative dominates, so $y$ starts out in the wrong direction. Statement (c) has a clean proof: the Laplace transform $Y(s)=G(s)/s$ vanishes at $s=z_0>0$ (zero of $G$, where $z_0$ lies in the region of convergence), so $\int_0^\infty y(t)e^{-z_0t}dt=0$ although $y\to1>0$; hence $y$ must be negative somewhere. An extra pole is a first-order lag cascaded with the second-order system, which smooths it (sig-6.10 on minimum-phase systems).`,
      caption: String.raw`Choose zero or extra pole and drag the **gold** marker on the real axis. Slide the zero from far left toward the origin: the overshoot grows. Cross the origin into the right half-plane and the response first dips below zero (the **red** undershoot) before heading to 1. The readout verifies the proof of (c): the weighted integral $\int_0^\infty y\,e^{-z_0t}dt$ is zero to numerical accuracy, so the dip is unavoidable. The faint curve is the original second-order response without the zero or pole.`,
      deps: ['ctrl-4.2', 'sig-6.10'],
      refs: ['Franklin–Powell §3.5'],
      tags: ['zeros', 'non-minimum phase', 'undershoot'],
      scope: String.raw`(c) assumes a stable system with positive DC gain and a single real right-half-plane zero (an odd number of them gives the same conclusion).`,
      viz(v) {
        const modeS = v.select('add', [{ value: 'zero', label: 'a zero' }, { value: 'pole', label: 'an extra pole' }], 'zero');
        const zS = v.slider('damping $\\zeta$', 0.2, 0.9, 0.5, { step: 0.01 });
        const sp = v.stage({ x: [-8, 8], y: [-3, 3], equal: true, axes: true, height: 340, xlabel: 'Re s', ylabel: 'Im s', weight: 1.2 });
        const st = v.stage({ x: [0, 12], y: [-1, 2.4], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'step response', height: 340 });
        const WN = 1.5;
        const hz = sp.handle(-3, 0, { color: 'gold', r: 8, constrain: 'x', label: 'zero', labelPos: 'n' });
        const hp = sp.handle(-4, 0, { color: 'teal', r: 8, constrain: 'x', label: 'pole', labelPos: 'n' });
        let R = null;
        v.render(() => {
          const z = zS.value, zero = modeS.value === 'zero';
          hz.visible = zero; hp.visible = !zero;
          if (zero && Math.abs(hz.x) < 0.25) hz.set(hz.x < 0 || hz.x === 0 ? -0.25 : 0.25, 0);
          if (!zero && hp.x > -0.4) hp.set(-0.4, 0);
          const wd = WN * Math.sqrt(1 - z * z);
          sp.vline(0, { color: 'red', width: 1.3, alpha: 0.5 });
          xMark(sp, -z * WN, wd, { color: 'accent', r: 6, width: 2.6 }); xMark(sp, -z * WN, -wd, { color: 'accent', r: 6, width: 2.6 });
          let sys, mark;
          if (zero) { const z0 = hz.x; sys = tf([WN * WN, -WN * WN / z0], [WN * WN, 2 * z * WN, 1]); mark = z0; sp.dot(z0, 0, { r: 7, hollow: true, color: z0 > 0 ? 'red' : 'gold' }); }
          else { xMark(sp, hp.x, 0, { color: 'teal', r: 6, width: 2.6 }); mark = null; }
          if (!zero) { const p = -hp.x; sys = tf([WN * WN * p], [WN * WN * p, WN * WN + 2 * z * WN * p, 2 * z * WN + p, 1]); }
          const T = 12, N = 1800, base = stepExact(v.M, second(z, WN), T, N), r = stepExact(v.M, sys, T, N);
          const info = stepInfo(r.t, r.y, 1, 0.02);
          let ymin = 0, tmin = 0; r.y.forEach((q, i) => { if (q < ymin) { ymin = q; tmin = r.t[i]; } });
          let integ = null;
          if (zero && mark > 0) { integ = 0; for (let i = 0; i < N; i++) integ += 0.5 * (r.y[i] * Math.exp(-mark * r.t[i]) + r.y[i + 1] * Math.exp(-mark * r.t[i + 1])) * (T / N); integ += Math.exp(-mark * T) / mark; }
          R = { info, ymin, tmin, mark, integ, zero };
          st.hline(1, { color: 'muted', dash: [2, 4] }); st.hline(0, { color: 'faint' });
          trace(st, base.t, base.y, { color: 'muted', width: 1.6, dash: [5, 4] });
          st.clip(() => trace(st, r.t, r.y, { color: zero ? (mark > 0 ? 'red' : 'gold') : 'teal', width: 3 }));
          if (ymin < -1e-3) { st.dot(tmin, ymin, { r: 6, color: 'red' }); st.text(`undershoot ${fx(ymin, 2)}`, tmin, ymin, { size: 12, color: 'red', dx: 10, dy: 6, align: 'left' }); }
        });
        v.legend([['muted', 'without the zero / pole', { dash: true }], ['gold', 'with LHP zero'], ['red', 'with RHP zero'], ['teal', 'with extra pole']]);
        v.readout(() => {
          if (!R) return '';
          const I = R.info;
          let s = `$\\omega_n=${WN}$, $\\zeta=${fx(zS.value, 2)}$ · with ${R.zero ? `zero at $s=${fx(R.mark, 2)}$` : `pole at $s=-${fx(-hp.x, 2)}$`}: $M_p=${fx(100 * I.Mp, 1)}\\,\\%$ (without: ${fx(100 * mpOfZeta(zS.value), 1)} %) · lowest value of $y$: ${fx(R.ymin, 3)}`;
          if (R.integ !== null) s += `\n**right-half-plane zero** ⇒ $\\int_0^\\infty y(t)\\,e^{-z_0t}dt=${fx(R.integ, 5)}$ (zero, as proved), so $y$ must be negative somewhere: it reaches ${fx(R.ymin, 3)} at $t=${fx(R.tmin, 2)}$ s`;
          return s;
        });
      },
    },
  ],
};
