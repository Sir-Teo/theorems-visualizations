// Control Theory — Chapter 1: Feedback principles (part b: 1.8–1.14)
import {
  cadd, csub, cmul, cdiv, cabs, cexp, pmul, tf, tfAt, logspace, realize, fitSine, bdBlock, bdWire,
  GOV, govStep, govEquilibrium, govCubic, cubicRoots, clocked, trace, CAR, carAccel, carTrim,
} from './ch01.shared.js';

// ---------- helpers for this file ----------
const TAU = 2 * Math.PI;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

/**
 * Simulate x' = f(x, t) by RK4 with flat Float64Arrays (fast enough to rerun on every slider move).
 * der(X, t, dX) writes the derivative; rec(X, t, k) is called at every grid point.
 */
function rk4Flat(n, der, T, dt, rec, X0) {
  const X = X0 ? Float64Array.from(X0) : new Float64Array(n), Xt = new Float64Array(n);
  const k1 = new Float64Array(n), k2 = new Float64Array(n), k3 = new Float64Array(n), k4 = new Float64Array(n);
  const N = Math.round(T / dt);
  for (let k = 0; k <= N; k++) {
    const t = k * dt;
    rec(X, t, k);
    if (k === N) break;
    der(X, t, k1);
    for (let i = 0; i < n; i++) Xt[i] = X[i] + (dt / 2) * k1[i];
    der(Xt, t + dt / 2, k2);
    for (let i = 0; i < n; i++) Xt[i] = X[i] + (dt / 2) * k2[i];
    der(Xt, t + dt / 2, k3);
    for (let i = 0; i < n; i++) Xt[i] = X[i] + dt * k3[i];
    der(Xt, t + dt, k4);
    for (let i = 0; i < n; i++) X[i] += (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  return X;
}
/** Companion-form block evaluation on a slice of a flat state: returns the output and writes the derivative. */
function blockStep(b, X, o, u, dX) {
  let y = b.D * u, last = u;
  for (let j = 0; j < b.n; j++) { y += b.C[j] * X[o + j]; last -= b.a[j] * X[o + j]; }
  if (dX) { for (let j = 0; j < b.n - 1; j++) dX[o + j] = X[o + j + 1]; if (b.n) dX[o + b.n - 1] = last; }
  return y;
}
/** A car icon of fixed pixel size whose wheels touch (x, y), tilted by the on-screen angle ang (for stages without equal axes). */
function carIcon(s, x, y, ang, st = {}) {
  const k = st.px ?? 7, X = s.X(x), Y = s.Y(y), ca = Math.cos(ang), sa = Math.sin(ang), col = st.color || 'accent';
  const P = (a, b) => [s.invX(X + k * (a * ca - b * sa)), s.invY(Y - k * (a * sa + b * ca))];
  s.poly([[-2.25, 0.32], [2.25, 0.32], [2.3, 0.85], [1.35, 1.0], [0.75, 1.5], [-1.05, 1.5], [-1.65, 1.0], [-2.3, 0.92]].map(([a, b]) => P(a, b)), { fill: col, fillAlpha: 0.9, color: col, width: 1.4 });
  s.poly([[0.62, 1.05], [0.45, 1.38], [-0.95, 1.38], [-1.35, 1.05]].map(([a, b]) => P(a, b)), { fill: 'panel', fillAlpha: 0.75, stroke: false });
  for (const wx of [-1.4, 1.4]) { const c = P(wx, 0.36); s.dot(c[0], c[1], { r: 0.4 * k, color: 'ink' }); }
}
/** Marker × in data units at (x, y), size h. */
function cross(s, x, y, h, st) { s.line(x - h, y - h, x + h, y + h, st); s.line(x - h, y + h, x + h, y - h, st); }

export default {
  collection: 'ctrl',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8',
      kind: 'Principle',
      name: 'Feedback rejects disturbances',
      statement: String.raw`In a stable unity-feedback loop with loop transfer function $L=PC$, the response of the output to a disturbance is the open-loop response multiplied by the sensitivity function $S=1/(1+L)$:
- a disturbance $d$ added at the plant **output** moves $y$ by $S\,d$ instead of $d$;
- a **load** disturbance at the plant input moves $y$ by $PS\,d$ instead of $P\,d$.

For a sinusoidal disturbance of frequency $\omega$, in steady state the deviation is reduced by the factor $|S(i\omega)|$. Slow disturbances, where $|L(i\omega)|\gg1$, are strongly attenuated; fast ones, where $|L|\ll1$, pass unchanged ($|S|\approx1$); and near crossover, where $|1+L(i\omega)|<1$, feedback **amplifies** them. With integral action $L(0)=\infty$, so $S(0)=0$ and constant disturbances are removed completely.`,
      scope: String.raw`linear loops with a stable closed loop, in steady state; the attenuation is limited to the frequencies where the loop gain is large, and it cannot be had everywhere (8.3).`,
      idea: String.raw`With the loop closed, $Y=P(U+D)$ and $U=-CY$ give $(1+PC)\,Y=P\,D$, so $Y=S\cdot(PD)$. The open-loop effect $PD$ is divided by the return difference $1+L$ (1.5). The controller can only push back with the help of an error, so the deviation that remains is the error needed to produce the corrective action, and large loop gain makes it small. The factor $|S(i\omega)|$ is the Bode magnitude of 1.6, which is why disturbance rejection is designed in the frequency domain.`,
      caption: String.raw`A sinusoidal disturbance of frequency $\omega$ enters at the plant output or at its input (load). Left: in steady state, the output deviation with no feedback (red) and with the loop closed (blue), both simulated. Right: the predicted factor $|S(i\omega)|$ (blue curve) with the measured amplitude ratio at the chosen $\omega$ (large gold ring) and at nine other frequencies (gold dots). Slide $\omega$: slow disturbances are crushed, fast ones pass, and around crossover the loop makes them worse. Switch integral action off to see $|S(0)|$ lift off zero; raise $K$ to widen the band of rejection and grow the peak.`,
      deps: ['ctrl-1.6'],
      refs: ['Åström–Murray §2.3'],
      tags: ['disturbance rejection', 'sensitivity'],
      viz(v) {
        const wS = v.slider('disturbance frequency $\\omega$', 0.02, 50, 0.4, { log: true, fmt: (x) => `${v.fix(x, x < 1 ? 3 : 1)} rad/s` });
        const kS = v.slider('gain $K$', 0.3, 20, 4, { log: true, fmt: (x) => v.fix(x, 2) });
        const iT = v.toggle('integral action ($T_i=1.2$)', true);
        const enS = v.select('disturbance enters at', [{ value: 'out', label: 'plant output' }, { value: 'in', label: 'plant input (load)' }], 'out');
        const ts = v.stage({ x: [0, 1], y: [-1.5, 1.5], height: 290, axes: 'box', xlabel: 't (s)', ylabel: 'output deviation', weight: 1.35, title: 'steady state: open loop vs closed loop' });
        const bd = v.stage({ x: [0.01, 100], y: [0.003, 4], xlog: true, ylog: true, height: 290, axes: 'box', xlabel: 'ω (rad/s)', weight: 1, title: '$|S(i\\omega)|$ predicted and measured' });
        const P = tf([1], [1, 1.25, 0.25]);
        const Cof = () => (iT.value ? tf([kS.value / 1.2, kS.value], [0, 1]) : tf([kS.value], [1]));
        const Lof = () => { const C = Cof(); return tf(pmul(C.num, P.num), pmul(C.den, P.den)); };
        const S = (w) => { const l = tfAt(Lof(), w); return cdiv([1, 0], cadd([1, 0], l)); };
        /** Simulate open and closed loop together with d = sin ωt; return steady-state traces and amplitudes. */
        const run = (w, keep) => {
          const bc = realize(Cof()), bp = realize(P), nc = bc.n, n = nc + 4, per = TAU / w;
          const Tset = iT.value ? 45 : 25, T = Tset + 3 * per, dt = Math.min(0.01, per / 250), out = enS.value === 'out';
          const der = (X, t, dX) => {
            const d = Math.sin(w * t);
            const y = blockStep(bp, X, nc, 0, null) + (out ? d : 0), e = -y, u = blockStep(bc, X, 0, e, dX);
            blockStep(bp, X, nc, u + (out ? 0 : d), dX);
            blockStep(bp, X, nc + 2, out ? 0 : d, dX);
          };
          const tt = [], ycl = [], yol = [], dd = [], stride = Math.max(1, Math.round(per / dt / 240));
          rk4Flat(n, der, T, dt, (X, t, k) => {
            if (t < T - 2.2 * per || k % stride) return;
            const d = Math.sin(w * t);
            tt.push(t); dd.push(d);
            ycl.push(blockStep(bp, X, nc, 0, null) + (out ? d : 0));
            yol.push(blockStep(bp, X, nc + 2, 0, null) + (out ? d : 0));
          });
          const fc = fitSine(tt, ycl, w), fo = fitSine(tt, yol, w);
          return keep ? { tt, ycl, yol, dd, per, ac: fc.amp, ao: fo.amp } : { ac: fc.amp, ao: fo.amp };
        };
        let cur = null, ck = '', sweep = null, sk = '';
        const SW = logspace(0.03, 30, 10);
        v.render(() => {
          const w = wS.value, base = `${kS.value}|${iT.value}|${enS.value}`;
          if (ck !== `${w}|${base}`) { ck = `${w}|${base}`; cur = run(w, true); }
          if (sk !== base) { sk = base; sweep = SW.map((q) => { const r = run(q, false); return [q, r.ac / r.ao]; }); }
          const A = Math.max(0.2, cur.ao, cur.ac) * 1.25, t1 = cur.tt[cur.tt.length - 1];
          ts.setView([t1 - 2 * cur.per, t1], [-A, A]);
          ts.hline(0, { color: 'faint' });
          if (enS.value === 'out') trace(ts, cur.tt, cur.dd, { color: 'purple', width: 1.2, dash: [3, 4] });
          trace(ts, cur.tt, cur.yol, { color: 'red', width: 2.2 });
          trace(ts, cur.tt, cur.ycl, { color: 'accent', width: 2.6 });
          // Bode of |S|
          bd.hband(1, 4, { color: 'red', alpha: 0.06 });
          bd.hline(1, { color: 'muted', width: 1, dash: [4, 4] });
          bd.fn((q) => cabs(S(q)), { color: 'accent', width: 2.4 });
          bd.fn((q) => cabs(tfAt(Lof(), q)), { color: 'purple', width: 1.2, alpha: 0.5 });
          for (const [q, r] of sweep) bd.dot(q, r, { r: 4, color: 'gold' });
          bd.vline(w, { color: 'gold', width: 1.2, alpha: 0.7 });
          bd.dot(w, cur.ac / cur.ao, { r: 8, hollow: true, color: 'gold', width: 2.4 });
          bd.text('amplified', 0.013, 1.9, { size: 11, color: 'red' });
          bd.text('attenuated', 0.013, 0.6, { size: 11, color: 'accent' });
        });
        v.legend([['red', 'no feedback'], ['accent', 'loop closed'], ['purple', 'disturbance $d$ / $|L|$', { dash: true }], ['gold', 'measured ratio', { dot: true }]]);
        v.readout(() => {
          const w = wS.value, r = cur.ac / cur.ao, s = cabs(S(w));
          return `at $\\omega$ = ${v.fix(w, 3)} rad/s: deviation amplitude ${v.fix(cur.ao, 4)} without feedback, ${v.fix(cur.ac, 4)} with it · measured ratio **${v.fix(r, 4)}**, predicted $|S(i\\omega)|$ = ${v.fix(s, 4)} · ${r < 0.98 ? `feedback attenuates by a factor ${v.fix(1 / r, 1)}` : r > 1.02 ? 'feedback **amplifies** at this frequency' : 'feedback has almost no effect here'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9',
      kind: 'Phenomenon',
      name: 'Feedback can destabilise',
      statement: String.raw`Closing a loop around a perfectly stable plant can make the closed loop unstable. With proportional control $u=K(r-y)$:
- for $P(s)=1/(s+1)^3$ the closed-loop poles solve $(s+1)^3+K=0$, so $s=-1-K^{1/3}$ and $s=-1+K^{1/3}e^{\pm i\pi/3}$. The complex pair reaches the imaginary axis at $K=8$, with $\omega=\sqrt3$; for $K>8$ the loop oscillates with growing amplitude;
- for a lag with dead time, $P(s)=e^{-\theta s}/(s+1)$, the loop becomes unstable at the **ultimate gain** $K_u=\sqrt{1+\omega_u^2}$, where $\omega_u$ solves $\arctan\omega_u+\theta\omega_u=\pi$. Longer delays give smaller $K_u$.

As $K$ rises the closed-loop response typically becomes faster, then oscillatory, then unstable.`,
      idea: String.raw`The closed-loop poles are the zeros of $1+KP(s)$ (1.4). They start at the open-loop poles when $K$ is small and move continuously as $K$ grows (6.9); for a plant with three or more lags (or a delay) some branches must head into the right half-plane. In frequency terms: at the frequency where the plant lags by $180^\circ$, the comparator's sign change makes the returning signal reinforce the original, and once the loop gain there reaches $1$, a self-sustained oscillation appears (the Nyquist criterion, 7.4). A delay adds lag $\omega\theta$ without reducing the gain, which is why dead time makes loops fragile (4.9, 7.11).`,
      caption: String.raw`Pick the plant and raise the gain $K$. Top: the closed-loop step response, simulated. Bottom left: the closed-loop poles (blue ×) on the paths they trace as $K$ goes from $0.1$ to $20$ (grey). For the delay plant there are infinitely many poles, and those in the window are found by Newton's method on $(s+1)e^{\theta s}+K=0$. Bottom right: the real part of the rightmost pole against $K$; it crosses zero at the critical gain $K_u$ (dashed). Lengthen the delay $\theta$ and watch $K_u$ fall.`,
      deps: ['ctrl-1.4'],
      refs: ['Åström–Murray ch. 2', 'Franklin–Powell §1.2'],
      tags: ['stability', 'time delay'],
      viz(v) {
        const M = v.M, TEND = 30;
        const plS = v.select('plant', [{ value: 'lag3', label: '$1/(s+1)^3$' }, { value: 'delay', label: '$e^{-\\theta s}/(s+1)$' }], 'lag3', { onChange: (p) => kS.set(p === 'delay' ? 1.8 : 6) });
        const kS = v.slider('gain $K$', 0.1, 20, 6, { log: true, fmt: (x) => v.fix(x, 2) });
        const thS = v.slider('delay $\\theta$', 0.2, 2.5, 1, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} s` });
        const st = v.stage({ x: [0, TEND], y: [-0.8, 2.6], height: 220, axes: 'box', xlabel: 't (s)', ylabel: 'y(t)', full: true, title: 'closed-loop step response' });
        const sp = v.stage({ x: [-4.5, 1.8], y: [-4.5, 4.5], height: 290, axes: true, xlabel: 'Re s', ylabel: 'Im s', weight: 1, title: 'closed-loop poles' });
        const gs = v.stage({ x: [0.1, 20], y: [-2.6, 1.4], xlog: true, height: 290, axes: 'box', xlabel: 'gain K', weight: 1.15, title: 'real part of the rightmost pole' });
        const KS = logspace(0.1, 20, 56);
        /** Roots of (s+1)e^{θs} + K in the window Re ∈ [−8, 4], 0 ≤ Im ≤ 30 by Newton from a grid of seeds, plus conjugates. */
        const delayRoots = (K, th) => {
          const out = [];
          for (let im = 0; im <= 30; im += Math.PI / (2.2 * th)) for (const re of [-3, -0.8, 1]) {
            let z = [re, im];
            for (let it = 0; it < 40; it++) {
              const E = cexp([th * z[0], th * z[1]]), f = cadd(cmul([z[0] + 1, z[1]], E), [K, 0]), fp = cmul(E, [1 + th * (z[0] + 1), th * z[1]]);
              const dz = cdiv(f, fp); z = csub(z, dz);
              if (!isFinite(z[0]) || Math.abs(z[0]) > 40) break;
              if (cabs(dz) < 1e-12) break;
            }
            const E = cexp([th * z[0], th * z[1]]);
            if (!isFinite(z[0]) || cabs(cadd(cmul([z[0] + 1, z[1]], E), [K, 0])) > 1e-7 * Math.max(1, K) || z[0] < -8 || z[0] > 4 || z[1] < -1e-9 || z[1] > 32) continue;
            if (Math.abs(z[1]) < 1e-9) z[1] = 0;
            if (!out.some((q) => Math.hypot(q[0] - z[0], q[1] - z[1]) < 1e-6)) out.push(z);
          }
          return out.flatMap((z) => (z[1] > 0 ? [z, [z[0], -z[1]]] : [z]));
        };
        const roots = (K) => (plS.value === 'lag3' ? M.polyRoots([1 + K, 3, 3, 1]).map((z) => [z.re, z.im]) : delayRoots(K, thS.value));
        let loc = null, lk = '', resp = null, rk = '';
        const ultimate = () => {
          if (plS.value === 'lag3') return { K: 8, w: Math.sqrt(3) };
          const th = thS.value; let lo = 0, hi = Math.PI / th + 10;
          for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (Math.atan(m) + th * m < Math.PI) lo = m; else hi = m; }
          return { K: Math.sqrt(1 + lo * lo), w: lo };
        };
        v.render(() => {
          const K = kS.value, th = thS.value, del = plS.value === 'delay';
          thS.el.hidden = !del;
          const key = `${plS.value}|${del ? th : 0}`;
          if (lk !== key) { lk = key; loc = KS.map((q) => { const rs = roots(q); return { K: q, rs, mx: Math.max(...rs.map((z) => z[0])) }; }); }
          const rkey = `${key}|${K}`;
          if (rk !== rkey) {
            rk = rkey;
            const dt = 0.005, n = del ? 1 : 3, D = Math.round(th / dt), uh = new Float64Array(Math.round(TEND / dt) + 2);
            const uAt = (t) => { const q = t / dt, i = Math.floor(q), f = q - i; if (i < 0) return 0; return uh[i] * (1 - f) + uh[Math.min(i + 1, uh.length - 1)] * f; };
            const tt = [], yy = [];
            rk4Flat(n, (X, t, dX) => {
              if (del) { dX[0] = -X[0] + uAt(t - D * dt); }
              else { const u = K * (1 - X[2]); dX[0] = -X[0] + u; dX[1] = -X[1] + X[0]; dX[2] = -X[2] + X[1]; }
            }, TEND, dt, (X, t, k) => { const y = del ? X[0] : X[2]; uh[k] = K * (1 - y); if (k % 8 === 0) { tt.push(t); yy.push(y); } });
            resp = { tt, yy };
          }
          // ---- step response
          st.hline(1, { color: 'ink', dash: [5, 4], width: 1 });
          st.clip(() => trace(st, resp.tt, resp.yy, { color: 'accent', width: 2.4 }));
          // ---- pole paths and current poles
          sp.vband(0, 10, { color: 'red', alpha: 0.07 });
          const pts = []; for (const L of loc) for (const z of L.rs) pts.push(z);
          sp.dots(pts, { r: 1.6, color: 'muted', alpha: 0.6 });
          sp.dot(-1, 0, { r: 6, hollow: true, color: 'ink', width: 2 });
          const cl = roots(K);
          let hidden = 0;
          for (const z of cl) { if (z[0] < -4.4 || z[0] > 1.7 || Math.abs(z[1]) > 4.3) { hidden++; continue; } cross(sp, z[0], z[1], 0.17, { color: z[0] > 1e-9 ? 'red' : 'accent', width: 3 }); }
          if (del) sp.corner(`${hidden ? `${hidden} more found outside this window; ` : ''}infinitely many in all`, 'bl', { size: 10.5 });
          // ---- rightmost real part vs K
          const U = ultimate();
          gs.hband(0, 2, { color: 'red', alpha: 0.07 });
          gs.hline(0, { color: 'muted', width: 1 });
          gs.path(loc.map((L) => [L.K, L.mx]), { color: 'purple', width: 2.4 });
          gs.vline(U.K, { color: 'red', dash: [5, 4], width: 1.4 });
          gs.text(`K_u = ${v.fix(U.K, 3)}`, U.K, 1.15, { size: 11.5, color: 'red', align: U.K > 4 ? 'right' : 'left', dx: U.K > 4 ? -6 : 6 });
          const mx = Math.max(...cl.map((z) => z[0]));
          gs.dot(K, clamp(mx, -2.55, 1.35), { r: 6, color: mx > 0 ? 'red' : 'accent' });
          gs.text('unstable', 0.13, 0.7, { size: 11, color: 'red' });
        });
        v.legend([['accent', 'stable pole / response'], ['red', 'unstable pole', { dot: true }], ['ink', 'open-loop pole', { dot: true }], ['muted', 'pole paths for $0.1\\le K\\le20$', { dot: true }], ['purple', 'rightmost real part']]);
        v.readout(() => {
          const K = kS.value, cl = roots(K), z = cl.reduce((a, b) => (b[0] > a[0] ? b : a)), U = ultimate();
          const kind = z[0] > 1e-6 ? '**unstable**: the oscillation grows' : Math.abs(z[1]) > 1e-6 ? (z[0] > -0.15 ? 'stable but barely damped' : 'stable, oscillatory') : 'stable, no oscillation';
          const crit = plS.value === 'lag3' ? '$K_u=8$ exactly (poles $\\pm i\\sqrt3$)' : `$K_u=\\sqrt{1+\\omega_u^2}$ = ${v.fix(U.K, 4)} with $\\omega_u$ = ${v.fix(U.w, 4)} rad/s from $\\arctan\\omega_u+\\theta\\omega_u=\\pi$`;
          return `$K$ = ${v.fix(K, 3)}: rightmost pole $${v.fix(z[0], 3)}${Math.abs(z[1]) > 1e-6 ? `\\pm ${v.fix(Math.abs(z[1]), 3)}i` : ''}$ → ${kind} · critical gain ${crit}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10',
      kind: 'Concept',
      name: 'Feedforward versus feedback',
      statement: String.raw`**Feedforward** acts on a measured disturbance (or on the reference) through a model, before the output is affected. If a disturbance $d$ reaches the output through $P_d$ and the control acts through $P$, the ideal feedforward $u_{ff}=-(P_d/P)\,d$ cancels it exactly, provided the model is exact and the inverse can be realised. **Feedback** acts on the measured output: it corrects every cause of error, including unmeasured disturbances and model errors, but only after an error has appeared.

Used together, the error left by a measured disturbance is the feedforward's residual multiplied by the sensitivity function,
$$y=S\,(P_d+P\,F)\,d ,$$
where $F$ is the feedforward compensator. Feedforward lies outside the loop and cannot destabilise it; feedback can. Feedforward needs a good model and a sensor for each disturbance; feedback needs only a sensor for the output.`,
      idea: String.raw`The two strategies fail in opposite ways. A feedforward compensator built from the model is fast and needs no error, but whatever the model gets wrong, and every disturbance nobody measures, passes straight through (open loop, 1.1). Feedback sees everything that reaches the output, but it must wait for the error. Combining them, the feedforward removes most of the measured disturbance at once and feedback cleans up the rest, attenuating the residual by $S$ (1.8). This is the two-degree-of-freedom structure of modern controllers (5.11). In heating, the ideal compensator $-P_d/P$ contains the inverse of the radiator's lag, which is improper; a lead filter approximates it.`,
      caption: String.raw`A room heated by a radiator. At minute 20 the door opens for 15 minutes; a door switch measures it. At minute 80 a window opens, and nothing measures that. Three controllers run on identical rooms: feedback only (PI on the room thermometer, blue), feedforward only (orange; heat added from the door switch through a model with a lead filter for the radiator lag), and both (green). Set the error in the feedforward's model of the door's heat loss. The room picture animates the strategy you choose. Feedforward erases the measured disturbance, ignores the unmeasured one, and leaves its own model error behind; feedback catches everything, but late.`,
      deps: ['ctrl-1.1', 'ctrl-1.8'],
      refs: ['Åström–Murray §1.2', 'Åström–Murray §12.4'],
      tags: ['feedforward', 'disturbance rejection'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Feed_forward_(control)' },
      viz(v) {
        const TEND = 130, Ca = 20, Cr = 3, krr = 0.3, kw = 0.1, Tref = 20, Tout = 0, gd = 0.12, QMAX = 12;
        const tauR = Cr / krr, Kp = 2.5, Ki = 2.5 / 80, Q0 = kw * (Tref - Tout);
        const errS = v.slider('feedforward model error', -0.6, 0.6, -0.3, { step: 0.05, fmt: (x) => `${x > 0 ? '+' : ''}${Math.round(100 * x)} %` });
        const showS = v.select('room shows', [{ value: 'fb', label: 'feedback only' }, { value: 'ff', label: 'feedforward only' }, { value: 'both', label: 'both' }], 'both');
        const room = v.stage({ x: [0, 10], y: [0, 7.4], equal: true, axes: false, height: 270, weight: 0.85, minWidth: 300 });
        const tc = v.stage({ x: [0, TEND], y: [17.5, 20.85], height: 270, axes: 'box', xlabel: 't (min)', ylabel: 'room temperature (°C)', weight: 1.35 });
        const qc = v.stage({ x: [0, TEND], y: [-1.2, 11], height: 160, axes: 'box', xlabel: 't (min)', ylabel: 'heater power (kW)', full: true, yticks: [0, 5, 10] });
        const door = (t) => (t >= 20 && t < 35 ? 1 : 0), win = (t) => (t >= 80 && t < 95 ? 1 : 0);
        const COL = { fb: 'accent', ff: 'orange', both: 'green' };
        let sim = null, sk = '';
        const simulate = () => {
          const k = `${errS.value}`;
          if (k === sk) return sim;
          sk = k;
          const A = gd * (1 + errS.value) * (Tref - Tout);
          const out = {};
          for (const mode of ['fb', 'ff', 'both']) {
            const useFB = mode !== 'ff', useFF = mode !== 'fb';
            // state: [R, T, I (integral of error), q (lead-filter state)]
            const Rt = [], Tt = [], Qt = [], tt = [];
            const Qof = (X, t) => {
              const e = Tref - X[1], ff = useFF ? A * (4 * door(t) - 3 * X[3]) : 0;
              return clamp(Q0 + (useFB ? Kp * e + Ki * X[2] : 0) + ff, 0, QMAX);
            };
            rk4Flat(4, (X, t, dX) => {
              const Q = Qof(X, t), g = kw + gd * door(t) + gd * win(t);
              dX[0] = (Q - krr * (X[0] - X[1])) / Cr;
              dX[1] = (krr * (X[0] - X[1]) - g * (X[1] - Tout)) / Ca;
              dX[2] = Tref - X[1];
              dX[3] = (door(t) - X[3]) / (tauR / 4);
            }, TEND, 0.02, (X, t, kk) => { if (kk % 10 === 0) { tt.push(t); Rt.push(X[0]); Tt.push(X[1]); Qt.push(Qof(X, t)); } }, [Tref + Q0 / krr, Tref, 0, 0]);
            const dev = (a, b) => Math.max(...tt.map((t, i) => (t >= a && t < b ? Math.abs(Tt[i] - Tref) : 0)));
            out[mode] = { tt, Rt, Tt, Qt, door: dev(20, 75), win: dev(80, 130) };
          }
          sim = out;
          return out;
        };
        const at = (arr, tt, t) => arr[clamp(Math.round((t / TEND) * (tt.length - 1)), 0, tt.length - 1)];
        v.animate((t) => {
          const S = simulate(), tm = (t * 10) % TEND, mode = showS.value, R = S[mode];
          // ---- the room
          const Tn = at(R.Tt, R.tt, tm), Qn = at(R.Qt, R.tt, tm), dOpen = door(tm), wOpen = win(tm);
          const cold = clamp((Tref - Tn) / 2.5, 0, 1);
          room.rect(1.6, 0.6, 9, 5.4, { fill: 'blue', fillAlpha: 0.04 + 0.3 * cold, stroke: false });
          const wall = { color: 'ink', width: 4 };
          room.path([[1.6, 3.1], [1.6, 5.4], [9, 5.4], [9, 4.4]], wall); room.path([[9, 2.8], [9, 0.6], [1.6, 0.6], [1.6, 1.0]], wall);
          if (dOpen) {
            room.line(1.6, 1.0, 1.6 - 1.8 * Math.sin(0.9), 1.0 + 1.8 * Math.cos(0.9), { color: 'ink', width: 3 });
            for (let k = 0; k < 3; k++) room.arrow(0.4, 1.4 + k * 0.5, 1.9, 1.4 + k * 0.5, { color: 'teal', width: 1.8, head: 6 });
          } else room.line(1.6, 1.0, 1.6, 3.1, { color: 'ink', width: 3 });
          if (wOpen) {
            room.line(9, 2.8, 9.9, 3.5, { color: 'ink', width: 2.5 });
            for (let k = 0; k < 2; k++) room.arrow(9.9, 3.1 + k * 0.6, 8.6, 3.1 + k * 0.6, { color: 'teal', width: 1.8, head: 6 });
          } else room.line(9, 2.8, 9, 4.4, { color: 'muted', width: 2.5 });
          // radiator, glowing with the heater power
          room.rect(6.6, 0.85, 8.4, 2.0, { fill: 'orange', fillAlpha: 0.12 + 0.75 * (Qn / QMAX), color: 'orange', width: 1.6 });
          for (let x = 6.9; x < 8.4; x += 0.3) room.line(x, 0.95, x, 1.9, { color: 'orange', width: 1 });
          room.text(`${v.fix(Qn, 1)} kW`, 6.45, 1.42, { size: 11.5, color: 'orange', align: 'right', weight: 600 });
          // thermometer
          room.circle(4.6, 1.5, 0.26, { fill: 'red', fillAlpha: 0.85, color: 'ink', width: 1.2 });
          room.rect(4.5, 1.7, 4.7, 3.7, { color: 'ink', width: 1.2 });
          room.rect(4.53, 1.7, 4.67, 1.7 + 2 * clamp((Tn - 16) / 5, 0, 1), { fill: 'red', fillAlpha: 0.85, stroke: false });
          room.text(`${v.fix(Tn, 2)} °C`, 4.95, 2.8, { size: 12.5, color: 'ink', weight: 600 });
          // controller and its inputs
          bdBlock(room, 5.4, 6.55, 2.6, 0.8, '', { color: COL[mode], active: true });
          room.text('controller', 5.4, 6.55, { size: 12, color: 'ink', align: 'center', weight: 600 });
          bdWire(room, [[6.7, 6.55], [7.5, 6.55], [7.5, 2.05]], { color: 'ink', width: 1.6 });
          room.rect(1.75, 3.15, 2.25, 3.45, { fill: 'gold', fillAlpha: 0.8, color: 'ink', width: 1 });
          room.text('door switch', 2.35, 3.3, { size: 10.5, color: 'muted' });
          if (mode !== 'fb') bdWire(room, [[2.0, 3.5], [2.0, 6.55], [4.1, 6.55]], { color: 'orange', width: 1.8, dash: [5, 4] });
          if (mode !== 'ff') bdWire(room, [[4.6, 3.75], [4.6, 6.15]], { color: 'accent', width: 1.8 });
          room.text(dOpen ? 'door open (measured)' : wOpen ? 'window open (not measured)' : '', 5.3, 0.25, { size: 11, color: 'teal', align: 'center', weight: 600 });
          room.corner(`t = ${v.fix(tm, 0)} min`, 'tl', { size: 11.5 });
          // ---- temperatures and powers
          for (const s of [tc, qc]) { s.vband(20, 35, { color: 'gold', alpha: 0.1 }); s.vband(80, 95, { color: 'teal', alpha: 0.1 }); }
          tc.text('door', 27.5, 18.15, { size: 11, color: 'muted', align: 'center' });
          tc.text('window', 87.5, 20.68, { size: 11, color: 'muted', align: 'center' });
          tc.hline(Tref, { color: 'ink', dash: [5, 4], width: 1 });
          for (const m of ['ff', 'fb', 'both']) {
            trace(tc, S[m].tt, S[m].Tt, { color: COL[m], width: m === mode ? 3 : 1.7, alpha: m === mode ? 1 : 0.75 });
            trace(qc, S[m].tt, S[m].Qt, { color: COL[m], width: m === mode ? 2.4 : 1.3, alpha: m === mode ? 1 : 0.6 });
          }
          tc.vline(tm, { color: 'muted', width: 1.2 }); qc.vline(tm, { color: 'muted', width: 1.2 });
          tc.dot(tm, Tn, { r: 5, color: COL[mode] });
        }, { period: TEND / 10, still: 2.7 });
        v.legend([['accent', 'feedback only'], ['orange', 'feedforward only'], ['green', 'feedforward + feedback'], ['gold', 'door open: measured', { area: true }], ['teal', 'window open: not measured', { area: true }]]);
        v.readout(() => {
          const S = simulate(), f = (x) => `${v.fix(x, 2)} °C`;
          return `largest deviation from 20 °C · door (measured): feedback ${f(S.fb.door)}, feedforward ${f(S.ff.door)}, both **${f(S.both.door)}** · window (not measured): feedback ${f(S.fb.win)}, feedforward ${f(S.ff.win)}, both **${f(S.both.win)}**`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11',
      kind: 'Model',
      name: 'Cruise control: a first-order loop',
      statement: String.raw`Near a cruising speed $v_0$ with trim throttle $u_0$, a car's speed obeys, to first order,
$$\frac{d}{dt}\,\delta v=-a\,\delta v+b\,\delta u-g\,\theta ,$$
where $a=\frac{2k_dv_0}{m}$ comes from aerodynamic drag $k_dv^2$, $b=F_{\max}/m$ is the acceleration per unit throttle, and $\theta$ is the road grade. Proportional control $\delta u=-k_p\,\delta v$ gives the closed loop
$$\frac{d}{dt}\,\delta v=-(a+bk_p)\,\delta v-g\,\theta ,$$
a first-order system with time constant $\tau=1/(a+bk_p)$. On a constant grade the speed settles with the **steady-state error**
$$\delta v_\infty=-\frac{g\,\theta}{a+bk_p},$$
which shrinks as the gain grows but never vanishes; integral action removes it (5.2).`,
      scope: String.raw`small speed deviations about $v_0$ (drag linearised), a throttle that stays inside its limits, and a fixed gear; a steep hill that saturates the throttle leaves the linear model.`,
      idea: String.raw`Newton's law for the car is $m\dot v=F_{\max}u-k_dv^2-mg\sin\theta$; linearising about $v_0$ (2.2) gives the model. The closed-loop pole is $-(a+bk_p)$, so feedback speeds the car's response, since without control the only restoring effect is drag, with the long time constant $1/a$. At steady state the controller must supply the extra force $mg\theta$, and a proportional controller produces force only in proportion to an error, so an error of exactly $g\theta/(a+bk_p)$ remains. This is the closed-loop transfer function of 1.4 with the hill as a load disturbance (1.8): $S(0)=a/(a+bk_p)$.`,
      caption: String.raw`A car cruising at 25 m/s meets a hill. Top: the road (vertical scale stretched by the factor shown) with the car where it is at the time you pick by dragging the gold handle in the speed panel. Left: speed from the full nonlinear car model (blue) and from the first-order model (green dashed); the grey curves are other gains. Right: the steady-state error against the gain, predicted by $g\theta/(a+bk_p)$ (curve) and measured in the simulation (dot). Raise $k_p$: the dip gets shallower and shorter. Switch on integral action: the error goes to zero, with an overshoot. Choose the small engine and a steep hill: the throttle saturates and the linear model stops applying.`,
      deps: ['ctrl-1.4'],
      refs: ['Åström–Murray §4.1'],
      tags: ['cruise control', 'first-order system'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Cruise_control' },
      viz(v) {
        const TEND = 45, X0 = 150, RAMP = 40, m = CAR.m0, vr = CAR.vr;
        const kpS = v.slider('gain $k_p$ (throttle per m/s)', 0.02, 2, 0.2, { log: true, fmt: (x) => v.fix(x, 3) });
        const gS = v.slider('hill grade $\\theta$', 0, 12, 6, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} %` });
        const iT = v.toggle('integral action ($T_i=4$ s)', false);
        const enS = v.select('engine', [{ value: 4500, label: 'strong (4.5 kN)' }, { value: 2000, label: 'small (2.0 kN)' }], 4500);
        const road = v.stage({ x: [0, 1150], y: [-12, 75], height: 160, axes: false, full: true });
        const sp = v.stage({ x: [0, TEND], y: [19.5, 26], height: 280, axes: 'box', xlabel: 't (s)', ylabel: 'speed (m/s)', weight: 1.4 });
        const er = v.stage({ x: [0.02, 2], y: [0, 8], xlog: true, height: 280, axes: 'box', xlabel: 'gain k_p', ylabel: 'steady-state error (m/s)', weight: 1 });
        const hT = sp.handle(16, 19.75, { color: 'gold', constrain: (x) => [clamp(x, 0, TEND), hT ? hT.y : 19.75] });
        const grade = (x) => (gS.value / 100) * clamp((x - X0) / RAMP, 0, 1);
        const elev = (x) => { const g = gS.value / 100; if (x <= X0) return 0; if (x <= X0 + RAMP) return (g * (x - X0) ** 2) / (2 * RAMP); return (g * RAMP) / 2 + g * (x - X0 - RAMP); };
        const lin = () => { const F = +enS.value; return { a: (2 * CAR.kd * vr) / m, b: F / m }; };
        /** Nonlinear car + controller, and the linear first-order model driven by the same grade (via the car's position). */
        const simulate = (kp, integ, F) => {
          const u0 = carTrim(vr, m, F), { a, b } = { a: (2 * CAR.kd * vr) / m, b: F / m }, Ti = 4;
          const tt = [], vv = [], vl = [], xx = [], uu = []; let sat = false;
          rk4Flat(5, (X, t, dX) => {
            const e = vr - X[1], raw = u0 + kp * (e + (integ ? X[2] / Ti : 0)), u = clamp(raw, -1, 1);
            dX[0] = X[1]; dX[1] = carAccel(X[1], u, grade(X[0]), m, 0, F);
            dX[2] = integ && (raw === u || Math.sign(e) !== Math.sign(raw - u)) ? e : 0;
            const dvl = X[3], el = X[4];
            dX[3] = -(a + b * kp) * dvl - CAR.g * grade(X[0]) + (integ ? -b * kp * el / Ti : 0);
            dX[4] = dvl;
          }, TEND, 0.01, (X, t, k) => {
            if (k % 10) return;
            const e = vr - X[1], u = u0 + kp * (e + (integ ? X[2] / Ti : 0));
            if (u > 1 || u < -1) sat = true;
            tt.push(t); xx.push(X[0]); vv.push(X[1]); vl.push(vr + X[3]); uu.push(clamp(u, -1, 1));
          }, [0, vr, 0, 0, 0]);
          return { tt, xx, vv, vl, uu, sat };
        };
        const FAM = [0.05, 0.1, 0.4, 1];
        let C = null, ck = '';
        const compute = () => {
          const key = `${kpS.value}|${gS.value}|${iT.value}|${enS.value}`;
          if (key === ck) return C;
          ck = key;
          const F = +enS.value, main = simulate(kpS.value, iT.value, F), fam = FAM.map((k) => simulate(k, iT.value, F));
          const { a, b } = lin(), th = gS.value / 100, pred = iT.value ? 0 : (CAR.g * th / Math.sqrt(1 + th * th)) / (a + b * kpS.value);
          const meas = vr - main.vv[main.vv.length - 1];
          // time to 63 % of the final dip after the car reaches the top of the ramp (first-order time constant)
          const tTop = main.tt[main.xx.findIndex((x) => x >= X0 + RAMP)] ?? 0;
          C = { main, fam, pred, meas, tTop };
          return C;
        };
        v.render(() => {
          const c = compute(), R = c.main, { a, b } = lin(), th = gS.value / 100, sth = th / Math.sqrt(1 + th * th);
          // ---- road (true heights, vertical scale stretched to fit)
          const Hmax = elev(1150), top = Math.max(6, Hmax);
          road.setView(null, [-0.28 * top, 1.45 * top]);
          const pts = []; for (let x = 0; x <= 1150; x += 5) pts.push([x, elev(x)]);
          road.poly([...pts, [1150, -top], [0, -top]], { fill: 'green', fillAlpha: 0.12, stroke: false });
          road.path(pts, { color: 'ink', width: 2.4 });
          const i = clamp(Math.round((hT.x / TEND) * (R.tt.length - 1)), 0, R.tt.length - 1), xc = R.xx[i];
          const ang = Math.atan((grade(xc) * road.sy) / road.sx);
          carIcon(road, xc, elev(xc), ang, { color: 'accent', px: 7.5 });
          road.text(`${v.fix(R.vv[i], 2)} m/s, throttle ${v.fix(100 * R.uu[i], 0)} %`, xc, elev(xc), { size: 11.5, color: 'accent', align: xc > 900 ? 'right' : 'center', weight: 600, dy: -26 });
          if (gS.value > 0) road.text(`grade ${v.fix(gS.value, 1)} %`, X0 + RAMP + 250, elev(X0 + RAMP + 250), { size: 11, color: 'muted', align: 'left', dx: 10, dy: 12 });
          road.corner(`heights exaggerated ×${v.fix(road.sy / road.sx, 0)}`, 'tr', { size: 10.5 });
          // ---- speed (the window widens when the throttle saturates and the car slows a lot)
          const vmin = Math.min(...R.vv), lo = Math.min(19.5, Math.floor(vmin - 0.6));
          sp.setView(null, [lo, 26]); hT.y = lo + 0.25;
          sp.hline(vr, { color: 'ink', dash: [5, 4], width: 1 });
          if (!iT.value) sp.hline(vr - c.pred, { color: 'green', dash: [2, 4], width: 1.2 });
          for (const f of c.fam) sp.clip(() => trace(sp, f.tt, f.vv, { color: 'muted', width: 1.1, alpha: 0.6 }));
          sp.clip(() => { trace(sp, R.tt, R.vv, { color: 'accent', width: 2.8 }); trace(sp, R.tt, R.vl, { color: 'green', width: 2, dash: [7, 5] }); });
          sp.vline(hT.x, { color: 'gold', width: 1.2 });
          sp.dot(hT.x, R.vv[i], { r: 5, color: 'accent' });
          // ---- steady error vs gain
          er.fn((k) => (CAR.g * sth) / (a + b * k), { color: 'green', width: 2.2 });
          er.dot(kpS.value, clamp(c.meas, 0, 7.9), { r: 6.5, color: R.sat ? 'red' : 'accent' });
          if (iT.value) er.text('integral action: error → 0', 0.025, 0.5, { size: 11.5, color: 'accent' });
        });
        v.legend([['accent', 'nonlinear car + controller'], ['green', 'first-order model / $g\\theta/(a+bk_p)$', { dash: true }], ['muted', `other gains ($k_p$ = ${FAM.join(', ')})`]]);
        v.readout(() => {
          const c = compute(), { a, b } = lin(), tau = 1 / (a + b * kpS.value);
          const base = `$a$ = ${v.fix(a, 4)} s⁻¹, $b$ = ${v.fix(b, 2)} m/s² · closed-loop time constant $\\tau=1/(a+bk_p)$ = ${v.fix(tau, 2)} s (open loop: ${v.fix(1 / a, 0)} s)`;
          if (c.main.sat) return `${base} · **the throttle saturates**: the speed keeps falling well below the linear prediction, outside the model's range`;
          return `${base} · steady-state error: predicted ${v.fix(c.pred, 3)} m/s, simulated ${v.fix(c.meas, 3)} m/s`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12',
      kind: 'Phenomenon',
      name: 'Positive feedback and bistability',
      statement: String.raw`When the feedback has the same sign as the input (**positive feedback**) and the loop gain exceeds one, a system can have two stable equilibria separated by an unstable one: it is **bistable**. A small push decides which state it ends up in, and it stays there after the push is gone, so it remembers. Sweeping the input slowly up and back traces a **hysteresis loop**: the state jumps at different input values going up and coming down.

For the saturating loop $\tau\dot x=-x+\tanh(kx+u)$ with feedback gain $k$ and input $u$:
- for $k<1$ (in particular negative feedback, $k<0$) there is exactly one equilibrium, and it is stable;
- for $k>1$ and $|u|<u^*$ there are three equilibria, the outer two stable, where the fold (jump) points are
$$u^*=k\,x^*-\operatorname{artanh}x^*,\qquad x^*=\sqrt{1-1/k}.$$`,
      idea: String.raw`Equilibria are the intersections of the line $y=x$ with the curve $y=\tanh(kx+u)$. An equilibrium is stable when the curve crosses the line from above, that is, when its slope $k(1-x^2)$ is below one (linear stability, 1.4 with loop gain $k(1-x^2)$). With $k>1$ the curve is steeper than the line at the middle crossing, so that equilibrium is unstable and the outer two are stable. Changing $u$ slides the curve sideways; at $u=\pm u^*$ two equilibria merge and vanish (a saddle–node fold), and the state must jump to the far branch. This is the mechanism of latches and flip-flops, Schmitt triggers (circ-8.12), genetic toggle switches and snapping thermostats.`,
      caption: String.raw`Left: the line $y=x$ and the curve $y=\tanh(kx+u)$. Equilibria are where they cross (green = stable, red ring = unstable), and the arrows show which way $x$ moves. Right: the equilibria against the input $u$ (stable branches solid, unstable dashed) with the trajectory of the swept system in gold. Below: input and state against time. With the sweep on, $u$ runs slowly back and forth, and for $k>1$ the state jumps at the folds and traces a hysteresis loop. Turn the sweep off, set $u$ near 0 and *Nudge* the state: it flips and stays. Lower $k$ below 1, or make it negative: the S-curve straightens and the memory is gone.`,
      deps: ['ctrl-1.4'],
      refs: ['Åström–Murray §2.6'],
      tags: ['positive feedback', 'hysteresis'],
      see: ['circ-8.12'],
      viz(v) {
        const PER = 60, UA = 1.05, SP = 6;
        const kS = v.slider('feedback gain $k$', -2, 3, 2, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const swT = v.toggle('sweep the input slowly', true);
        const uS = v.slider('input $u$', -1.2, 1.2, 0.05, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        let nudge = 0;
        v.button('Nudge up', () => { nudge += 0.6; });
        v.button('Nudge down', () => { nudge -= 0.6; });
        const gp = v.stage({ x: [-1.45, 1.45], y: [-1.35, 1.35], height: 290, axes: true, weight: 1, title: 'equilibria: $x=\\tanh(kx+u)$' });
        const hy = v.stage({ x: [-1.3, 1.3], y: [-1.2, 1.2], height: 290, axes: true, xlabel: 'u', ylabel: 'x', weight: 1.15, title: 'equilibrium branches and the swept trajectory' });
        const tp = v.stage({ x: [0, PER * 1.5], y: [-1.35, 1.35], height: 140, axes: 'box', xlabel: 't', full: true });
        const tri = (t) => { const p = ((t / PER) % 1 + 1) % 1; return UA * (p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4); };
        const uNow = (t) => (swT.value ? tri(t) : uS.value);
        const sim = clocked(0.02, () => ({ x: -0.9, seen: nudge, h: { t: [], u: [], x: [] }, k: 0, jumps: [] }), (st, t, dt) => {
          if (st.seen !== nudge) { st.x = clamp(st.x + (nudge - st.seen), -1.2, 1.2); st.seen = nudge; }
          const k = kS.value, u = uNow(t), f = (x) => -x + Math.tanh(k * x + u);
          const k1 = f(st.x), k2 = f(st.x + (dt / 2) * k1), k3 = f(st.x + (dt / 2) * k2), k4 = f(st.x + dt * k3);
          const xn = st.x + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
          if (Math.sign(xn) !== Math.sign(st.x) && st.x !== 0) st.jumps.push({ u, up: xn > st.x });
          st.x = xn;
          if (st.k++ % 5 === 0) { const H = st.h; H.t.push(t + dt); H.u.push(u); H.x.push(st.x); if (H.t.length > 640) for (const key in H) H[key].shift(); }
        });
        const fold = (k) => { if (k <= 1) return null; const xs = Math.sqrt(1 - 1 / k); return { x: xs, u: k * xs - Math.atanh(xs) }; };
        const equilibria = (k, u) => {
          const g = (x) => Math.tanh(k * x + u) - x, out = []; let px = -1.3, pg = g(px);
          for (let i = 1; i <= 2600; i++) {
            const x = -1.3 + (2.6 * i) / 2600, gx = g(x);
            if (gx === 0 || Math.sign(gx) !== Math.sign(pg)) {
              let lo = px, hi = x; for (let j = 0; j < 50; j++) { const m = (lo + hi) / 2; if (Math.sign(g(m)) === Math.sign(g(lo))) lo = m; else hi = m; }
              const r = (lo + hi) / 2; if (!out.some((q) => Math.abs(q - r) < 1e-6)) out.push(r);
            }
            px = x; pg = gx;
          }
          return out.map((x) => ({ x, stable: k * (1 - x * x) < 1 }));
        };
        v.animate((t) => {
          const st = sim.to(t * SP), T = sim.t, k = kS.value, u = uNow(T), H = st.h;
          uS.el.hidden = swT.value;
          // ---- graphical solution
          gp.line(-1.45, -1.45, 1.45, 1.45, { color: 'ink', width: 1.6 });
          gp.fn((x) => Math.tanh(k * x + u), { color: 'accent', width: 2.6 });
          for (let x = -1.3; x <= 1.31; x += 0.2) {
            const d = -x + Math.tanh(k * x + u); if (Math.abs(d) < 0.02) continue;
            gp.arrow(x - 0.06 * Math.sign(d), -1.2, x + 0.06 * Math.sign(d), -1.2, { color: d > 0 ? 'green' : 'red', width: 1.6, head: 6, alpha: 0.7 });
          }
          const eqs = equilibria(k, u);
          for (const e of eqs) e.stable ? gp.dot(e.x, e.x, { r: 6, color: 'green' }) : gp.dot(e.x, e.x, { r: 6, hollow: true, color: 'red', width: 2.2 });
          gp.line(st.x, -1.2, st.x, Math.tanh(k * st.x + u), { color: 'gold', width: 1, dash: [3, 3] });
          gp.dot(st.x, -1.2, { r: 6, color: 'gold' });
          gp.tex(`y=\\tanh(${v.fix(k, 2)}x${u >= 0 ? '+' : '-'}${v.fix(Math.abs(u), 2)})`, -1.35, 1.12, { size: 13, color: 'accent', align: 'left' });
          gp.tex('y=x', 1.0, 1.25, { size: 13, align: 'left' });
          // ---- branches: u = artanh(x) − kx, with stability k(1 − x²) < 1
          const segs = { s: [], u: [] }; let prev = null, run = [];
          for (let i = 1; i < 800; i++) {
            const x = -1 + (2 * i) / 800, uu = Math.atanh(x) - k * x, sb = k * (1 - x * x) < 1;
            if (prev !== null && sb !== prev) { segs[prev ? 's' : 'u'].push(run); run = [run[run.length - 1]]; }
            run.push([uu, x]); prev = sb;
          }
          segs[prev ? 's' : 'u'].push(run);
          for (const r of segs.s) hy.path(r, { color: 'green', width: 2.6 });
          for (const r of segs.u) hy.path(r, { color: 'red', width: 1.8, dash: [6, 4] });
          const F = fold(k);
          if (F) { hy.dot(F.u, -F.x, { r: 4, color: 'red' }); hy.dot(-F.u, F.x, { r: 4, color: 'red' }); hy.vline(F.u, { color: 'red', alpha: 0.35, dash: [2, 4] }); hy.vline(-F.u, { color: 'red', alpha: 0.35, dash: [2, 4] }); }
          hy.path(H.u.map((uu, i) => [uu, H.x[i]]), { color: 'gold', width: 2 });
          hy.dot(u, st.x, { r: 6, color: 'gold' });
          // ---- time traces
          const T0 = Math.max(0, T - PER * 1.5);
          tp.setView([T0, T0 + PER * 1.5], null);
          tp.hline(0, { color: 'faint' });
          trace(tp, H.t, H.u, { color: 'orange', width: 1.8 });
          trace(tp, H.t, H.x, { color: 'accent', width: 2.3 });
        }, { still: 10 });
        v.legend([['accent', '$\\tanh(kx+u)$ / state $x(t)$'], ['green', 'stable equilibria'], ['red', 'unstable equilibria', { dash: true }], ['gold', 'the system now and its trail', { dot: true }], ['orange', 'input $u(t)$']]);
        v.readout(() => {
          const st = sim.state; if (!st) return '';
          const k = kS.value, F = fold(k), u = uNow(sim.t), n = equilibria(k, u).length;
          const up = st.jumps.filter((j) => j.up).slice(-1)[0], dn = st.jumps.filter((j) => !j.up).slice(-1)[0];
          const head = `$k$ = ${v.fix(k, 2)}, $u$ = ${v.fix(u, 3)}: ${n} equilibri${n === 1 ? 'um' : 'a'}, state $x$ = ${v.fix(st.x, 3)}`;
          if (!F) return `${head} · ${k < 0 ? `negative feedback: one equilibrium, and near $x=0$ the response to $u$ is scaled by $1/(1-k)$ = ${v.fix(1 / (1 - k), 3)}` : 'loop gain below one: one equilibrium, no memory'}`;
          const meas = swT.value && up && dn ? ` · measured in the sweep: jumps up at $u$ = ${v.fix(up.u, 3)}, down at $u$ = ${v.fix(dn.u, 3)}` : '';
          return `${head} · bistable for $|u|<u^*$ = ${v.fix(F.u, 4)} (folds at $x^*=\\pm$${v.fix(F.x, 3)})${meas}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13',
      kind: 'Theorem',
      name: 'Mason’s gain formula',
      statement: String.raw`Let a linear system be drawn as a **signal-flow graph**: nodes are signals $x_j$, and a branch $i\to j$ with gain $g_{ij}$ contributes $g_{ij}x_i$ to $x_j$, so $x_j=\sum_i g_{ij}x_i$ (plus the input at the source node). The transfer function from the source $u$ to a sink $y$ is
$$T=\frac{y}{u}=\frac{1}{\Delta}\sum_k P_k\,\Delta_k ,$$
where
- $P_k$ is the gain (product of branch gains) of the $k$-th **forward path**, a path from $u$ to $y$ visiting no node twice;
- a **loop** is a closed path visiting no node twice, and two loops **touch** if they share a node;
- $\Delta=1-\sum L_i+\sum L_iL_j-\sum L_iL_jL_k+\cdots$ (the **graph determinant**), the sums running over single loops, pairs of non-touching loops, triples of mutually non-touching loops, and so on;
- $\Delta_k$ is $\Delta$ computed with only the loops that do not touch path $P_k$.

Moreover $\Delta=\det(I-G)$, where $G$ is the matrix of branch gains, so $T$ is the solution of the linear node equations, and it is defined whenever $\Delta\neq0$.`,
      idea: String.raw`The node equations are $x=G^{\mathsf T}x+b\,u$, so $y/u$ follows from Cramer's rule as a ratio of two determinants of $I-G^{\mathsf T}$. Expanding $\det(I-G)$ as a sum over permutations, each permutation splits into cycles. The cycles that use only branches of the graph are exactly its loops, so the surviving terms are products of disjoint (non-touching) loops with alternating signs: that is $\Delta$. The numerator determinant does the same with one column replaced, which forces a forward path and leaves the loops it does not touch, giving $\sum P_k\Delta_k$. Mason's rule (1953) lets one read the transfer function of a tangled diagram off the picture instead of reducing it block by block (1.4).`,
      caption: String.raw`Step through Mason's recipe on the graph. Forward paths light up green, loops in colour, and sets of loops that do not touch together; then $\Delta$ and each $\Delta_k$ are assembled from them. The last step compares the formula with the transfer function obtained by solving the node equations $(I-G^{\mathsf T})x=b$ directly. Click a branch gain to change it (shift-click to go back); the steps recompute and the two answers always agree. The second graph has three loops that do not touch one another, so a triple product appears in $\Delta$.`,
      deps: ['ctrl-1.4'],
      refs: ['Franklin–Powell §3.2'],
      tags: ['signal-flow graph', 'block diagram'],
      credit: 'Samuel J. Mason, 1953',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mason%27s_gain_formula' },
      viz(v) {
        const M = v.M, VALS = [-2, -1, -0.5, -0.25, 0, 0.25, 0.5, 1, 2, 3];
        const PRESETS = {
          a: {
            label: 'four loops, two paths',
            nodes: [['u', 0, 0], ['x1', 2, 0], ['x2', 4, 0], ['x3', 6, 0], ['x4', 8, 0], ['y', 10, 0]],
            edges: [['u', 'x1', 1], ['x1', 'x2', 2], ['x2', 'x3', 1], ['x3', 'x4', 3], ['x4', 'y', 1], ['x2', 'x1', -0.5, { bend: 26 }], ['x3', 'x2', -0.25, { bend: 26 }], ['x4', 'x3', -0.5, { bend: 26 }], ['x1', 'x4', 0.5, { bend: -70 }]],
          },
          b: {
            label: 'three non-touching loops',
            nodes: [['u', 0, 0], ['x1', 2.5, 0], ['x2', 5, 0], ['x3', 7.5, 0], ['y', 10, 0]],
            edges: [['u', 'x1', 1], ['x1', 'x2', 1], ['x2', 'x3', 1], ['x3', 'y', 1], ['x1', 'x1', -0.5, { angle: 90 }], ['x2', 'x2', -0.5, { angle: 90 }], ['x3', 'x3', -0.5, { angle: 90 }], ['x3', 'x1', -0.5, { bend: 60 }]],
          },
        };
        const prS = v.select('graph', Object.entries(PRESETS).map(([value, o]) => ({ value, label: o.label })), 'a');
        const s = v.stage({ x: [-0.7, 10.7], y: [-1.3, 1.75], equal: true, axes: false, height: 230, full: true });
        const lab = (id) => (id === 'u' ? '$u$' : id === 'y' ? '$y$' : `$x_{${id.slice(1)}}$`);
        const mk = (key) => {
          const P = PRESETS[key];
          return {
            nodes: P.nodes.map(([id, x, y]) => ({ id, x, y, label: lab(id) })),
            edges: P.edges.map(([from, to, w, o]) => ({ from, to, w, ...(o || {}) })),
          };
        };
        const G = v.graph(s, { ...mk('a'), directed: true, weights: true, layout: 'none', draggable: false, r: 15 });
        let shown = 'a';
        // ---- Mason's formula, by enumeration
        const analyse = () => {
          const ids = G.nodes.map((n) => n.id), idx = new Map(ids.map((id, i) => [id, i])), E = G.edges.filter((e) => e.w !== 0);
          const out = (id) => E.filter((e) => e.from === id);
          const paths = [];
          const dfs = (id, seen, es) => { if (id === 'y') { paths.push({ nodes: [...seen], edges: [...es] }); return; } for (const e of out(id)) if (!seen.has(e.to)) { seen.add(e.to); es.push(e); dfs(e.to, seen, es); es.pop(); seen.delete(e.to); } };
          dfs('u', new Set(['u']), []);
          const loops = [];
          ids.forEach((s0, i0) => {
            const go = (id, seen, es) => {
              for (const e of out(id)) {
                if (e.to === s0) loops.push({ nodes: [...seen], edges: [...es, e] });
                else if (!seen.has(e.to) && idx.get(e.to) > i0) { seen.add(e.to); es.push(e); go(e.to, seen, es); es.pop(); seen.delete(e.to); }
              }
            };
            go(s0, new Set([s0]), []);
          });
          const gain = (es) => es.reduce((p, e) => p * e.w, 1);
          paths.forEach((p) => { p.g = gain(p.edges); }); loops.forEach((l) => { l.g = gain(l.edges); l.set = new Set(l.nodes); });
          const touch = (a, b) => a.nodes.some((n) => b.set.has(n));
          const groups = []; // all sets of ≥ 2 mutually non-touching loops
          const rec = (start, cur) => { if (cur.length >= 2) groups.push([...cur]); for (let j = start; j < loops.length; j++) if (cur.every((i) => !touch(loops[i], loops[j]))) { cur.push(j); rec(j + 1, cur); cur.pop(); } };
          rec(0, []);
          const det = (allowed) => { let D = 1; loops.forEach((l, i) => { if (allowed(i)) D -= l.g; }); for (const gset of groups) if (gset.every(allowed)) D += (gset.length % 2 ? -1 : 1) * gset.reduce((p, i) => p * loops[i].g, 1); return D; };
          const Delta = det(() => true);
          paths.forEach((p) => { const ps = new Set(p.nodes); p.free = loops.map((l, i) => i).filter((i) => !loops[i].nodes.some((n) => ps.has(n))); p.D = det((i) => p.free.includes(i)); });
          const T = paths.reduce((s1, p) => s1 + p.g * p.D, 0) / Delta;
          // brute force: (I − Gᵀ) x = e_u
          const n = ids.length, A = M.identity(n).map((r) => r.slice());
          for (const e of E) A[idx.get(e.to)][idx.get(e.from)] -= e.w;
          const b = ids.map((id) => (id === 'u' ? 1 : 0));
          let Tsolve = NaN; try { const x = M.solve(A, b); Tsolve = x[idx.get('y')]; } catch { /* singular */ }
          return { paths, loops, groups, Delta, T, Tsolve, detIG: M.det(A) };
        };
        const LC = ['orange', 'purple', 'teal', 'pink', 'red', 'blue'];
        const num = (x) => v.fix(x, 4).replace(/\.?0+$/, '').replace(/^−?0$/, '0');
        const pTeX = (es) => es.map((e) => `(${num(e.w)})`).join('');
        const framesFor = () => {
          const A = analyse(), F = [];
          F.push({ line: 0, note: String.raw`Node equations $x_j=\sum_i g_{ij}x_i$ (plus $u$ at the source). Mason reads $y/u$ off the picture.`, A });
          A.paths.forEach((p, k) => F.push({ line: 1, path: k, note: String.raw`Forward path $P_{${k + 1}}=${pTeX(p.edges)}=${num(p.g)}$`, A }));
          A.loops.forEach((l, i) => F.push({ line: 2, loops: [i], note: String.raw`Loop $L_{${i + 1}}=${pTeX(l.edges)}=${num(l.g)}$`, A }));
          if (!A.groups.length) F.push({ line: 3, note: 'Every pair of loops shares a node: there are no non-touching loops.', A });
          A.groups.forEach((gs) => F.push({ line: 3, loops: gs, note: String.raw`${gs.length === 2 ? 'Loops' : 'Mutually non-touching loops'} ${gs.map((i) => `$L_{${i + 1}}$`).join(', ')} do not touch: product $${num(gs.reduce((p, i) => p * A.loops[i].g, 1))}$`, A }));
          const sumL = A.loops.map((l, i) => `L_{${i + 1}}`).join('+') || '0';
          F.push({ line: 4, loops: A.loops.map((_, i) => i), note: String.raw`$\Delta=1-(${sumL})${A.groups.length ? '+\\dots' : ''}=${num(A.Delta)}$`, A });
          A.paths.forEach((p, k) => F.push({ line: 5, path: k, loops: p.free, note: p.free.length ? String.raw`Loops not touching $P_{${k + 1}}$: ${p.free.map((i) => `$L_{${i + 1}}$`).join(', ')}, so $\Delta_{${k + 1}}=${num(p.D)}$` : String.raw`$P_{${k + 1}}$ touches every loop, so $\Delta_{${k + 1}}=1$`, A }));
          F.push({ line: 6, final: true, paths: A.paths.map((_, k) => k), note: String.raw`$T=\frac{\sum_k P_k\Delta_k}{\Delta}=\frac{${A.paths.map((p) => `(${num(p.g)})(${num(p.D)})`).join('+') || '0'}}{${num(A.Delta)}}=${num(A.T)}$`, A });
          return F;
        };
        const S = v.steps({
          frames: framesFor,
          code: ['forward paths $P_k$: $u\\to y$, no node twice', 'loops $L_i$: closed paths, no node twice', 'loop sets that share no node', '$\\Delta=1-\\sum L_i+\\sum L_iL_j-\\sum L_iL_jL_k+\\cdots$', '$\\Delta_k$: the same sum over the loops that miss $P_k$', '$T=\\sum_k P_k\\Delta_k/\\Delta$'],
          codeTitle: 'Mason’s gain formula', codePos: 'below', start: 'end', still: 'end',
        });
        G.onClick = ({ edge, shift }) => {
          if (!edge) return true;
          const i = VALS.indexOf(edge.w), j = i < 0 ? VALS.indexOf(1) : clamp(i + (shift ? -1 : 1), 0, VALS.length - 1);
          edge.w = VALS[j === i ? (shift ? VALS.length - 1 : 0) : j];
          S.reset({ at: 'keep' }); v.invalidate();
          return true;
        };
        v.render(() => {
          if (prS.value !== shown) { shown = prS.value; G.set({ ...mk(shown) }); S.reset({ at: 'end' }); }
          const f = S.frame || {}, A = f.A || analyse();
          const onPath = new Set(f.path != null ? A.paths[f.path].edges : (f.paths || []).flatMap((k) => A.paths[k].edges)), loopCol = new Map();
          (f.loops || []).forEach((i, k) => A.loops[i].edges.forEach((e) => { if (!loopCol.has(e)) loopCol.set(e, LC[k % LC.length]); }));
          const inFocus = (e) => onPath.has(e) || loopCol.has(e);
          const any = onPath.size || loopCol.size;
          G.draw({
            edgeColor: (e) => (onPath.has(e) ? 'green' : loopCol.get(e) ?? (e.w === 0 ? 'faint' : null)),
            edgeWidth: (e) => (inFocus(e) ? 3.4 : null),
            edgeDash: (e) => (e.w === 0 ? [4, 4] : null),
            dim: any ? G.edges.filter((e) => !inFocus(e)) : [],
            nodeColor: (id) => (id === 'u' || id === 'y' ? 'accent' : null),
          });
          s.corner('click a gain to change it', 'br', { size: 11 });
        });
        v.readout(() => {
          const A = analyse();
          return `Mason: $T$ = ${v.fix(A.T, 6)} · solving the node equations: $y/u$ = ${v.fix(A.Tsolve, 6)} · $\\Delta$ = ${v.fix(A.Delta, 6)} and $\\det(I-G)$ = ${v.fix(A.detIG, 6)} · ${A.paths.length} forward path${A.paths.length === 1 ? '' : 's'}, ${A.loops.length} loop${A.loops.length === 1 ? '' : 's'}, ${A.groups.length} non-touching set${A.groups.length === 1 ? '' : 's'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14',
      kind: 'Paper',
      name: 'On Governors',
      paper: { authors: 'J. Clerk Maxwell', year: 1868, title: 'On Governors', venue: 'Proceedings of the Royal Society of London 16: 270–283', doi: '10.1098/rspl.1867.0055' },
      introduces: ['ctrl-1.9', 'ctrl-3.3'],
      statement: String.raw`Maxwell gave the first mathematical theory of feedback regulators. He wrote the equations of motion of a machine with its governor, linearised them about steady running, and observed that a small disturbance then evolves as a sum of terms $e^{nt}$, the exponents $n$ being the roots of a polynomial built from the coefficients (the characteristic equation). Steady running is **stable** exactly when every root has a negative real part (the terms die away, oscillating if the roots are complex); a root with positive real part means a disturbance grows, for a complex pair as an oscillation of increasing amplitude, which is the hunting engineers had observed.

For a cubic characteristic equation $a_3n^3+a_2n^2+a_1n+a_0=0$ with positive coefficients he stated the condition: stability requires $a_2a_1>a_3a_0$, the product of the middle coefficients exceeding that of the outer ones. He distinguished *moderators*, which only reduce the speed change caused by a change of load, from true *governors*, whose integral action restores the original speed. He also noted that no general criterion was known for equations of higher degree, a question answered by Routh (1877) and Hurwitz (1895).`,
      idea: String.raw`By the 1860s tens of thousands of centrifugal governors (1.2) were in service, and engineers had found by trial that some designs hunted and that friction, oddly, helped. Maxwell, prompted by governors designed for experiments on electrical standards, replaced trial and error with an analysis. Linearise (2.2), find the characteristic equation, and locate its roots. That reduced stability to algebra (3.3, the Routh–Hurwitz problem 6.2) and explained why more governor gain is dangerous (1.9). Vyshnegradsky (1876) independently analysed the Watt governor on a steam engine, the third-order system recreated here, and drew its stability diagram. The paper is often taken as the beginning of control theory.`,
      caption: String.raw`Maxwell's analysis, recreated for a Watt governor on a steam engine (the model of 1.2). Drag the point in the plane of governor friction $\beta$ and linkage gain $K$. The bold curve is Maxwell's boundary $a_2a_1=a_3a_0$ for the linearised cubic; the shading shows how the roots, computed by the cubic formula, behave (blue: decaying oscillation, green: all roots real, slow creep, red: unstable). Right: the three roots in the complex plane, with the path they follow as $K$ varies at this friction. Below: the full nonlinear engine after an 8 % load increase, which settles, hunts with growing oscillations until the valve slams between its stops, or creeps back sluggishly. Raise the gain or remove friction and watch the pair of roots cross the imaginary axis exactly as the point crosses the curve.`,
      deps: ['ctrl-1.2', 'ctrl-2.2'],
      refs: [],
      tags: ['stability', 'history of control'],
      credit: 'J. C. Maxwell, 1868',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/On_Governors' },
      viz(v) {
        const BX = [0, 3.2], KY = [0.02, 12], TEND = 170, TSTEP = 12;
        const pl = v.stage({ x: [BX[0], BX[1]], y: KY, ylog: true, height: 300, axes: 'box', xlabel: 'friction β', ylabel: 'linkage gain K', weight: 1.15, title: 'stability chart: $a_2a_1$ vs $a_3a_0$' });
        const cp = v.stage({ x: [-2.2, 0.6], y: [-1.4, 1.4], equal: true, height: 300, axes: true, xlabel: 'Re', ylabel: 'Im', weight: 1, title: 'roots of the characteristic cubic' });
        const ts = v.stage({ x: [0, TEND], y: [72, 128], height: 190, axes: 'box', xlabel: 't', ylabel: 'speed (% of design)', full: true, yticks: [80, 90, 100, 110, 120] });
        const H = pl.handle(1.1, 1.4, { color: 'gold', constrain: (x, y) => [clamp(x, 0.03, BX[1] - 0.02), clamp(y, KY[0] * 1.05, KY[1] / 1.05)] });
        const kOf = (beta) => { // Maxwell's boundary a2·a1 = a3·a0 solved for K
          const { phi0 } = GOV, kap = Math.sin(phi0) ** 2 / Math.cos(phi0), a = 2 * GOV.w0 * Math.sin(phi0) * Math.cos(phi0), { J, c } = GOV;
          return ((J * beta + c) * (J * kap + c * beta) - J * c * kap) / (J * a * GOV.Ts * Math.sin(phi0));
        };
        const classify = (beta, K) => {
          const { coef } = govCubic({ K, beta }), r = cubicRoots(coef), mr = Math.max(...r.map((z) => z[0]));
          return mr > 0 ? 2 : r.some((z) => Math.abs(z[1]) > 1e-9) ? 0 : 1;
        };
        const COLS = [v.rgb('blue'), v.rgb('green'), v.rgb('red')], panel = v.rgb('panel');
        let resp = null, rk = '';
        v.render(() => {
          const beta = H.x, K = H.y, p = { K, beta };
          // ---- chart
          pl.raster((x, y) => { if (x <= 0 || y <= 0) return null; const c = COLS[classify(x, y)], t = 0.22; return [panel[0] + (c[0] - panel[0]) * t, panel[1] + (c[1] - panel[1]) * t, panel[2] + (c[2] - panel[2]) * t]; }, { res: 3, key: `chart|${v.color('panel')}` });
          pl.axes();
          pl.fn((b) => (kOf(b) > 0 ? kOf(b) : NaN), { color: 'ink', width: 2.6, domain: [0, BX[1]] });
          pl.text('hunting (unstable)', 0.15, 4.5, { size: 12, color: 'red', weight: 600 });
          pl.text('decaying oscillation', 2.2, 0.9, { size: 12, color: 'blue', weight: 600, align: 'center' });
          pl.text('creep: all roots real', 1.58, 0.045, { size: 12, color: 'green', weight: 600, align: 'left' });
          pl.tex('a_2a_1=a_3a_0', 2.0, kOf(2.0) / 1.6, { size: 13, align: 'center' });
          // ---- roots and their path in K at this friction
          const r = cubicRoots(govCubic(p).coef);
          cp.vband(0, 2, { color: 'red', alpha: 0.07 });
          const path = [];
          for (let k = KY[0]; k <= KY[1]; k *= 1.03) for (const z of cubicRoots(govCubic({ K: k, beta }).coef)) path.push(z);
          cp.dots(path, { r: 1.5, color: 'muted', alpha: 0.6 });
          for (const z of r) cross(cp, clamp(z[0], -2.15, 0.55), clamp(z[1], -1.35, 1.35), 0.07, { color: z[0] > 0 ? 'red' : 'accent', width: 3 });
          // ---- nonlinear response to a load step
          const key = `${beta}|${K}`;
          if (rk !== key) {
            rk = key;
            const eq = govEquilibrium(p, GOV.TL0), x = [eq.w, eq.phi, 0], tt = [], ww = [];
            for (let k = 0; k * 0.02 <= TEND; k++) { const t = k * 0.02; if (k % 10 === 0) { tt.push(t); ww.push((100 * x[0]) / GOV.w0); } govStep(p, x, 0.02, t >= TSTEP ? GOV.TL0 * 1.08 : GOV.TL0); }
            resp = { tt, ww, eq2: govEquilibrium(p, GOV.TL0 * 1.08) };
          }
          ts.hline(100, { color: 'ink', dash: [5, 4], width: 1 });
          if (!resp.eq2.stop) ts.hline((100 * resp.eq2.w) / GOV.w0, { color: 'green', dash: [6, 4], width: 1.3 });
          ts.vline(TSTEP, { color: 'purple', dash: [3, 3], width: 1.2 });
          ts.text('load +8 %', TSTEP + 1.5, 84, { size: 11, color: 'purple' });
          ts.clip(() => trace(ts, resp.tt, resp.ww, { color: classify(beta, K) === 2 ? 'red' : 'accent', width: 2.3 }));
        });
        v.legend([['blue', 'decaying oscillation', { area: true }], ['green', 'aperiodic (creep)', { area: true }], ['red', 'unstable (hunting)', { area: true }], ['muted', 'root paths as $K$ varies', { dot: true }]]);
        v.readout(() => {
          const p = { K: H.y, beta: H.x }, g = govCubic(p), [a0, a1, a2, a3] = g.coef, r = cubicRoots(g.coef), mr = Math.max(...r.map((z) => z[0]));
          const ok = g.middle > g.outer;
          return `cubic $${v.fix(a3, 2)}\\,n^3+${v.fix(a2, 3)}\\,n^2+${v.fix(a1, 3)}\\,n+${v.fix(a0, 3)}$ · Maxwell: $a_2a_1$ = ${v.fix(g.middle, 3)} ${ok ? '>' : '<'} $a_3a_0$ = ${v.fix(g.outer, 3)} → **${ok ? 'stable' : 'unstable'}** · roots by the cubic formula: largest real part ${v.fix(mr, 4)} → ${mr < 0 ? 'stable' : 'unstable'}${(mr < 0) === ok ? ', in agreement (and with the modern Routh–Hurwitz test, identical for a cubic)' : ''}`;
        });
      },
    },
  ],
};
