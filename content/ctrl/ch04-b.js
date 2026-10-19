// Control Theory — Chapter 4: Time-domain response (items 4.6 – 4.9)
import {
  clamp, tf, pmul, simLoop, trace, stepInfo, second, stepExact, fx, TAU, proots, xMark, tfAt, cabs, ddeStep, kiCritical,
} from './ch04.shared.js';

export default {
  collection: 'ctrl',
  chapter: 4,
  items: [
    // ------------------------------------------------------------------ 4.6
    {
      num: '4.6',
      kind: 'Definition',
      name: 'System type and steady-state error constants',
      statement: String.raw`In a unity-feedback loop with loop transfer function $L(s)=\dfrac{K\,N(s)}{s^{\,m}D(s)}$, with $N(0)=D(0)=1$ and a stable closed loop, the integer $m$ (the number of free integrators in $L$) is the **system type**. The steady-state tracking error $e_\infty=\lim_{t\to\infty}(r-y)$ for the three standard references is
$$\begin{array}{c|ccc}&r=1&r=t&r=t^2/2\\\hline\text{type }0&\frac1{1+K_p}&\infty&\infty\\\text{type }1&0&\frac1{K_v}&\infty\\\text{type }2&0&0&\frac1{K_a}\end{array}$$
with the **error constants** $K_p=\lim_{s\to0}L(s)$, $K_v=\lim_{s\to0}sL(s)$, $K_a=\lim_{s\to0}s^2L(s)$. Each extra integrator in the loop buys one more order of polynomial reference that is followed with zero error.`,
      idea: String.raw`The error is $E(s)=R(s)/(1+L(s))$, and the final value theorem (sig-9.11) gives $e_\infty=\lim_{s\to0}sE(s)$ if the closed loop is stable. A step has $R=1/s$, a ramp $1/s^2$, a parabola $1/s^3$; so the limit is $\lim s^{1-k}/(1+L)$ with $k=1,2,3$. The factor $1/(1+L)$ is the sensitivity of ctrl-1.6 at zero frequency: $S(s)\approx s^m/K$ near $s=0$, which cancels a power of $s^{-k}$ in the reference for exactly $k\le m$. Integrators in the loop make $|S|$ small at low frequency, which is what lets a slowly varying reference be followed.`,
      caption: String.raw`Pick the number of integrators (type) and the reference. The left panel shows the reference and the output of the loop $L=K(1+s)\big/\big(s^m(1+s/3)(1+s/10)(1+s/30)\big)$; the right panel shows the error $r-y$ and the value predicted by the error constant (dashed). The grid underneath is the table of the statement, with the current cell highlighted: finite, zero or infinite steady-state error. Raise $K$ to shrink a finite error; no gain removes an infinite one.`,
      deps: ['sig-9.11', 'ctrl-1.6'],
      refs: ['Franklin–Powell §4.2'],
      tags: ['steady-state error', 'system type'],
      scope: String.raw`Unity feedback, closed loop stable (otherwise the final value theorem does not apply). The simulated loop is stable for the gains offered.`,
      viz(v) {
        const mS = v.select('type $m$', [0, 1, 2].map((m) => ({ value: m, label: String(m) })), 1);
        const rS = v.select('reference', [{ value: 0, label: 'step' }, { value: 1, label: 'ramp' }, { value: 2, label: 'parabola' }], 1);
        const kS = v.slider('gain $K$', 0.5, 10, 2, { step: 0.1 });
        const sa = v.stage({ x: [0, 20], y: [-1, 5], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'reference r and output y', height: 320, minWidth: 260 });
        const sb = v.stage({ x: [0, 20], y: [-0.2, 1.4], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'error e = r − y', height: 320, minWidth: 260 });
        const sg = v.stage({ x: [0.3, 4.3], y: [0.5, 4.2], axes: false, height: 200, full: true });
        const T = 20, dt = 0.01;
        const loop = (m, K) => {
          let den = [1]; for (let i = 0; i < m; i++) den = pmul(den, [0, 1]);
          den = pmul(den, pmul([1, 1 / 3], pmul([1, 1 / 10], [1, 1 / 30])));
          return tf([K, K], den);
        };
        const key = {}; let R = null;
        const refs = [() => 1, (t) => t, (t) => (t * t) / 2];
        const pred = (m, k, K) => (k < m ? 0 : k === m ? (m === 0 ? 1 / (1 + K) : 1 / K) : Infinity);
        v.render(() => {
          const m = mS.value, k = rS.value, K = kS.value;
          const kk = m + '|' + k + '|' + K;
          if (key.k !== kk) {
            key.k = kk;
            const L = loop(m, K), sim = simLoop({ C: tf([1], [1]), P: L }, { T, dt, r: refs[k] });
            const cl = tf(L.num, L.den.map((c, i) => c + (L.num[i] || 0)));
            const poles = proots(v.M, cl.den);
            R = { sim, stable: poles.every((p) => p[0] < 0), poles };
          }
          const sim = R.sim, ymax = Math.max(1.2, refs[k](T) * 1.05);
          sa.setView([0, T], [-0.05 * ymax, ymax]);
          trace(sa, sim.t, sim.r, { color: 'ink', width: 2, dash: [6, 4] });
          sa.clip(() => trace(sa, sim.t, sim.y, { color: 'accent', width: 3 }));
          const pe = pred(m, k, K), emax = Math.max(...sim.e.map(Math.abs).filter(isFinite));
          const top = Math.max(0.5, Math.min(emax, 25) * 1.1);
          sb.setView([0, T], [-0.15 * top, top]);
          sb.hline(0, { color: 'faint' });
          if (isFinite(pe)) sb.hline(pe, { color: 'orange', width: 2, dash: [6, 4] });
          sb.clip(() => trace(sb, sim.t, sim.e, { color: 'red', width: 3 }));
          // the table
          const names = ['step', 'ramp', 'parabola'];
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
            const x0 = 1.3 + j * 1.0, y0 = 2.6 - i * 1.0, cur = i === m && j === k, e = pred(i, j, K);
            sg.rect(x0 + 0.04, y0 + 0.04, x0 + 0.96, y0 + 0.96, { fill: cur ? 'gold' : e === 0 ? 'green' : isFinite(e) ? 'orange' : 'red', fillAlpha: cur ? 0.45 : 0.18, color: cur ? 'gold' : 'grid', width: cur ? 3 : 1, radius: 6 });
            sg.text(e === 0 ? '0' : isFinite(e) ? fx(e, 3) : '∞', x0 + 0.5, y0 + 0.5, { size: 15, color: 'ink', align: 'center', baseline: 'middle', weight: 700 });
          }
          for (let j = 0; j < 3; j++) sg.text('r = ' + ['1', 't', 't²/2'][j] + '  (' + names[j] + ')', 1.8 + j, 3.7, { size: 12, color: 'muted', align: 'center', baseline: 'bottom' });
          for (let i = 0; i < 3; i++) sg.text('type ' + i, 1.2, 3.1 - i, { size: 12, color: 'muted', align: 'right', baseline: 'middle' });
          R.pe = pe;
        });
        v.legend([['ink', 'reference r', { dash: true }], ['accent', 'output y'], ['red', 'error e'], ['orange', 'predicted $e_\\infty$', { dash: true }]]);
        v.readout(() => {
          if (!R) return '';
          const m = mS.value, k = rS.value, K = kS.value, e = R.sim.e, eT = e[e.length - 1];
          const consts = `$K_p=${m === 0 ? fx(K, 2) : '\\infty'}$, $K_v=${m === 0 ? '0' : m === 1 ? fx(K, 2) : '\\infty'}$, $K_a=${m === 2 ? fx(K, 2) : '0'}$`;
          return `type ${m}, ${['step', 'ramp', 'parabola'][k]}: ${consts} · predicted $e_\\infty=${R.pe === 0 ? '0' : isFinite(R.pe) ? fx(R.pe, 4) : '\\infty'}$ · simulated $e(${T})=${fx(eT, 4)}$` + (R.stable ? '' : ' · **closed loop unstable**');
        });
      },
    },
    // ------------------------------------------------------------------ 4.7
    {
      num: '4.7',
      kind: 'Principle',
      name: 'The internal model principle',
      statement: String.raw`Suppose a stable feedback loop must track references (or reject disturbances) that are generated by a known dynamic model, for instance $\ddot r+\omega_0^2r=0$ (all sinusoids of frequency $\omega_0$) or $\dot r=0$ (all constants). Then the loop can achieve zero steady-state error for *every* signal of that family, robustly (that is, for all plants near the nominal one, with the closed loop remaining stable), **only if the loop contains a copy of the signal generator's dynamics**: the product $L=PC$ must have the poles of the generator, here $s^2+\omega_0^2$ or $s$, as poles. Without them, an error remains; with only approximately the right model (a frequency off by a little), the error is small but not zero.`,
      idea: String.raw`At a pole $s_0=i\omega_0$ of the reference the closed-loop error is $E=R/(1+L)$, and $E$ can only vanish at that frequency in the steady state if $1+L$ is infinite there, that is, if $L$ has a pole at $s_0$. Putting the pole in the controller makes $|S(i\omega_0)|=0$ whatever the plant does (provided the loop stays stable, which uses ctrl-4.6 in the special case of the integrator: the type-1 system of ctrl-4.6 is the internal model of the constant). The same idea explains why integral action rejects constant load disturbances and why repetitive controllers contain a delay line.`,
      credit: 'B. A. Francis & W. M. Wonham, 1976 (Automatica 12: 457–465)',
      caption: String.raw`The plant is $P=1/(s+1)$ and the reference is either a constant or the sinusoid $\sin\omega_0t$. Choose the controller: proportional, PI (a model of the constant: an integrator) or proportional plus a **resonator** $k_r\,s/(s^2+\omega_c^2)$ (a model of a sinusoid of frequency $\omega_c$). The right panel plots $|C(i\omega)|$: the integrator has infinite gain at $\omega=0$, the resonator at $\omega_c$. Only the controller whose model matches the signal drives the error to zero; switch off “tuned” and detune the resonator slightly to see a small but non-zero error remain.`,
      deps: ['ctrl-4.6'],
      refs: ['Franklin–Powell §4.2', 'Åström–Murray §7.4'],
      tags: ['internal model', 'tracking'],
      scope: String.raw`Linear time-invariant loops with a stable closed loop; the robust version of the principle is the Francis–Wonham theorem for regulators, of which this is the single-input single-output case.`,
      viz(v) {
        const cS = v.select('controller', [{ value: 'p', label: 'P' }, { value: 'pi', label: 'PI (integrator)' }, { value: 'res', label: 'P + resonator' }], 'res');
        const sigS = v.select('signal', [{ value: 'const', label: 'constant' }, { value: 'sin', label: 'sinusoid' }], 'sin');
        const wS = v.slider('signal frequency $\\omega_0$', 0.5, 5, 2, { step: 0.05 });
        const tunedT = v.toggle('resonator tuned to $\\omega_0$', true);
        const dS = v.slider('detuning $\\omega_c-\\omega_0$', -1, 1, 0.3, { step: 0.01 });
        const sa = v.stage({ x: [0, 40], y: [-1.5, 1.5], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'r and y', height: 320, minWidth: 280, weight: 1.3 });
        const sb = v.stage({ x: [0.1, 10], y: [0.1, 1000], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'ω (rad/s)', ylabel: '|C(iω)|', height: 320, minWidth: 240 });
        const T = 40, dt = 0.01, P = tf([1], [1, 1]);
        const ctrl = () => {
          const w0 = wS.value, wc = tunedT.value ? w0 : Math.max(0.2, w0 + dS.value), kp = 1.5;
          if (cS.value === 'p') return { C: tf([kp], [1]), wc: null, txt: `${kp}` };
          if (cS.value === 'pi') return { C: tf([2, kp], [0, 1]), wc: 0, txt: `${kp}+\\dfrac{2}{s}` };
          const kr = 4; return { C: tf([kp * wc * wc, kr, kp], [wc * wc, 0, 1]), wc, txt: `${kp}+\\dfrac{${kr}s}{s^2+${fx(wc * wc, 2)}}` };
        };
        let R = null;
        v.render(() => {
          const w0 = wS.value, c = ctrl(), isSin = sigS.value === 'sin';
          dS.el.hidden = tunedT.value || cS.value !== 'res'; tunedT.el.hidden = cS.value !== 'res';
          const rf = isSin ? (t) => Math.sin(w0 * t) : () => 1;
          const sim = simLoop({ C: c.C, P }, { T, dt, r: rf });
          const per = isSin ? TAU / w0 : 2, n0 = sim.t.length - Math.round(per / dt);
          let emax = 0; for (let i = Math.max(0, n0); i < sim.e.length; i++) emax = Math.max(emax, Math.abs(sim.e[i]));
          const S = (() => { const l = tfAt(tf(pmul(c.C.num, P.num), pmul(c.C.den, P.den)), isSin ? w0 : 1e-6); const q = 1 / cabs([1 + l[0], l[1]]); return isFinite(q) ? q : 0; })();
          R = { emax, c, S, isSin };
          trace(sa, sim.t, sim.r, { color: 'ink', width: 1.8, dash: [6, 4] });
          trace(sa, sim.t, sim.y, { color: 'accent', width: 2.8 });
          trace(sa, sim.t, sim.e, { color: 'red', width: 1.6 });
          sa.vband(T - per, T, { color: 'gold', alpha: 0.12 });
          const pts = [];
          for (let i = 0; i <= 300; i++) { const w = 10 ** (-1 + (2 * i) / 300); pts.push(w); }
          if (c.wc > 0) { pts.push(c.wc * 0.999, c.wc * 0.9999, c.wc * 1.0001, c.wc * 1.001); pts.sort((a, b) => a - b); }
          const g = pts.map((w) => [w, Math.max(0.05, Math.min(5000, cabs(tfAt(c.C, w))))]);
          sb.path(g, { color: 'accent', width: 3 });
          sb.vline(w0, { color: 'gold', width: 2, dash: [5, 3] });
          sb.text('ω0', w0, 600, { size: 12, color: 'gold', dx: 5, align: 'left' });
        });
        v.legend([['ink', 'reference', { dash: true }], ['accent', 'output y'], ['red', 'error e'], ['gold', 'last period (error measured here)', { area: true }]]);
        v.readout(() => {
          if (!R) return '';
          const lab = cS.value === 'p' ? 'proportional' : cS.value === 'pi' ? 'PI: models constants' : `resonator at $\\omega_c=${fx(R.c.wc, 2)}$ (signal $\\omega_0=${fx(wS.value, 2)}$)`;
          return `${lab} · $C=${R.c.txt}$\nlargest $|e|$ over the last period: **$${R.emax < 5e-4 ? v.sci(Math.max(R.emax, 1e-12), 1) : fx(R.emax, 4)}$** · loop prediction $|S(i\\omega_0)|=${R.S < 5e-4 ? v.sci(Math.max(R.S, 1e-12), 1) : fx(R.S, 4)}$ ${R.isSin ? `(error amplitude = $|S(i\\omega_0)|$ for a unit sinusoid)` : '(for a constant the relevant frequency is $0$)'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.8
    {
      num: '4.8',
      kind: 'Concept',
      name: 'Dominant-pole approximation',
      statement: String.raw`The **dominant poles** are a slow pair (or single real pole) that controls the response after faster modes decay. A low-order model retaining these poles and the DC gain can approximate a stable system when the discarded modal residues and zero effects are also controlled; pole separation alone is not a general error guarantee. For $G(s)=\dfrac{\omega_n^2p}{(s+p)(s^2+2\zeta\omega_ns+\omega_n^2)}$ the full response is
$$y(t)=y_2(t)+B\,e^{-pt}+\text{(small change in the second-order part)},\qquad |B|=\frac{\omega_n^2}{p^2-2\zeta\omega_np+\omega_n^2}\to\frac{\omega_n^2}{p^2}\ \ (p\gg\omega_n),$$
so for $p\gg\omega_n$ the extra term is small and decays quickly, and the response differs from $y_2$ mainly by a small delay of about $1/p$. Theory gives no sharp threshold for "much closer": the error falls smoothly as the ratio $p/\sigma$ of the real parts grows, with $\sigma=\zeta\omega_n$, but that ratio alone is insufficient when damping is small: the displayed cascade requires $p\gg\omega_n$, and the measured error is the useful check.`,
      idea: String.raw`In the partial-fraction expansion of $Y(s)=G(s)/s$ (sig-9.14 for dominant poles, sig-9.7 for the poles themselves) each pole $s_k$ contributes a term $c_ke^{s_kt}$. A pole with real part ten times larger decays ten times sooner but fixed DC gain alone does not bound its modal residue. After a short transient the fast terms decay; whether dropping them gives a good approximation must be checked from residues and the observed response. In the specific cascaded-lag family shown here the fast residue does become small as $p/\omega_n\to\infty$. What is lost is a small delay: the far pole acts like an extra lag of about $1/p$ seconds, shifting the response to the right by roughly that amount.`,
      caption: String.raw`The dominant pair has $\omega_n=1$ and the damping ratio you choose; the extra real pole sits at $-p$ (drag the **teal** marker or use the slider for the ratio $p/\sigma$, with $\sigma=\zeta\omega_n$ the dominant real part). The full third-order response (**solid**) is compared with the second-order approximation (**dashed**), and the shaded gap is the error. The right panel plots the largest error against the ratio $p/\sigma$: it falls steadily rather than switching on at a magic ratio, and it is not negligible until $p$ is many times $\sigma$.`,
      deps: ['sig-9.14', 'ctrl-4.2'],
      refs: ['Åström–Murray, Feedback Systems (2008), §6.3 pp. 187–188 (modal residues/caveat)', 'MIT 16.06 (2012), Lecture 7 pp. 4–5 (added-pole convolution)'],
      tags: ['dominant poles', 'approximation'],
      scope: String.raw`The displayed approximation concerns the specified cascade with a constant numerator and fixed DC gain. In a general system, decay rates alone do not control approximation error: inspect modal residues, zeros, cancellations and the time interval of interest. The 5σ guide is an illustrative ratio, not an accuracy threshold.`,
      viz(v) {
        const WN = 1;
        const zS = v.slider('damping $\\zeta$ of the dominant pair', 0.2, 0.9, 0.5, { step: 0.01 });
        const rS = v.slider('ratio $p/\\sigma$', 1, 15, 3, { step: 0.05, log: true });
        const sp = v.stage({ x: [0.25, 20], y: [-1.5, 1.5], xlog: true, axes: 'box', gutter: true, height: 320, xlabel: '−Re s (log scale)', ylabel: 'Im s', minWidth: 260, weight: 1.1 });
        const st = v.stage({ x: [0, 16], y: [0, 1.5], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'step response', height: 320, weight: 1.2 });
        const er = v.stage({ x: [1, 15], y: [0, 0.5], xlog: true, axes: 'box', gutter: true, xlabel: 'ratio p/σ', ylabel: 'max |error|', height: 320, minWidth: 240 });
        const hp = sp.handle(1.5, 0, { color: 'teal', r: 8, constrain: 'x', label: 'extra pole', labelPos: 'n' });
        hp.onDrag = () => { const sg = zS.value * WN; rS.set(clamp(hp.x / sg, 1, 15)); };
        const full = (z, p) => { const c = WN * WN, b = 2 * z * WN; return tf([p * c], [p * c, c + p * b, p + b, 1]); };
        const cache = new Map();
        const maxErr = (z, r) => {
          const k = z + '|' + r; if (cache.has(k)) return cache.get(k);
          const p = r * z * WN, T = Math.max(14, 9 / (z * WN)), a = stepExact(v.M, full(z, p), T, 400), b = stepExact(v.M, second(z, WN), T, 400);
          let m = 0; for (let i = 0; i < a.y.length; i++) m = Math.max(m, Math.abs(a.y[i] - b.y[i]));
          if (cache.size > 400) cache.clear(); cache.set(k, m); return m;
        };
        let R = null;
        v.render(() => {
          const z = zS.value, sg = z * WN, p = rS.value * sg, wd = WN * Math.sqrt(1 - z * z);
          hp.set(p, 0);
          sp.hline(0, { color: 'faint' });
          sp.vline(sg, { color: 'accent', width: 1, dash: [3, 4], alpha: 0.7 });
          sp.vline(5 * sg, { color: 'muted', width: 1, dash: [3, 4], alpha: 0.7 });
          sp.text('σ', sg, 1.3, { size: 12, color: 'accent', dx: 4, align: 'left' }); sp.text('5σ', 5 * sg, 1.3, { size: 12, color: 'muted', dx: 4, align: 'left' });
          sp.dot(sg, wd, { r: 6, color: 'accent' }); sp.dot(sg, -wd, { r: 6, color: 'accent' });
          sp.dot(p, 0, { r: 6, color: 'teal' });
          const T = 16, N = 800, a = stepExact(v.M, full(z, p), T, N), b = stepExact(v.M, second(z, WN), T, N);
          st.hline(1, { color: 'muted', dash: [2, 4] });
          st.clip(() => { for (let i = 0; i < N; i += 1) st.line(a.t[i], a.y[i], a.t[i], b.y[i], { color: 'red', alpha: 0.28, width: 1.6 }); });
          trace(st, b.t, b.y, { color: 'orange', width: 2.4, dash: [7, 4] });
          trace(st, a.t, a.y, { color: 'accent', width: 3 });
          const ia = stepInfo(a.t, a.y, 1, 0.02), ib = stepInfo(b.t, b.y, 1, 0.02);
          const rr = []; for (let i = 0; i <= 28; i++) rr.push(10 ** ((i / 28) * Math.log10(15)));
          er.path(rr.map((r) => [r, maxErr(z, r)]), { color: 'ink', width: 2.6 });
          er.vline(rS.value, { color: 'teal', width: 1.6, dash: [4, 3] });
          er.dot(rS.value, maxErr(z, rS.value), { r: 6, color: 'teal' });
          R = { ia, ib, err: maxErr(z, rS.value), B: -WN * WN / (p * p - 2 * z * WN * p + WN * WN), p, sg };
        });
        v.legend([['accent', 'full third-order response'], ['orange', 'dominant pair only', { dash: true }], ['red', 'error']]);
        v.readout(() => {
          if (!R) return '';
          return `extra pole at $-${fx(R.p, 2)}$, ratio $p/\\sigma=${fx(rS.value, 2)}$; size of its mode $B=${fx(R.B, 3)}$ · overshoot $${fx(100 * R.ia.Mp, 1)}\\,\\%$ (dominant pair alone: $${fx(100 * R.ib.Mp, 1)}\\,\\%$) · settling time $${fx(R.ia.ts, 2)}$ s (alone: $${fx(R.ib.ts, 2)}$ s) · largest error between the curves $${fx(R.err, 3)}$`;
        });
      },
    },
    // ------------------------------------------------------------------ 4.9
    {
      num: '4.9',
      kind: 'Phenomenon',
      name: 'Time delay limits achievable speed',
      statement: String.raw`A loop containing a pure delay $\theta$ cannot be made arbitrarily fast. Take integral control $C=k_i/s$ around the plant $P=e^{-\theta s}/(\tau s+1)$.
(a) The output cannot react before time $\theta$: $y(t)=0$ for $t<\theta$ whatever the controller.
(b) The closed loop is stable only for $k_i<k_i^{\max}(\theta,\tau)$. For the pure delay ($\tau=0$) this is exactly $k_i^{\max}=\pi/(2\theta)$: **the gain times the delay is bounded by $\pi/2$**. For $\tau>0$ the bound is $k_i^{\max}=\omega_c\sqrt{1+\omega_c^2\tau^2}$ where $\omega_c$ solves $\omega_c\theta+\arctan(\omega_c\tau)=\pi/2$.
(c) Consequently the fastest settling time that can be reached grows in proportion to $\theta$ once $\theta$ exceeds the time constant: increasing the gain beyond the limit gives growing oscillations, not speed.`,
      idea: String.raw`A delay has gain one and phase $-\omega\theta$ (ctrl-2.10), which decreases without bound as the frequency rises. A feedback loop becomes unstable when, at the frequency where $|L|=1$, the total phase reaches $-\pi$ (the Nyquist criterion, ctrl-1.9 for the mechanism of instability). For $L=k_ie^{-i\omega\theta}/(i\omega)$ the phase is $-\pi/2-\omega\theta$ and $|L|=k_i/\omega$, so the phase crossover at $\omega\theta=\pi/2$ forces $k_i\theta<\pi/2$. Raising the gain raises the crossover frequency, and the delay then eats the phase margin: speed is bought with phase, and a delay sells phase very dearly at high frequency.`,
      caption: String.raw`Drag the **gold** point in the gain–delay plane (left): the stable region lies under the boundary curve $k_i^{\max}(\theta)$. The middle panel simulates the closed loop with the delay and shows the unit step response: well inside the region it is smooth and slow, near the boundary it rings, and past it, it grows without bound. The right panel shows the best 2 % settling time obtainable by tuning $k_i$ at each delay (computed by scanning the gain): it rises with $\theta$. Select the plant with or without a lag. The delay is simulated in steps of 0.01 s, so the boundary is reproduced to within about 1 %.`,
      deps: ['ctrl-2.10', 'ctrl-1.9'],
      refs: ['Åström–Murray §14.3'],
      tags: ['time delay', 'stability limit'],
      scope: String.raw`Statement (b) is exact for the loops shown; the proportionality of the best settling time to $\theta$ in (c) is read from the numerical scan (settling to 2 % within 40 s), not proved here.`,
      viz(v) {
        const plS = v.select('plant', [{ value: 0, label: 'pure delay' }, { value: 1, label: 'lag $\\tau=1$ + delay' }], 1);
        const pl = v.stage({ x: [0, 3], y: [0, 4], axes: 'box', gutter: true, xlabel: 'delay θ (s)', ylabel: 'integral gain kᵢ', height: 340, minWidth: 250 });
        const st = v.stage({ x: [0, 30], y: [0, 2], axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'step response y', height: 340, minWidth: 260, weight: 1.2 });
        const bs = v.stage({ x: [0, 3], y: [0, 40], axes: 'box', gutter: true, xlabel: 'delay θ (s)', ylabel: 'best settling time (s)', height: 340, minWidth: 240 });
        const h = pl.handle(1, 0.4, { color: 'gold', r: 8, label: '(θ, kᵢ)', labelPos: 'sw', constrain: { x: [0.1, 3], y: [0.05, 4] } });
        const cacheB = new Map();
        const best = (tau) => {
          if (cacheB.has(tau)) return cacheB.get(tau);
          const out = [];
          for (let th = 0.1; th <= 3.0001; th += 0.1) {
            const km = kiCritical(th, tau); let b = Infinity;
            for (let j = 1; j <= 50; j++) {
              const k = (km * j) / 51, y = ddeStep(k, th, tau, 40, 0.02), t = y.map((_, i) => i * 0.02), info = stepInfo(t, Array.from(y), 1, 0.02);
              if (isFinite(info.ts) && info.ts < b) b = info.ts;
            }
            out.push([th, isFinite(b) ? b : 40]);
          }
          cacheB.set(tau, out); return out;
        };
        let R = null;
        v.render(() => {
          const tau = plS.value, th = h.x, k = h.y;
          const bd = []; for (let i = 0; i <= 120; i++) { const t = 0.1 + (2.9 * i) / 120; bd.push([t, Math.min(4, kiCritical(t, tau))]); }
          pl.clip(() => { pl.between((x) => Math.min(4, kiCritical(Math.max(x, 0.1), tau)), () => 4, 0.1, 3, { fill: 'red', fillAlpha: 0.12, stroke: false }); });
          pl.path(bd, { color: 'red', width: 3 });
          pl.text('unstable', 2.2, 3.6, { size: 13, color: 'red' }); pl.text('stable', 1.6, 0.35, { size: 13, color: 'green' });
          const kmax = kiCritical(th, tau);
          const y = ddeStep(k, th, tau, 30, 0.01), t = Array.from(y, (_, i) => i * 0.01);
          let amp = 0; for (let i = Math.floor(y.length * 0.8); i < y.length; i++) amp = Math.max(amp, Math.abs(y[i] - 1));
          const info = stepInfo(t, Array.from(y), 1, 0.02);
          R = { kmax, amp, info, th };
          const ymax = Math.min(Math.max(1.6, ...Array.from(y).filter((q, i) => i % 20 === 0).map((q) => (isFinite(q) ? q : 0))) * 1.05, 3);
          st.setView([0, 30], [-0.05 * ymax, ymax]);
          st.hline(1, { color: 'muted', dash: [2, 4] });
          st.vline(th, { color: 'orange', width: 1.5, dash: [5, 3] });
          st.text('delay θ', th, ymax * 0.93, { size: 12, color: 'orange', dx: 4, align: 'left' });
          st.clip(() => trace(st, t, Array.from(y), { color: k < kmax ? 'accent' : 'red', width: 3 }));
          const bb = best(tau);
          bs.setView([0, 3], [0, Math.max(...bb.map((q) => q[1])) * 1.1]);
          bs.path(bb, { color: 'ink', width: 2.8 }); bs.dots(bb, { r: 3, color: 'ink' });
          if (k < kmax && isFinite(info.ts)) bs.dot(th, info.ts, { r: 7, color: 'gold' });
          R.bb = bb;
        });
        v.legend([['red', 'stability boundary / unstable'], ['accent', 'stable response'], ['gold', 'your tuning'], ['ink', 'best tuning at each θ']]);
        v.readout(() => {
          if (!R) return '';
          const tau = plS.value, th = h.x, k = h.y, I = R.info;
          return `$\\theta=${fx(th, 2)}$, $k_i=${fx(k, 2)}$: limit $k_i^{\\max}=${fx(R.kmax, 3)}$ ${tau === 0 ? `($=\\pi/2\\theta=${fx(Math.PI / (2 * th), 3)}$; product $k_i\\theta=${fx(k * th, 3)}$ vs $\\pi/2=1.571$)` : ''} · ${k < R.kmax ? `**stable** (ratio ${fx(k / R.kmax, 2)}): $M_p=${fx(100 * I.Mp, 1)}\\%$, $t_s=${fx(I.ts, 1)}$ s` : `**unstable**: the output deviates by ${fx(R.amp, 2)} in the last 6 s`}`;
        });
      },
    },
  ],
};
