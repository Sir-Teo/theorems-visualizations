// Computational Neuroscience — Chapter 3 (part b): 3.6 Morris–Lecar, 3.7 quadratic integrate-and-fire and theta neuron,
// 3.8 bursting by fast–slow dissection, 3.9 Izhikevich's simple model.
//
// Facts used and how they were checked (Oct 2026):
// - Crossref-checked: Morris & Lecar 1981, Biophys. J. 35: 193–213 (10.1016/S0006-3495(81)84782-0); Ermentrout & Kopell 1986, SIAM J. Appl.
//   Math. 46: 233–253 (10.1137/0146017); Rinzel 1987, in Mathematical Topics in Population Biology, Morphogenesis and Neurosciences
//   (Lecture Notes in Biomathematics), pp. 267–281 (10.1007/978-3-642-93360-8_26); Izhikevich 2003, IEEE Trans. Neural Netw. 14: 1569–1572
//   (10.1109/TNN.2003.820440).
// - Izhikevich parameter sets: regular spiking (0.02, 0.2, −65, 8), intrinsically bursting (0.02, 0.2, −55, 4), chattering (0.02, 0.2, −50, 2)
//   and fast spiking (0.1, 0.2, −65, 2) were confirmed in a published parameter table that quotes the 2003 paper; low-threshold spiking
//   (0.02, 0.25, −65, 2) was not independently confirmed (verify). The step currents are this page's choice.
// - The bursting model (Morris–Lecar with a slow calcium-like variable) is built and tuned on this page: its parameters are not from a paper.
import { ION_COL, trace, rk4, ML_SETS, mlF, mlWinf, mlWnull, mlEquilibria, mlCurve, mlOrbit, BURST, burstOrbit, burstFastEq, burstFastCycle, IZH, izhRun } from './ch03.shared.js';

function eqDot(s, x, y, type, label) {
  if (type === 'stable') s.dot(x, y, { r: 6, color: 'green', label, labelPos: 'ne' });
  else if (type === 'saddle') s.dot(x, y, { r: 6, color: 'ink', hollow: true, label, labelPos: 'ne' });
  else s.dot(x, y, { r: 6, color: 'red', hollow: true, label, labelPos: 'ne' });
}
const clampTo = (x, a, b) => Math.min(b, Math.max(a, x));

export default {
  collection: 'neuro',
  chapter: 3,
  items: [
    // ------------------------------------------------------------------ 3.6
    {
      num: '3.6',
      kind: 'Model',
      name: 'Morris–Lecar model',
      statement: String.raw`The Morris–Lecar model describes the voltage of an excitable membrane with an instantaneous calcium current, a delayed potassium current with one gating variable $w$, and a leak:
$$C\dot V = I - g_L(V-E_L) - g_{Ca}\,m_\infty(V)\,(V-E_{Ca}) - g_K\,w\,(V-E_K),\qquad \dot w = \phi\,\frac{w_\infty(V)-w}{\tau_w(V)},$$
with $m_\infty=\tfrac12[1+\tanh((V-V_1)/V_2)]$, $w_\infty=\tfrac12[1+\tanh((V-V_3)/V_4)]$ and $\tau_w=1/\cosh((V-V_3)/2V_4)$. Two of the parameters, $V_3,V_4$ (the position and steepness of the potassium activation) and $\phi$, control how excitability is lost at the onset of firing: with one textbook choice the resting state vanishes in a saddle-node on an invariant circle (firing starts at zero frequency, type I), with another it loses stability through a Hopf bifurcation (firing starts at a non-zero frequency, type II). The same two-variable model therefore shows both classes.`,
      idea: String.raw`The model came from experiments on the barnacle giant muscle fibre, whose spikes are carried by calcium rather than sodium; the fast calcium conductance plays the role of sodium activation in the reduced Hodgkin–Huxley model (neuro-3.1), so that the phase plane has the same structure as FitzHugh–Nagumo's (neuro-3.2), with a sigmoidal rather than cubic $V$-nullcline. Moving the potassium activation curve to the right and speeding it up changes how the $w$-nullcline cuts the $V$-nullcline: it crosses the middle branch near its knee so that the equilibrium disappears by merging with a saddle (neuro-3.5), or it crosses the middle branch where the equilibrium turns into an unstable focus (neuro-3.4).`,
      caption: String.raw`Choose a parameter set and drag the current. Left: the phase plane with the two nullclines, the equilibria and the orbit that starts near rest. Middle: $V(t)$ for a current step switched on at 50 ms. Right: the $f$–$I$ curves of both sets computed by simulation (dots), with yours marked. Switch the set: with the saddle-node set firing starts near 40 µA/cm² at low rates; with the Hopf set it starts near 90 µA/cm² at about 10 Hz, after a small bistable window where rest and firing coexist.`,
      scope: String.raw`Space-clamped barnacle-muscle-like membrane (voltage in mV, time in ms, current in µA/cm²). The two parameter sets are standard textbook choices quoted from memory, not the values fitted in the 1981 paper, and the rate curves are produced by the model, not measured.`,
      deps: ['neuro-3.1'],
      see: ['neuro-3.4', 'neuro-3.5', 'neuro-2.8'],
      refs: ['Gerstner §4.4'],
      tags: ['calcium', 'type I and II'],
      credit: 'C. Morris and H. Lecar, 1981 (Biophys. J. 35: 193–213)',
      links: { doi: 'https://doi.org/10.1016/S0006-3495(81)84782-0' },
      verify: true,
      viz(v) {
        const sel = v.select('parameter set', [{ value: 'snic', label: 'saddle-node set' }, { value: 'hopf', label: 'Hopf set' }], 'snic', { onChange: () => Isl.set(sel.value === 'snic' ? 45 : 100) });
        const Isl = v.slider('current $I$', 0, 112, 45, { step: 0.5, fmt: (x) => `${x} µA/cm²` });
        const sA = v.stage({ x: [-70, 60], y: [-0.05, 0.8], axes: 'box', gutter: true, xlabel: 'V (mV)', ylabel: 'w', height: 320, weight: 1.1, minWidth: 300 });
        const sB = v.stage({ x: [0, 300], y: [-70, 50], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 320, weight: 1, minWidth: 260 });
        const sC = v.stage({ x: [0, 112], y: [0, 28], axes: 'box', gutter: true, xlabel: 'I (µA/cm²)', ylabel: 'rate (Hz)', height: 320, weight: 1, minWidth: 260 });
        const grid = Array.from({ length: 29 }, (_, i) => 4 * i);
        v.render(() => {
          const p = ML_SETS[sel.value], I = Isl.value;
          sA.fn((V) => mlWnull(p, V, I), { color: 'orange', width: 2.2, domain: [-69, 60] });
          sA.fn((V) => mlWinf(p, V), { color: 'purple', width: 2.2 });
          const eq = mlEquilibria(p, I);
          sA.path(mlOrbit(p, I, 500, { dt: 0.25, every: 2 }).map((y) => [y[0], y[1]]), { color: 'accent', width: 2 });
          for (const e of eq) eqDot(sA, e.V, e.w, e.type);
          // current step at t = 50 ms from rest at I = 0
          const rest = mlEquilibria(p, 0).find((e) => e.type === 'stable'), F = (s, i) => (y) => mlF(p, y[0], y[1], i);
          let y = [rest.V, rest.w]; const pts = [];
          for (let k = 0; k <= 1200; k++) { const t = k * 0.25; if (k % 2 === 0) pts.push([t, y[0]]); y = rk4(F(null, t >= 50 ? I : 0), y, 0.25); }
          sB.path(pts, { color: 'accent', width: 2 });
          sB.rect(0, -70, 50, -66, { fill: 'gold', fillAlpha: 0.0, stroke: false }); sB.vline(50, { color: 'gold', dash: [4, 4], width: 1.2 });
          for (const [name, col] of [['snic', 'teal'], ['hopf', 'pink']]) {
            const c = mlCurve(name, grid);
            sC.path(c.map((r) => [r[0], r[1]]), { color: col, width: name === sel.value ? 2.8 : 1.4, alpha: name === sel.value ? 1 : 0.6 });
          }
          const r = mlCurve(sel.value, [I])[0][1];
          sC.dot(I, r, { r: 6, color: 'gold' });
          v._r = { eq, r };
        });
        v.legend([['orange', '$\\dot V=0$'], ['purple', '$\\dot w=0$'], ['accent', 'orbit / $V(t)$'], ['teal', '$f$–$I$, saddle-node set'], ['pink', '$f$–$I$, Hopf set']]);
        v.readout(() => {
          const r = v._r; if (!r) return '';
          return String.raw`${sel.value === 'snic' ? 'saddle-node set' : 'Hopf set'}: equilibria ${r.eq.map((e) => `${e.type} at $V=${v.fix(e.V, 1)}$`).join(', ') || 'none'} · steady firing rate $${v.fix(r.r, 1)}$ Hz`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.7
    {
      num: '3.7',
      kind: 'Model',
      name: 'Quadratic integrate-and-fire and the theta neuron',
      statement: String.raw`The quadratic integrate-and-fire (QIF) neuron is the normal form of a type I membrane near its saddle-node: $\dot V = V^2 + I$ in rescaled units, with the rule that when $V$ reaches a peak value $V_p$ it is reset to $-V_p$. Without a cutoff, a solution with $I>0$ is $V(t)=\sqrt I\tan(\sqrt I\,t + c)$ and escapes to infinity in finite time; letting $V_p\to\infty$ the interval between spikes is exactly
$$T=\frac{\pi}{\sqrt{I}}\quad(I>0),$$
and for finite $V_p$ it is $T=\tfrac{2}{\sqrt I}\arctan(V_p/\sqrt I)$. The substitution $V=\tan(\theta/2)$ turns the blow-up into a smooth rotation on a circle, the **theta neuron**:
$$\dot\theta = (1-\cos\theta) + I\,(1+\cos\theta),$$
where a spike is the passage through $\theta=\pi$. For $I<0$ there are two equilibria $V=\pm\sqrt{-I}$ (a stable one and an unstable one, i.e. rest and threshold) at $\cos\theta=(1+I)/(1-I)$; they merge at $I=0$ and vanish.`,
      idea: String.raw`The equation $\dot V=V^2+I$ is the saddle-node normal form (neuro-3.5), and the whole firing curve $f=\sqrt I/\pi$ comes from integrating $\mathrm d V/(V^2+I)$ from $-\infty$ to $\infty$. Compactifying the real line to a circle by $V=\tan(\theta/2)$ (a stereographic-type change of variable) removes the singularity: the point at infinity is $\theta=\pi$, and $\dot\theta$ is a smooth function of $\theta$ that vanishes at two points when $I<0$ and nowhere when $I>0$. Ermentrout and Kopell used this form to analyse bursting and synchrony; its single-variable phase equation is also the standard phase model of a type I neuron's response to input.`,
      caption: String.raw`Choose $I$ and a starting voltage and let the clock run. Left: the voltage $V(t)$ with its cutoff and reset; the dotted line is the true solution that blows up. Middle: the same state as an angle $\theta$ on a circle (spike at the left point); for $I<0$ a stable (green) and unstable (red) equilibrium appear. Right: the parabola $\dot V=V^2+I$ with the state sliding on it. The readout compares the simulated interspike interval with $\pi/\sqrt I$ and with the exact finite-cutoff formula.`,
      scope: String.raw`A canonical model near a saddle-node on an invariant circle: it captures the generic type I onset, the spike latency and the $\sqrt I$ rate law, but not spike shape or adaptation. In dimensionless units (time is measured so that the coefficients are 1); the cutoff values $V_p$ are numerical devices.`,
      deps: ['neuro-3.5'],
      see: ['neuro-5.3', 'neuro-3.9'],
      refs: ['Gerstner §5.3'],
      tags: ['normal form', 'type I'],
      credit: 'G. B. Ermentrout and N. Kopell, 1986 (SIAM J. Appl. Math. 46: 233–253)',
      links: { doi: 'https://doi.org/10.1137/0146017' },
      viz(v) {
        const I = v.slider('input $I$', -1, 3, 0.5, { step: 0.05 });
        const V0 = v.slider('start $V(0)$', -4, 4, -2, { step: 0.1 });
        const cut = v.select('cutoff $V_p$', [{ value: 5, label: '5' }, { value: 20, label: '20' }, { value: 100, label: '100' }], 20);
        const TEND = 12, DT = 0.005;
        const sA = v.stage({ x: [0, TEND], y: [-6, 6], axes: 'box', gutter: true, xlabel: 't', ylabel: 'V', height: 300, weight: 1.3, minWidth: 320 });
        const sB = v.stage({ x: [-1.6, 1.6], y: [-1.6, 1.6], equal: true, axes: false, height: 300, weight: 0.9, minWidth: 240 });
        const sC = v.stage({ x: [-4, 4], y: [-2, 8], axes: true, height: 300, weight: 1, minWidth: 260, xlabel: 'V', ylabel: 'dV/dt' });
        let key = '', S = null;
        const get = () => {
          const k = `${I.value}|${V0.value}|${cut.value}`; if (k === key) return S; key = k;
          const i = I.value, thp = 2 * Math.atan(cut.value), F = (y) => [1 - Math.cos(y[0]) + i * (1 + Math.cos(y[0]))];
          let th = 2 * Math.atan(clampTo(V0.value, -cut.value, cut.value)); const th_ = [th], spikes = [], N = Math.round(TEND / DT);
          for (let n = 1; n <= N; n++) { th = rk4(F, [th], DT)[0]; if (th >= thp) { spikes.push(n * DT); th = -thp; } th_.push(th); }
          // true solution with no cutoff (before the first blow-up)
          const free = []; if (i > 0) { const a = Math.sqrt(i), c0 = Math.atan(V0.value / a), tb = (Math.PI / 2 - c0) / a; for (let t = 0; t < Math.min(tb, TEND); t += 0.02) free.push([t, a * Math.tan(a * t + c0)]); }
          S = { th: th_, spikes, free, thp, i };
          return S;
        };
        v.animate((tt) => {
          const R = get(), t = tt % TEND, n = Math.min(R.th.length - 1, Math.round(t / DT));
          const Vt = R.th.map((th) => Math.tan(th / 2));
          const pts = []; for (let k = 0; k < Vt.length; k += 4) pts.push([k * DT, Vt[k]]);
          sA.hline(cut.value, { color: 'faint', dash: [3, 4], width: 1 }); sA.hline(-cut.value, { color: 'faint', dash: [3, 4], width: 1 });
          sA.path(R.free.filter((q) => Math.abs(q[1]) < 12), { color: 'muted', width: 1.4, dash: [2, 4] });
          // draw with breaks at resets
          let seg = []; const segs = [];
          for (let k = 0; k < pts.length; k++) { if (k && pts[k][1] < pts[k - 1][1] - 1) { segs.push(seg); seg = []; } seg.push(pts[k]); }
          segs.push(seg);
          for (const sg of segs) sA.path(sg, { color: 'accent', width: 1.4, alpha: 0.35 });
          const upto = []; for (let k = 0; k <= n; k += 4) upto.push([k * DT, Vt[k]]);
          let seg2 = []; const segs2 = [];
          for (let k = 0; k < upto.length; k++) { if (k && upto[k][1] < upto[k - 1][1] - 1) { segs2.push(seg2); seg2 = []; } seg2.push(upto[k]); }
          segs2.push(seg2);
          for (const sg of segs2) sA.path(sg, { color: 'accent', width: 2.4 });
          sA.dot(t, clampTo(Vt[n], -5.9, 5.9), { r: 6, color: 'gold' });
          for (const sp of R.spikes) sA.line(sp, 5.2, sp, 6, { color: 'accent', width: 1.5 });
          // circle
          const th = R.th[n];
          sB.curve((a) => [Math.cos(a), Math.sin(a)], -Math.PI, Math.PI, { color: 'muted', width: 2 });
          if (R.i < 0) { const c = (1 + R.i) / (1 - R.i), a = Math.acos(c); sB.dot(Math.cos(a), Math.sin(a), { r: 6, color: 'red', hollow: true, label: 'threshold', labelPos: 'ne' }); sB.dot(Math.cos(a), -Math.sin(a), { r: 6, color: 'green', label: 'rest', labelPos: 'se' }); }
          sB.text('spike (θ = π)', -1.12, 0, { size: 11, color: 'muted', align: 'right' });
          sB.arrow(0, 0, Math.cos(th), Math.sin(th), { color: 'accent', width: 1.6 });
          sB.dot(Math.cos(th), Math.sin(th), { r: 7, color: 'gold' });
          sB.text('θ', 0, 0, { size: 12, color: 'ink', dy: 12, align: 'center', math: true });
          // parabola
          sC.fn((x) => x * x + R.i, { color: 'orange', width: 2.2 });
          sC.hline(0, { color: 'ink', width: 1 });
          if (R.i < 0) { const a = Math.sqrt(-R.i); sC.dot(-a, 0, { r: 6, color: 'green' }); sC.dot(a, 0, { r: 6, color: 'red', hollow: true }); }
          const Vc = clampTo(Vt[n], -3.95, 3.95); sC.dot(Vc, Vc * Vc + R.i, { r: 6, color: 'gold' });
          v._r = R;
        }, { period: TEND, still: 5 });
        v.legend([['accent', '$V(t)$ with cutoff and reset'], ['muted', 'no cutoff (blows up)', { dash: true }], ['orange', '$V^2+I$']]);
        v.readout(() => {
          const R = v._r; if (!R) return '';
          const T = R.spikes.length > 1 ? (R.spikes[R.spikes.length - 1] - R.spikes[0]) / (R.spikes.length - 1) : NaN;
          if (R.i <= 0) return String.raw`$I=${v.fix(R.i, 2)}\le 0$: ${R.i < 0 ? String.raw`equilibria at $V=\pm${v.fix(Math.sqrt(-R.i), 3)}$; started above the unstable one, the voltage escapes and resets; below it, it settles at rest.` : 'the two equilibria have merged at $V=0$ (saddle-node).'} Spikes in this window: ${R.spikes.length}`;
          const a = Math.sqrt(R.i);
          return String.raw`simulated interspike interval $${v.fix(T, 3)}$ · exact for cutoff $V_p=${cut.value}$: $\tfrac{2}{\sqrt I}\arctan(V_p/\sqrt I)=${v.fix((2 / a) * Math.atan(cut.value / a), 3)}$ · infinite cutoff: $\pi/\sqrt I=${v.fix(Math.PI / a, 3)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.8
    {
      num: '3.8',
      kind: 'Phenomenon',
      name: 'Bursting by fast–slow dissection',
      statement: String.raw`Bursting is a rhythm in which clusters of spikes alternate with silent periods. It arises when a fast subsystem that can both rest and spike (here a membrane model $\dot x=F(x,z)$) is modulated by a slow variable $z$ with $\dot z=\epsilon\,g(x,z)$, $0<\epsilon\ll1$. **Dissection** treats $z$ as a frozen parameter: the bifurcation diagram of the fast subsystem against $z$ shows a branch of resting states and a branch of spiking cycles. If the slow variable rises while the neuron spikes and falls while it rests, the full trajectory follows the spiking branch until it ends and the resting branch until it ends, and then switches to the other: spikes in clusters, with burst duration set by $\epsilon$. In the model of this page (Morris–Lecar with a slow Ca$^{2+}$-activated K$^+$ current) the rest branch ends at a fold of equilibria and the spiking branch ends where the cycle's period grows without bound (square-wave bursting in Rinzel's classification).`,
      idea: String.raw`Each spike lets in calcium, so the slow variable $z$ builds up (it integrates the calcium current, with leakage), and the K$^+$ current it activates grows until it can no longer sustain the spiking cycle. The neuron then falls to the resting branch of the fast subsystem, where there is no calcium entry and $z$ decays until the resting state disappears at a saddle-node (neuro-3.5); the neuron jumps back to the spiking cycle. The number of spikes per burst is the ratio of the time spent on the spiking branch to the interspike interval, and it increases as $\epsilon$ decreases. The model is built on the Morris–Lecar equations (neuro-3.6); the specific slow current and constants are choices made for this page that produce clear bursts.`,
      caption: String.raw`Left: the voltage and the slow variable $z$ over eight seconds (gold dot: the current time). Right: the bifurcation diagram of the fast subsystem with $z$ frozen: the lower and upper stable (green) and unstable (red, hollow) equilibria and the extremes of the spiking cycle (blue); the full trajectory $(z(t),V(t))$ is overlaid and moves around this diagram like a hysteresis loop. Slow down $z$ (smaller $\epsilon$) to get longer bursts and more spikes in each; change $I$ and the bursts lengthen, shorten or turn into tonic firing or rest.`,
      scope: String.raw`A mathematical model: the slow current and constants are tuned, not fitted to a recorded cell, and the dissection is accurate to the extent that $\epsilon$ is small (here the slow variable moves by about 0.4 in one burst while the spikes last a few tens of ms each). The quoted cycle extremes are found by simulating the frozen fast subsystem from a single starting point for 900 ms, so very slow cycles near the end of the branch may be missed.`,
      deps: ['neuro-3.6'],
      see: ['neuro-3.5', 'neuro-3.9'],
      refs: ['Dayan–Abbott ch. 6'],
      tags: ['bursting', 'fast–slow'],
      credit: 'Classification of bursting mechanisms: J. Rinzel, 1987 (Lecture Notes in Biomathematics, pp. 267–281)',
      links: { doi: 'https://doi.org/10.1007/978-3-642-93360-8_26' },
      verify: true,
      viz(v) {
        const eps = v.slider('slow rate $\\epsilon$', 0.0003, 0.003, 0.001, { log: true, sig: 2, fmt: (x) => x.toFixed(4) });
        const Isl = v.slider('current $I$', 44, 60, 50, { step: 0.5, fmt: (x) => `${x} µA/cm²` });
        const TEND = 8000;
        const sA = v.stage({ x: [0, TEND], y: [-60, 30], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 240, weight: 1.3, minWidth: 340 });
        const sZ = v.stage({ x: [0, TEND], y: [0.4, 1.1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'slow z', height: 170, weight: 1.3, minWidth: 340 });
        const sB = v.stage({ x: [0.3, 1.2], y: [-45, 22], axes: 'box', gutter: true, xlabel: 'slow variable z (frozen)', ylabel: 'V (mV)', height: 420, weight: 1, minWidth: 320 });
        let dk = '', D = null, fk = '', FD = null;
        const get = () => {
          const k = `${eps.value}|${Isl.value}`; if (k === dk) return D; dk = k;
          const p = { ...BURST, eps: eps.value, I: Isl.value };
          const warm = burstOrbit(p, 12000, { every: 48000 }), y0 = warm[warm.length - 1];
          const rec = burstOrbit(p, TEND, { y0, every: 8 });
          const sp = []; for (let i = 1; i < rec.length; i++) if (rec[i - 1][0] < 0 && rec[i][0] >= 0) sp.push(i * 2);
          const bursts = []; let cur = []; for (const t of sp) { if (cur.length && t - cur[cur.length - 1] > 250) { bursts.push(cur); cur = []; } cur.push(t); } if (cur.length) bursts.push(cur);
          D = { p, rec, sp, bursts }; return D;
        };
        const fast = () => {
          const k = `${Isl.value}`; if (k === fk) return FD; fk = k;
          const p = { ...BURST, I: Isl.value }, eq = [], cyc = [];
          for (let z = 0.3; z <= 1.2001; z += 0.02) { for (const e of burstFastEq(p, z, p.I)) eq.push([z, e.V, e.stable]); const c = burstFastCycle(p, z, p.I, { T: 1500 }); if (c) cyc.push([z, c.lo, c.hi]); }
          return (FD = { eq, cyc });
        };
        v.animate((tsec) => {
          const R = get(), Fd = fast(), t = (tsec % 8) * 1000, n = Math.min(R.rec.length - 1, Math.round(t / 2));
          sA.path(R.rec.map((y, i) => [i * 2, y[0]]), { color: 'accent', width: 1.2, alpha: 0.35 });
          sA.path(R.rec.slice(0, n + 1).map((y, i) => [i * 2, y[0]]), { color: 'accent', width: 2 });
          sA.dot(n * 2, R.rec[n][0], { r: 5, color: 'gold' });
          sZ.path(R.rec.map((y, i) => [i * 2, y[2]]), { color: 'purple', width: 1.2, alpha: 0.35 });
          sZ.path(R.rec.slice(0, n + 1).map((y, i) => [i * 2, y[2]]), { color: 'purple', width: 2 });
          sZ.dot(n * 2, R.rec[n][2], { r: 5, color: 'gold' });
          for (const [z, V, st] of Fd.eq) sB.dot(z, V, { r: 2.2, color: st ? 'green' : 'red', hollow: !st });
          sB.path(Fd.cyc.map((c) => [c[0], c[1]]), { color: 'blue', width: 2 }); sB.path(Fd.cyc.map((c) => [c[0], c[2]]), { color: 'blue', width: 2 });
          sB.path(R.rec.slice(0, n + 1).map((y) => [y[2], y[0]]), { color: 'gold', width: 1.2, alpha: 0.8 });
          sB.dot(R.rec[n][2], R.rec[n][0], { r: 6, color: 'gold' });
          v._r = { R, n };
        }, { period: 8, still: 3.4 });
        v.legend([['accent', '$V$'], ['purple', '$z$'], ['green', 'stable equilibrium', { dot: true }], ['red', 'unstable equilibrium', { dot: true }], ['blue', 'spiking cycle: min / max $V$'], ['gold', 'full trajectory', { dot: true }]]);
        v.readout(() => {
          const r = v._r; if (!r) return '';
          const { R, n } = r, b = R.bursts.filter((x, i) => i > 0 && i < R.bursts.length - 1), per = R.bursts.length > 2 ? (R.bursts[R.bursts.length - 1][0] - R.bursts[0][0]) / (R.bursts.length - 1) : NaN;
          const spb = b.length ? b.reduce((a, x) => a + x.length, 0) / b.length : R.sp.length;
          return String.raw`now: $z=${v.fix(R.rec[n][2], 3)}$, $V=${v.fix(R.rec[n][0], 0)}$ mV · over 8 s: ${R.sp.length} spikes in ${R.bursts.length} bursts, about ${v.fix(spb, 1)} spikes per burst` + (isFinite(per) ? String.raw`, burst period $${v.fix(per, 0)}$ ms` : '') + String.raw` · $z$ ranges over $[${v.fix(Math.min(...R.rec.map((y) => y[2])), 2)},\,${v.fix(Math.max(...R.rec.map((y) => y[2])), 2)}]$`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.9
    {
      num: '3.9',
      kind: 'Model',
      name: 'Izhikevich simple model',
      statement: String.raw`Izhikevich's simple model has two variables, a membrane potential $v$ (mV) and a recovery variable $u$, and an after-spike reset:
$$\dot v = 0.04\,v^2 + 5\,v + 140 - u + I,\qquad \dot u = a\,(b\,v - u),\qquad \text{if } v\ge 30\text{ mV: } v\leftarrow c,\ u\leftarrow u+d.$$
The four parameters $a,b,c,d$ select the firing pattern. Choosing them as $(a,b,c,d)=(0.02,0.2,-65,8)$ gives regular spiking with spike-frequency adaptation, $(0.02,0.2,-55,4)$ intrinsically bursting, $(0.02,0.2,-50,2)$ chattering (fast repetitive bursts), $(0.1,0.2,-65,2)$ fast spiking without adaptation, and $(0.02,0.25,-65,2)$ low-threshold spiking. The first equation is the quadratic integrate-and-fire neuron (neuro-3.7), with the cubic of the previous models replaced by a parabola; $u$ plays the role of a slow adaptation current.`,
      idea: String.raw`The quadratic term gives the spike its upstroke (a finite-time blow-up cut off at 30 mV, neuro-3.7), the reset mimics the downstroke, and $u$ both subtracts from the drive and is incremented at each spike by $d$, which accumulates and slows the firing (adaptation). The ratio $c$ of the reset voltage to threshold and the size of $d$ decide whether the after-spike state is far from threshold (regular spiking) or close to it (a burst of spikes before $u$ has grown enough to stop it). The parameters were chosen by fitting the qualitative patterns of cortical neuron types, not derived from channels. The model is therefore efficient to simulate (two multiplications and a few additions per step) but has no ionic meaning.`,
      caption: String.raw`Pick a cell type to load its $(a,b,c,d)$ (you can adjust them afterwards) and set the step current, which switches on at 20 ms. Top left: $v(t)$; bottom left: the recovery variable $u(t)$. Right: the $(v,u)$ plane with the two nullclines (the parabola $u=0.04v^2+5v+140+I$ in orange and the line $u=bv$ in purple); the orbit is cut at each spike and restarts at $(c,u+d)$ (gold dots, one per spike), so the stack of gold dots up the reset line shows $u$ climbing by $d$ each time. Lower $d$ and raise $c$ to turn regular spiking into bursting.`,
      scope: String.raw`Phenomenological model in the units of the 2003 paper (time in ms, voltage in mV, no capacitance given). It reproduces the named firing patterns for the listed parameters at suitable currents (here 10 for all five), not the spike shape, the mechanism or neuronal variability, and it is integrated here with a 0.25 ms step.`,
      deps: ['neuro-3.7'],
      see: ['neuro-3.8', 'neuro-3.2'],
      refs: ['Gerstner §6.2'],
      tags: ['phenomenological model', 'firing patterns'],
      credit: 'E. M. Izhikevich, 2003 (IEEE Trans. Neural Netw. 14: 1569–1572)',
      links: { doi: 'https://doi.org/10.1109/TNN.2003.820440' },
      verify: true,
      viz(v) {
        const names = ['RS', 'IB', 'CH', 'FS', 'LTS'];
        const load = () => { const q = IZH[type.value]; a.set(q.a); b.set(q.b); c.set(q.c); d.set(q.d); };
        const type = v.select('cell type', names.map((k) => ({ value: k, label: k })), 'RS', { onChange: load });
        const Ia = v.slider('step current $I$', 0, 25, 10, { step: 0.5 });
        const a = v.slider('$a$', 0.01, 0.12, 0.02, { step: 0.001 });
        const b = v.slider('$b$', 0.15, 0.3, 0.2, { step: 0.005 });
        const c = v.slider('$c$ (mV)', -70, -45, -65, { step: 1 });
        const d = v.slider('$d$', 0, 10, 8, { step: 0.1 });
        const sA = v.stage({ x: [0, 400], y: [-80, 40], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'v (mV)', height: 230, weight: 1.3, minWidth: 340 });
        const sU = v.stage({ x: [0, 400], y: [-18, 12], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'u', height: 150, weight: 1.3, minWidth: 340 });
        const sP = v.stage({ x: [-80, 40], y: [-20, 10], axes: 'box', gutter: true, xlabel: 'v (mV)', ylabel: 'u', height: 400, weight: 1, minWidth: 300 });
        v.render(() => {
          const p = { a: a.value, b: b.value, c: c.value, d: d.value }, I = Ia.value;
          const o = izhRun(p, (t) => (t >= 20 ? I : 0), 400, { dt: 0.25 });
          sA.rect(20, -80, 400, -76, { fill: 'gold', fillAlpha: 0.5, stroke: false });
          trace(sA, o.t, o.v, { color: 'accent', width: 1.8 });
          trace(sU, o.t, o.u, { color: 'purple', width: 2 });
          sP.fn((x) => 0.04 * x * x + 5 * x + 140 + I, { color: 'orange', width: 2.2, domain: [-80, 40] });
          sP.fn((x) => p.b * x, { color: 'purple', width: 2.2 });
          const orb = []; const jumps = [];
          for (let i = 0; i < o.v.length; i++) { if (i && o.v[i - 1] >= 30 && o.v[i] < 30) { orb.push(null); jumps.push([p.c, o.u[i]]); } orb.push([o.v[i], o.u[i]]); }
          sP.path(orb, { color: 'accent', width: 1.4, alpha: 0.75 });
          sP.dots(jumps, { r: 2.5, color: 'gold' });
          sP.dot(p.c, p.b * p.c, { r: 4, color: 'faint' });
          sP.vline(30, { color: 'faint', dash: [3, 4], width: 1 });
          sP.text('reset (c, u + d)', p.c, p.b * p.c, { size: 10.5, color: 'muted', dy: 14, align: 'left' });
          v._r = { o, p };
        });
        v.legend([['accent', '$v$'], ['purple', '$u$'], ['orange', '$\\dot v=0$'], ['purple', '$\\dot u=0$']]);
        v.readout(() => {
          const r = v._r; if (!r) return '';
          const sp = r.o.spikes, isis = sp.slice(1).map((t, i) => t - sp[i]);
          return String.raw`${IZH[type.value].name}${(r.p.a === IZH[type.value].a && r.p.b === IZH[type.value].b && r.p.c === IZH[type.value].c && r.p.d === IZH[type.value].d) ? '' : ' (parameters edited)'} · ${sp.length} spikes in 380 ms` + (isis.length ? String.raw` · first interval $${v.fix(isis[0], 1)}$ ms, shortest $${v.fix(Math.min(...isis), 1)}$ ms, last $${v.fix(isis[isis.length - 1], 1)}$ ms` : '');
        });
      },
    },
  ],
};
