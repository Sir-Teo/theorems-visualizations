// Computational Neuroscience — Chapter 3: Reductions and the phase plane
// (this file: 3.1–3.5; 3.6–3.9 are in ch03-b.js)
//
// Source and numerical follow-up: see docs/verification/neuro-source-review.md for inspected Gerstner
// sections, Renault et al. 2018 reduction, explicit illustrative parameter sets, and independent checks.
// The named parameter choices are not claimed to reproduce uninspected original fitted tables.
import { HH, ION_COL, gateInf, gateTau, trace, hhSim, spikeTimes, pulse, lineHn, hh2Sim, FHN, fhnF, fhnRest, fhnEig, fhnOrbit, rk4, ML_SETS, mlF, mlWinf, mlWnull, mlEquilibria, mlCurve, snicCurrent, mlOrbit } from './ch03.shared.js';

const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
/** Mean interspike interval of a spike-time list (NaN if fewer than two spikes). */
const isi = (sp) => (sp.length > 1 ? (sp[sp.length - 1] - sp[0]) / (sp.length - 1) : NaN);
/** Rate of upward crossings of the orbit's own mean level in the second half of a sampled FHN orbit (per time unit) and its peak-to-peak size. */
function orbitFreq(ys, dt) {
  const q = ys.length >> 2, size = (a, b) => { let lo = Infinity, hi = -Infinity; for (let i = a; i < b; i++) { lo = Math.min(lo, ys[i][0]); hi = Math.max(hi, ys[i][0]); } return hi - lo; };
  const A3 = size(2 * q, 3 * q), A4 = size(3 * q, ys.length), half = ys.slice(2 * q), m = mean(half.map((y) => y[0])), tc = [];
  for (let i = 1; i < half.length; i++) if (half[i - 1][0] < m && half[i][0] >= m) tc.push(i - 1 + (m - half[i - 1][0]) / (half[i][0] - half[i - 1][0]));
  // a sustained oscillation: it does not decay between the third and last quarter of the run
  const ok = A4 > 0.05 && A4 >= 0.9 * A3 && tc.length > 2;
  return { f: ok ? (tc.length - 1) / ((tc[tc.length - 1] - tc[0]) * dt) : 0, amp: ok ? A4 : 0 };
}
/** Glyph for an equilibrium: filled green = stable, hollow red = unstable, ink = saddle. */
function eqDot(s, x, y, type, label) {
  if (type === 'stable') s.dot(x, y, { r: 6, color: 'green', label, labelPos: 'ne' });
  else if (type === 'saddle') s.dot(x, y, { r: 6, color: 'ink', hollow: true, label, labelPos: 'ne' });
  else s.dot(x, y, { r: 6, color: 'red', hollow: true, label, labelPos: 'ne' });
}

export default {
  collection: 'neuro',
  chapter: 3,
  title: 'Reductions and the phase plane',
  summary: String.raw`Because sodium activation is fast and h and n move together, the four-dimensional Hodgkin–Huxley model collapses to two variables whose phase plane explains excitability geometrically. Common onset mechanisms include a subcritical Hopf with an existing spiking cycle (type II, nonzero onset frequency) and a saddle-node on an invariant circle (type I, arbitrarily slow firing); a supercritical Hopf can instead start subthreshold oscillations. Canonical models — FitzHugh–Nagumo, Morris–Lecar, the quadratic integrate-and-fire and theta neurons, Izhikevich’s model — capture these regimes and bursting.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Method',
      name: 'Reducing Hodgkin–Huxley to two dimensions',
      statement: String.raw`The four-variable Hodgkin–Huxley system $(V,m,h,n)$ can be replaced by a planar system in two steps that rest on a separation of time scales and on an empirical relation.
(a) The sodium activation gate relaxes in a fraction of a millisecond, faster than the slow gates and the passive membrane time scale in the reduction regime (not necessarily faster than the rapid spike upstroke), so one sets $m(t)\approx m_\infty(V(t))$.
(b) Along spikes the two slow gates are strongly anticorrelated: the points $(n(t),h(t))$ lie close to a line, $h \approx h_0 - k\,n$ (for example $h_0=0.89$, $k=1.1$ in Renault, Thieullen & Trélat (2018), §4.3), so $h$ is slaved to $n$.
The result is the planar system
$$C\dot V = I - \bar g_{Na}\,m_\infty(V)^3\,(h_0-kn)\,(V-E_{Na}) - \bar g_K n^4 (V-E_K) - g_L (V-E_L),\qquad \dot n = \alpha_n(V)(1-n)-\beta_n(V)\,n,$$
whose spikes resemble those of the full model, though its firing period is typically somewhat different. The reduction is empirical, not an asymptotic theorem, and is only as good as the near-linearity of the $(n,h)$ cloud.`,
      idea: String.raw`In a slow–fast system the fast variable sits close to its quasi-steady value, here $m_\infty(V)$, while the slow ones evolve (neuro-2.3, neuro-2.5). Two slow variables are then still too many for a plane, but $h$ and $n$ are driven by the same voltage with similar time constants and opposite signs (neuro-2.2 and 2.1: $n$ rises and $h$ falls when $V$ is depolarized), so after a short transient they move along a one-dimensional curve in the $(n,h)$ plane, which is well approximated by a line. Eliminating $m$ and $h$ in this way leaves $V$ and $n$, and a two-dimensional flow can be understood by nullclines and a phase portrait.`,
      caption: String.raw`The full model is driven by a constant current starting at 1 ms (slider). Left: the $(n,h)$ pairs sampled along the full solution (gold) fall close to a line; the line is fitted to them by least squares, or you can switch to the values $0.89-1.1\,n$. Middle: $V(t)$ of the full model (blue) and of the two-variable reduction built from the chosen line (orange dashed). Right: the actual $m(t)$ of the full model against $m_\infty(V(t))$. Compare the approximations, including the lag between $m(t)$ and $m_\infty(V(t))$ during a rapid spike. Agreement of spike shapes and firing periods depends on the chosen line and current.`,
      scope: String.raw`Space-clamped squid-axon parameters at 6.3 °C under a constant current that makes the model fire repetitively. The line and the quality of the reduction depend on the current and on the regime (the reduction is not accurate for threshold stimuli or for conduction); the full model is the reference. This panel keeps the original n-equation after substituting the empirical h(n); it does not implement the weighted, rest-preserving slow-variable projection in Gerstner §4.2. The freely fitted least-squares line need not preserve the original resting state; its extrapolation outside the sampled cloud can even leave the physical gate interval.`,
      deps: ['neuro-2.3'],
      see: ['neuro-3.2', 'neuro-2.7'],
      refs: ['Gerstner et al. (2014), §4.2, equations (4.3)–(4.5) and slow-variable projection; Renault, Thieullen & Trélat (2018), §4.3 pp. 597–600'],
      tags: ['reduction', 'time-scale separation'],
      credit: 'Empirical Hodgkin–Huxley reduction; equations and 0.89−1.1n example in Renault, Thieullen & Trélat, 2018',
      viz(v) {
        const I = v.slider('current $I$', 8, 40, 15, { step: 1, fmt: (x) => `${x} µA/cm²` });
        const how = v.select('line $h=h_0-kn$', [{ value: 'fit', label: 'fitted' }, { value: 'rinzel', label: '0.89 − 1.1 n' }], 'fit');
        const sA = v.stage({ x: [0.25, 0.8], y: [0, 0.8], axes: 'box', gutter: true, xlabel: 'n', ylabel: 'h', height: 300, weight: 1, minWidth: 260 });
        const sB = v.stage({ x: [0, 60], y: [-90, 50], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 300, weight: 1.3, minWidth: 320 });
        const sC = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'm', height: 300, weight: 1, minWidth: 260 });
        let key = null, R = null;
        const get = () => {
          if (key === I.value) return R; key = I.value;
          const f = hhSim(pulse(1, 80, I.value), { tEnd: 60, dt: 0.02, every: 5 }), sp = spikeTimes(f.t, f.V, 0);
          const t0 = Math.max(0, (sp[0] ?? 5) - 2), sel = f.t.map((t) => t >= t0);
          const fit = lineHn(f.n.filter((_, i) => sel[i]), f.h.filter((_, i) => sel[i]));
          R = { f, sp, fit, minf: f.V.map((V) => gateInf('m', V)) }; return R;
        };
        v.render(() => {
          const { f, sp, fit, minf } = get(), h0 = how.value === 'fit' ? fit.h0 : 0.89, k = how.value === 'fit' ? fit.k : 1.1;
          sA.line(0.25, h0 - k * 0.25, 0.8, h0 - k * 0.8, { color: 'orange', width: 2 });
          sA.dots(f.n.map((n, i) => [n, f.h[i]]), { r: 2, color: 'gold', alpha: 0.8 });
          sA.dot(gateInf('n', -65), gateInf('h', -65), { r: 5, color: 'ink', label: 'rest', labelPos: 'ne' });
          const red = hh2Sim(pulse(1, 80, I.value), h0, k, { tEnd: 60, dt: 0.02, every: 5 }), spR = spikeTimes(red.t, red.V, 0);
          trace(sB, f.t, f.V, { color: 'accent', width: 2.2 });
          trace(sB, red.t, red.V, { color: 'orange', width: 2, dash: [6, 4] });
          trace(sC, f.t, f.m, { color: ION_COL.Na, width: 2.2 });
          trace(sC, f.t, minf, { color: 'ink', width: 1.4, dash: [4, 4] });
          v._r = { fit, h0, k, T: isi(sp), TR: isi(spR) };
        });
        v.legend([['gold', 'full model $(n,h)$', { dot: true }], ['orange', 'line / 2D model'], ['accent', '$V$, full model'], [ION_COL.Na, '$m(t)$'], ['ink', '$m_\\infty(V(t))$', { dash: true }]]);
        v.readout(() => {
          const r = v._r; if (!r) return '';
          return String.raw`fitted line: $h \approx ${v.fix(r.fit.h0, 3)} - ${v.fix(r.fit.k, 3)}\,n$, $R^2 = ${v.fix(r.fit.r2, 3)}$ (line drawn: $h_0=${v.fix(r.h0, 2)}$, $k=${v.fix(r.k, 2)}$)` + '\n' +
            String.raw`at rest $\tau_m=${v.fix(gateTau('m', -65), 2)}$ ms, $\tau_n=${v.fix(gateTau('n', -65), 1)}$ ms, $\tau_h=${v.fix(gateTau('h', -65), 1)}$ ms · mean spike interval: full ${v.fix(r.T, 1)} ms, reduced ${v.fix(r.TR, 1)} ms`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.2
    {
      num: '3.2',
      kind: 'Model',
      name: 'FitzHugh–Nagumo model',
      statement: String.raw`The FitzHugh–Nagumo model keeps the geometry of the reduced Hodgkin–Huxley equations in the simplest form: a cubic voltage-like variable $v$ and a slow linear recovery variable $w$,
$$\dot v = v - \frac{v^3}{3} - w + I,\qquad \dot w = \varepsilon\,(v + a - b\,w),$$
with $0<\varepsilon\ll1$ (common textbook values $a=0.7$, $b=0.8$, $\varepsilon=0.08$) and $I$ an injected current. The $v$-nullcline is the cubic $w=v-v^3/3+I$, the $w$-nullcline is the line $w=(v+a)/b$. For these constants and $I=0$ they meet once, at a stable resting state, yet a sufficiently large displacement of $v$ sends the orbit on a long loop around the cubic, a spike, before it returns. Since $v$ is fast and $w$ slow the loop follows the outer branches of the cubic (a relaxation oscillation when the equilibrium is unstable).`,
      idea: String.raw`The cubic and the line are the caricature of the two planar reductions of the previous item: a fast variable with a positive feedback region (the middle branch of the cubic stands for regenerative sodium activation) and a slow variable that restores it. A relaxation-type picture (ode-7.8) says that for small $\varepsilon$ an orbit moves almost horizontally to the nearest stable branch of the cubic, creeps along it as $w$ changes, and jumps horizontally at the knee. Whether the equilibrium on the middle branch is stable decides between excitability (neuro-3.3, mathbio-6.7) and repetitive firing (neuro-3.4). FitzHugh derived the model from the Bonhoeffer–van der Pol oscillator; Nagumo and colleagues built an electronic circuit with a tunnel diode that realizes it.`,
      caption: String.raw`Phase plane of $(v,w)$: the orange curve is the $v$-nullcline, the purple line the $w$-nullcline, arrows show the flow. Drag the gold handle to choose where the orbit starts (its path is drawn in blue, with the voltage and recovery traces on the right). With $I=0$ a small kick returns to rest and a large one makes a spike; raise $I$ to move the cubic up until the crossing sits on the middle branch and the orbit circles forever. Change $\varepsilon$ to see the relaxation shape sharpen.`,
      scope: String.raw`Dimensionless two-variable caricature (no physical units; $v$ is a scaled voltage). It does not reproduce quantitative Hodgkin–Huxley data, and for large $\varepsilon$ or other $a,b$ the equilibrium count and the phase portrait change.`,
      deps: ['neuro-3.1', 'mathbio-6.7', 'ode-7.8', 'ode-3.8'],
      see: ['neuro-3.3', 'neuro-3.4', 'neuro-2.7'],
      refs: ['Gerstner §4.3'],
      tags: ['excitability', 'relaxation oscillation'],
      credit: 'R. FitzHugh, 1961 (Biophys. J. 1: 445–466); J. Nagumo, S. Arimoto and S. Yoshizawa, 1962 (Proc. IRE 50: 2061–2070)',
      links: { doi_fitzhugh: 'https://doi.org/10.1016/S0006-3495(61)86902-6', doi_nagumo: 'https://doi.org/10.1109/JRPROC.1962.288235' },
      viz(v) {
        const I = v.slider('current $I$', -0.5, 1.8, 0, { step: 0.01 });
        const eps = v.slider('$\\varepsilon$', 0.02, 0.3, 0.08, { step: 0.01 });
        const sA = v.stage({ x: [-2.5, 2.5], y: [-1.2, 2.4], axes: 'box', gutter: true, xlabel: 'v', ylabel: 'w', height: 360, weight: 1.3, minWidth: 340 });
        const sB = v.stage({ x: [0, 150], y: [-2.5, 2.5], axes: 'box', gutter: true, xlabel: 't', ylabel: 'v, w', height: 360, weight: 1, minWidth: 280 });
        const h = sA.handle(0.1, -0.6, { color: 'gold', r: 8, label: 'start', labelPos: 'nw' });
        v.render(() => {
          const p = { ...FHN, eps: eps.value }, i = I.value;
          sA.field((x, y) => fhnF(x, y, i, p), { spacing: 36, alpha: 0.35 });
          sA.fn((x) => x - (x ** 3) / 3 + i, { color: 'orange', width: 2.2, domain: [-2.5, 2.5] });
          sA.fn((x) => (x + p.a) / p.b, { color: 'purple', width: 2.2 });
          const ys = fhnOrbit(i, 150, { dt: 0.05, y0: [h.x, h.y], p });
          sA.path(ys.filter((_, k) => k % 2 === 0).map((y) => [y[0], y[1]]), { color: 'accent', width: 2.2 });
          const e = fhnEig(i, p), [v0, w0] = fhnRest(i, p);
          eqDot(sA, v0, w0, e.tr < 0 ? 'stable' : 'unstable');
          const ts = ys.map((_, k) => k * 0.05);
          sB.path(ts.map((t, k) => [t, ys[k][0]]).filter((_, k) => k % 2 === 0), { color: 'accent', width: 2 });
          sB.path(ts.map((t, k) => [t, ys[k][1]]).filter((_, k) => k % 2 === 0), { color: 'purple', width: 1.6 });
          v._r = { e, v0, w0, peak: Math.max(...ys.map((y) => y[0])) };
        });
        v.legend([['orange', '$\\dot v=0$'], ['purple', '$\\dot w=0$'], ['accent', 'orbit / $v(t)$'], ['green', 'stable rest', { dot: true }], ['red', 'unstable equilibrium', { dot: true }]]);
        v.readout(() => {
          const r = v._r; if (!r) return '';
          const l = r.e.l[0];
          return String.raw`equilibrium $(v,w)=(${v.fix(r.v0, 3)},\,${v.fix(r.w0, 3)})$ · trace $${v.fix(r.e.tr, 3)}$, det $${v.fix(r.e.det, 3)}$ · $\lambda=${v.fix(l.re, 3)}${l.im ? '\\pm ' + v.fix(l.im, 3) + 'i' : ''}$ (${r.e.tr < 0 ? 'stable' : 'unstable'})` + '\n' +
            String.raw`largest $v$ on this orbit: $${v.fix(r.peak, 2)}$` + (r.peak > 1 ? ' (a spike)' : ' (no spike)');
        });
      },
    },

    // ------------------------------------------------------------------ 3.3
    {
      num: '3.3',
      kind: 'Phenomenon',
      name: 'Threshold as a separatrix in the phase plane',
      statement: String.raw`A neuron's “threshold” is a feature of the phase plane. In the FitzHugh–Nagumo model with a stable rest state, take initial conditions on the line $w=w_{\rm rest}$ and raise $v_0$ above rest. Below a certain $v^*$ the orbit returns directly to rest; slightly above it the orbit makes a full spike (peak $v\approx1.8$) before returning. Over a narrow window of $v_0$ the response grows from subthreshold to full amplitude, and the window shrinks rapidly as $\varepsilon\to0$. In models with a saddle point this boundary is exactly the saddle's stable manifold, a separatrix; in the excitable regime of FitzHugh–Nagumo (no saddle) it is a “quasi-threshold”: a sharp but not discontinuous transition near the unstable middle branch of the cubic nullcline.`,
      idea: String.raw`The fast variable $v$ relaxes almost instantly (neuro-3.2): a displaced orbit runs horizontally toward a stable branch of the $v$-nullcline. If it starts to the left of the middle (unstable) branch, it lands on the left branch near rest and returns slowly; if it starts to the right, it lands on the right branch and must travel up and around, which is the spike. The middle branch of the cubic therefore divides the plane into two basins of the fast dynamics, and the dividing line is only slightly bent by the slow drift of $w$. In the limit $\varepsilon\to0$ the sensitive window collapses onto the middle branch; for moderate $\varepsilon$ it is a thin band of orbits that follow the middle branch for a while, “canard-like”, before choosing a side. FitzHugh described this graded-but-steep behaviour as a quasi-threshold (1955).`,
      caption: String.raw`Left: orbits launched from a few initial voltages on the line through the rest point (clustered around the threshold); those that end in a full spike are green, the others orange, the one you select with the slider is drawn bold. Right: the largest value of $v$ reached against the launch voltage $v_0$; this is the all-or-none curve of the neuron, nearly a step. Shrink $\varepsilon$ and the step becomes steeper. The readout gives the launch voltages at which the peak first passes 1 and at which it reaches 90 % of its full height.`,
      scope: String.raw`FitzHugh–Nagumo with $a=0.7$, $b=0.8$, $I=0$ (stable rest state), perturbations in $v$ only. A strict separatrix exists only when the model has a saddle (for example the bistable regime or the Hodgkin–Huxley-like models with an unstable manifold of a saddle); here the transition is steep but continuous.`,
      deps: ['neuro-3.2'],
      see: ['neuro-2.4', 'neuro-3.4'],
      refs: ['Gerstner §4.5'],
      tags: ['threshold', 'separatrix'],
      credit: 'Quasi-threshold: R. FitzHugh, 1955 (Bull. Math. Biophys. 17: 257–278)',
      links: { doi: 'https://doi.org/10.1007/BF02477753' },
      viz(v) {
        const v0 = v.slider('launch voltage $v_0$', -1.2, 0.3, -0.7, { step: 0.005 });
        const eps = v.slider('$\\varepsilon$', 0.01, 0.3, 0.08, { step: 0.005 });
        const sA = v.stage({ x: [-2.4, 2.4], y: [-1.2, 2.2], axes: 'box', gutter: true, xlabel: 'v', ylabel: 'w', height: 340, weight: 1.2, minWidth: 320 });
        const sB = v.stage({ x: [-1.25, 0.35], y: [-1.4, 2.4], axes: 'box', gutter: true, xlabel: 'launch voltage v₀', ylabel: 'largest v reached', height: 340, weight: 1, minWidth: 280 });
        const peak = (p, v00, w0, T = 120) => { let y = [v00, w0], mx = v00; const F = (s) => fhnF(s[0], s[1], 0, p); for (let k = 0; k < T / 0.1; k++) { y = rk4(F, y, 0.1); if (y[0] > mx) mx = y[0]; } return mx; };
        let key = null, C = null;
        const curve = () => {
          if (key === eps.value) return C; key = eps.value;
          const p = { ...FHN, eps: eps.value }, [vr, wr] = fhnRest(0, p);
          const pts = []; for (let i = 0; i <= 90; i++) { const x = vr + ((0.35 - vr) * i) / 90; pts.push([x, peak(p, x, wr)]); }
          const bis = (lvl) => { let lo = vr, hi = 0.35; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (peak(p, m, wr) > lvl) hi = m; else lo = m; } return (lo + hi) / 2; };
          const full = Math.max(...pts.map((q) => q[1])), v1 = bis(1);
          C = { p, vr, wr, pts, v1, v2: bis(0.9 * full), full }; return C;
        };
        v.render(() => {
          const c = curve(), { p, vr, wr } = c;
          sA.field((x, y) => fhnF(x, y, 0, p), { spacing: 40, alpha: 0.25 });
          sA.fn((x) => x - (x ** 3) / 3, { color: 'orange', width: 2.2 });
          sA.fn((x) => (x + p.a) / p.b, { color: 'purple', width: 2 });
          sA.vline(c.v1, { color: 'faint', dash: [4, 4], width: 1 });
          const launches = [0.12, 0.3, 0.5, 0.7, 0.85, 0.95].map((q) => vr + q * (c.v1 - vr)).concat([1e-4, 1e-3, 0.01, 0.05, 0.15, 0.3].map((d) => c.v1 + d));
          for (const x0 of launches) {
            const ys2 = fhnOrbit(0, 100, { dt: 0.1, y0: [x0, wr], p }), ys0 = ys2;
            const spike = Math.max(...ys0.map((y) => y[0])) > 1;
            sA.path(ys0.map((y) => [y[0], y[1]]), { color: spike ? 'green' : 'orange', width: 1.2, alpha: 0.6 });
          }
          const ys = fhnOrbit(0, 100, { dt: 0.05, y0: [v0.value, wr], p });
          sA.path(ys.map((y) => [y[0], y[1]]), { color: 'accent', width: 2.6 });
          sA.dot(vr, wr, { r: 6, color: 'green' });
          sA.dot(v0.value, wr, { r: 5, color: 'gold' });
          sB.path(c.pts, { color: 'accent', width: 2.2 });
          sB.line(-1.25, 1, 0.35, 1, { color: 'faint', dash: [4, 4] });
          const pk = peak(p, v0.value, wr);
          sB.dot(v0.value, pk, { r: 6, color: 'gold' });
          sB.vline(c.v1, { color: 'green', dash: [4, 4], width: 1.2 });
          v._r = { c, pk, vr };
        });
        v.legend([['orange', 'no spike'], ['green', 'spike'], ['accent', 'selected orbit'], ['orange', '$v$-nullcline'], ['purple', '$w$-nullcline']]);
        v.readout(() => {
          const r = v._r; if (!r) return '';
          return String.raw`rest at $v=${v.fix(r.vr, 3)}$ · peak passes 1 at $v_0=${v.fix(r.c.v1, 4)}$ and reaches 90 % of its full height ($${v.fix(0.9 * r.c.full, 2)}$) at $v_0=${v.fix(r.c.v2, 4)}$: window width $${v.sci(r.c.v2 - r.c.v1, 2)}$` + '\n' +
            String.raw`selected $v_0=${v.fix(v0.value, 3)}$ gives a peak of $${v.fix(r.pk, 2)}$ (${r.pk > 1 ? 'spike' : 'subthreshold'})`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.4
    {
      num: '3.4',
      kind: 'Theorem',
      name: 'Type II onset via Hopf bifurcation',
      statement: String.raw`Let $\dot x = F(x,I)$ be a planar system with a smooth family of equilibria $x^*(I)$ whose Jacobian has eigenvalues $\mu(I)\pm i\omega(I)$. Suppose at $I=I_c$ that $\mu(I_c)=0$ and $\omega_0=\omega(I_c)>0$, that $\mu'(I_c)\neq 0$, and that the first Lyapunov coefficient $\ell_1\neq 0$. Then a branch of periodic orbits bifurcates from $x^*$ at $I_c$: for $I$ on one side of $I_c$ (the side where the equilibrium is unstable if $\ell_1<0$, supercritical case) there is a limit cycle whose amplitude grows like $\sqrt{|I-I_c|}$, and whose period tends to $2\pi/\omega_0$ as $I\to I_c$. The small periodic branch therefore has nonzero **oscillation** frequency. In the supercritical case its amplitude vanishes at onset and it can represent subthreshold oscillations, not neuronal spikes. A type II spiking onset requires a stable large-amplitude spiking attractor, as in a subcritical-Hopf scenario with a pre-existing stable cycle; the local theorem alone does not supply that global attractor or its frequency. For the planar equation the Jacobian has trace $\tau$ and determinant $\Delta$, the Hopf point is $\tau=0,\ \Delta>0$, and $\omega_0=\sqrt{\Delta}$.`,
      idea: String.raw`Near the equilibrium the linear flow is a slow spiral, with decay rate $\mu$ crossing zero at $I_c$. At $I_c$ the linear part is a pure rotation at speed $\omega_0$, and the leading nonlinear terms, reduced to the normal form $\dot z=(\mu+i\omega_0)z+\ell_1 z|z|^2$ (the centre-manifold computation), decide whether the amplitude saturates: $|z|^2\approx -\mu/\mathrm{Re}\,\ell_1$. That gives an amplitude $\propto\sqrt{\mu}\propto\sqrt{|I-I_c|}$ and a frequency fixed by the imaginary part, $\omega_0$. In FitzHugh–Nagumo (neuro-3.2) the trace of the Jacobian at the equilibrium $v_*$ is $1-v_*^2-\varepsilon b$, which vanishes when $v_*^2=1-\varepsilon b$; there the determinant is $\varepsilon\,(1-b\,(1-v_*^2))=\varepsilon\,(1-\varepsilon b^2)$, so $\omega_0=\sqrt{\varepsilon(1-\varepsilon b^2)}\approx0.276$ for the standard constants, and the local small-orbit frequency is $\omega_0/2\pi\approx0.044$ per time unit. For this cubic model, a normal-form calculation gives $\ell_1=-1/8+b(1-\varepsilon b)/[4(1-\varepsilon b^2)]$ in one standard coordinate normalization: it is positive at $\varepsilon=0.08$ (subcritical) and negative at $\varepsilon=1$ (supercritical).`,
      caption: String.raw`Raise the current. Left: the two eigenvalues of the resting state in the complex plane as $I$ varies (curve) and at the current $I$ (dots); linear stability changes when they cross the vertical axis at $\pm\omega_0$; a finite frequency alone does not establish spiking. Middle: the measured sustained oscillation frequency (blue dots) against $I$, with $\omega_0/2\pi$ of the first Hopf point dashed; right: the size of the oscillation (peak to peak of $v$). Bottom: $v(t)$ at your $I$ after a small kick. With $\varepsilon=1$ the onset is mild: the oscillation is small at the Hopf point and the frequency is close to $\omega_0/2\pi$. With slow recovery $\varepsilon=0.08$, the local branch is unstable (subcritical). A small kick can instead reach an existing large stable relaxation cycle, whose frequency need not equal $\omega_0/2\pi$; the local Hopf calculation does not determine that large cycle.`,
      scope: String.raw`Generic planar Hopf bifurcation; the statements about amplitude and frequency are local, near $I_c$. In FitzHugh–Nagumo with $a=0.7,b=0.8$ the equilibrium is unstable between two Hopf points (for $\varepsilon=0.08$ at $I\approx0.33$ and $I\approx1.42$); the second is the end of firing by depolarization block. Frequencies are in cycles per dimensionless time unit; oscillations that decay during the run are counted as no oscillation, so values very close to $I_c$ are limited by the length of the simulation. The value $\varepsilon=1$ is a mathematical illustration of the theorem, not a physiological recovery rate.`,
      deps: ['neuro-3.2', 'mathbio-3.12'],
      see: ['neuro-3.5', 'neuro-2.7'],
      refs: ['Gerstner §4.4'],
      tags: ['Hopf', 'type II'],
      credit: 'E. Hopf, 1942 (bifurcation of periodic solutions); classification of repetitive responses by A. L. Hodgkin, 1948 (J. Physiol. 107: 165–181)',
      viz(v) {
        const epsSel = v.select('recovery rate $\\varepsilon$', [{ value: 1, label: 'ε = 1 (mild onset)' }, { value: 0.08, label: 'ε = 0.08 (subcritical jump)' }], 1);
        const I = v.slider('current $I$', 0, 1.6, 0.9, { step: 0.005 });
        const sA = v.stage({ x: [-0.8, 1.0], y: [-0.8, 0.8], axes: true, height: 300, weight: 1, minWidth: 240, xlabel: 'Re λ', ylabel: 'Im λ' });
        const sB = v.stage({ x: [0, 1.6], y: [0, 0.12], axes: 'box', gutter: true, xlabel: 'current I', ylabel: 'frequency', height: 300, weight: 1.1, minWidth: 260 });
        const sD = v.stage({ x: [0, 1.6], y: [0, 4.2], axes: 'box', gutter: true, xlabel: 'current I', ylabel: 'oscillation size', height: 300, weight: 1, minWidth: 240 });
        const sC = v.stage({ x: [0, 200], y: [-2.6, 2.6], axes: 'box', gutter: true, xlabel: 't', ylabel: 'v', height: 260, weight: 1, minWidth: 320 });
        const Is = Array.from({ length: 81 }, (_, i) => 0.02 * i);
        const eps0 = (p) => (p.eps < 0.5 ? 1500 : 800);
        const cache = {};
        const setup = () => {
          const eps = epsSel.value; if (cache[eps]) return cache[eps];
          const p = { ...FHN, eps };
          const hopf = []; { let prev = fhnEig(0, p).tr; for (let i = 0.005; i <= 1.8; i += 0.005) { const t = fhnEig(i, p).tr; if (prev * t < 0) { let lo = i - 0.005, hi = i; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (fhnEig(lo, p).tr * fhnEig(m, p).tr <= 0) hi = m; else lo = m; } hopf.push((lo + hi) / 2); } prev = t; } }
          const sweep = Is.map((i) => { const [v0, w0] = fhnRest(i, p); const r = orbitFreq(fhnOrbit(i, eps0(p), { dt: 0.1, y0: [v0 + 0.1, w0], p }), 0.1); return [i, r.f, r.amp]; });
          const trail = Array.from({ length: 321 }, (_, k) => fhnEig(0.005 * k, p).l);
          return (cache[eps] = { p, hopf, sweep, trail, w0: hopf.length ? Math.sqrt(fhnEig(hopf[0], p).det) : 0 });
        };
        v.render(() => {
          const D = setup(), { p } = D, e = fhnEig(I.value, p);
          sA.vline(0, { color: 'ink', width: 1.2 });
          sA.rect(0, -0.8, 1.0, 0.8, { fill: 'red', fillAlpha: 0.06, stroke: false });
          sA.path(D.trail.map((l) => [l[0].re, l[0].im]), { color: 'muted', width: 1.6 });
          sA.path(D.trail.map((l) => [l[1].re, l[1].im]), { color: 'muted', width: 1.6 });
          for (const l of e.l) sA.dot(l.re, l.im, { r: 6, color: l.re < 0 ? 'green' : 'red' });
          sA.text('unstable', 0.05, -0.72, { size: 11, color: 'red', align: 'left' }); sA.text('stable', -0.05, -0.72, { size: 11, color: 'green', align: 'right' });
          sB.hline(D.w0 / (2 * Math.PI), { color: 'orange', dash: [5, 4], width: 1.4 });
          const on = D.sweep.filter((q) => q[1] > 0);
          sB.dots(on.map((q) => [q[0], q[1]]), { r: 3, color: 'accent' });
          sD.dots(D.sweep.map((q) => [q[0], q[2]]), { r: 3, color: 'purple' });
          for (const h of D.hopf) { sB.vline(h, { color: 'faint', dash: [3, 4], width: 1 }); sD.vline(h, { color: 'faint', dash: [3, 4], width: 1 }); }
          const [v0, w0] = fhnRest(I.value, p), ys = fhnOrbit(I.value, 200, { dt: 0.1, y0: [v0 + 0.1, w0], p });
          sC.path(ys.map((y, k) => [k * 0.1, y[0]]).filter((_, k) => k % 2 === 0), { color: 'accent', width: 2 });
          const f = orbitFreq(fhnOrbit(I.value, eps0(p) , { dt: 0.1, y0: [v0 + 0.1, w0], p }), 0.1);
          sB.dot(I.value, f.f, { r: 7, color: 'gold' }); sD.dot(I.value, f.amp, { r: 7, color: 'gold' });
          v._r = { e, f, D };
        });
        v.legend([['muted', 'eigenvalue paths'], ['accent', 'oscillation frequency', { dot: true }], ['purple', 'oscillation size', { dot: true }], ['orange', '$\\omega_0/2\\pi$ at first Hopf point', { dash: true }]]);
        v.readout(() => {
          const r = v._r; if (!r) return '';
          const D = r.D;
          return String.raw`trace $${v.fix(r.e.tr, 4)}$, det $${v.fix(r.e.det, 4)}$ · $\lambda=${v.fix(r.e.l[0].re, 4)}\pm ${v.fix(Math.abs(r.e.l[0].im), 4)}i$` + '\n' +
            String.raw`first Hopf point at $I_c=${v.fix(D.hopf[0], 3)}$ with $\omega_0=\sqrt{\det}=${v.fix(D.w0, 4)}$, so $\omega_0/2\pi=${v.fix(D.w0 / (2 * Math.PI), 4)}$ · measured at this $I$: frequency $${v.fix(r.f.f, 4)}$, oscillation size $${v.fix(r.f.amp, 2)}$`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Type I onset at a saddle-node on the invariant circle',
      statement: String.raw`Suppose a planar flow $\dot x=F(x,I)$ has, at $I=I_c$, a non-hyperbolic equilibrium $x_c$ (a saddle-node with a single zero eigenvalue and quadratic nonlinearity along the centre direction, crossing generically as $I$ varies) that lies on a closed invariant curve with a global return through the outgoing center direction and transverse attraction. Assume a generic saddle-node-on-invariant-circle unfolding with oriented local flow $\dot\xi=a(I-I_c)+b\xi^2+\cdots$, $a,b>0$. Below $I_c$ the nearby invariant circle contains a stable node and saddle, connected by trajectories; above $I_c$ their annihilation leaves an attracting periodic orbit. A local saddle-node without this global return need not create any periodic orbit. The period of this cycle diverges as $I\downarrow I_c$ like
$$T(I)\approx \frac{\pi}{\sqrt{\kappa\,(I-I_c)}},\qquad\text{so}\qquad f(I)\ \propto\ \sqrt{I-I_c},$$
where $\kappa=ab>0$ depends on the local coordinate and current scaling. The neuron can fire at arbitrarily low rates: this is the **type I** (class 1) onset. The fold itself is a saddle-node bifurcation (ode-8.3), made global by the closed loop.`,
      idea: String.raw`Near the merging point the flow along $\Gamma$ is the saddle-node normal form $\dot x = \delta + \kappa x^2$ with $\delta = I - I_c$ (up to higher order). For $\delta>0$ the passage from $x=-\infty$ to $+\infty$ takes $\int dx/(\delta+\kappa x^2)=\pi/\sqrt{\kappa\delta}$, which is long because the flow is slow at the “ghost” of the vanished equilibria, while the rest of the loop takes a time that stays finite. So the period is dominated by that single bottleneck and grows like $(I-I_c)^{-1/2}$. For $\delta<0$ the two equilibria exist and the loop is not a cycle, which is why the neuron is silent. The same normal form with the loop coordinate reduces to the theta neuron (neuro-3.7).`,
      caption: String.raw`The Morris–Lecar neuron with the saddle-node parameter set (a calcium–potassium model, neuro-3.6). Left: phase plane with the $V$-nullcline (orange) and the $w$-nullcline (purple); below $I_c$ there are three equilibria (stable node green, saddle half-filled, unstable focus red) and the orbit settles; the node and saddle merge at $I_c$ and vanish. Middle: the firing rate against $I$ with the fit $c\sqrt{I-I_c}$ (dashed). Right: the same data on log–log axes against $I-I_c$; a straight line of slope $\tfrac12$. Drag the current across $I_c$.`,
      scope: String.raw`Global return and transverse attraction are required in addition to the local fold. The square-root asymptotic holds for $I-I_c$ small compared with the scale on which the model's nonlinearity changes (here a few µA/cm²). The numerical example uses the explicitly chosen Morris–Lecar set in neuro-3.6; its computed bifurcation and rate scaling are checked separately, rather than attributed to an uninspected original fitted table.`,
      deps: ['neuro-3.2', 'ode-8.3'],
      see: ['neuro-3.4', 'neuro-3.7', 'neuro-2.8'],
      refs: ['Gerstner §4.4'],
      tags: ['saddle-node', 'type I'],
      credit: 'Class 1 / class 2 repetitive responses: A. L. Hodgkin, 1948 (J. Physiol. 107: 165–181); phase-resetting consequences: G. B. Ermentrout, 1996 (Neural Comput. 8: 979–1001)',
      links: { doi_hodgkin: 'https://doi.org/10.1113/jphysiol.1948.sp004260', doi_ermentrout: 'https://doi.org/10.1162/neco.1996.8.5.979' },
      viz(v) {
        const p = ML_SETS.snic, Ic = snicCurrent(p);
        const I = v.slider('current $I$', 30, 60, 38, { step: 0.1, fmt: (x) => `${x.toFixed(1)} µA/cm²` });
        const sA = v.stage({ x: [-70, 55], y: [-0.05, 0.75], axes: 'box', gutter: true, xlabel: 'V (mV)', ylabel: 'w', height: 330, weight: 1.2, minWidth: 300 });
        const sB = v.stage({ x: [30, 75], y: [0, 24], axes: 'box', gutter: true, xlabel: 'I (µA/cm²)', ylabel: 'rate (Hz)', height: 330, weight: 1, minWidth: 260 });
        const sC = v.stage({ x: [0.05, 40], y: [1, 30], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'I − Ic', ylabel: 'rate (Hz)', height: 330, weight: 1, minWidth: 260 });
        const grid = Array.from({ length: 26 }, (_, i) => Ic + 0.1 + i * 1.4);
        const gridLog = Array.from({ length: 13 }, (_, i) => Ic + 0.1 * Math.pow(10, (i * 2.4) / 12));
        let fit = null;
        const getFit = () => {
          if (fit) return fit;
          const lin = mlCurve('snic', grid, { T: 5000 }), lg = mlCurve('snic', gridLog, { T: 9000 }).filter((r) => r[1] > 0);
          const lf = lg.filter((r) => r[0] - Ic <= 3), xs = lf.map((r) => Math.log(r[0] - Ic)), ys = lf.map((r) => Math.log(r[1])), mx = mean(xs), my = mean(ys);
          let sxy = 0, sxx = 0; for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
          const slope = sxy / sxx, c = Math.exp(my - slope * mx);
          // the pure square-root coefficient from the near-onset points (d ≤ 2)
          const near = lg.filter((r) => r[0] - Ic < 2), cs = mean(near.map((r) => r[1] / Math.sqrt(r[0] - Ic)));
          return (fit = { lin, lg, slope, c, cs });
        };
        v.render(() => {
          const i = I.value, F = getFit();
          sA.fn((V) => mlWnull(p, V, i), { color: 'orange', width: 2.2, domain: [-69, 55] });
          sA.fn((V) => mlWinf(p, V), { color: 'purple', width: 2.2 });
          const ys = mlOrbit(p, i, i > Ic ? 700 : 300, { dt: 0.25, every: 2 });
          sA.path(ys.map((y) => [y[0], y[1]]), { color: 'accent', width: 2 });
          const eq = mlEquilibria(p, i);
          for (const e of eq) eqDot(sA, e.V, e.w, e.type);
          sB.path(F.lin.map((r) => [r[0], r[1]]), { color: 'accent', width: 2 });
          sB.dots(F.lin.map((r) => [r[0], r[1]]), { r: 2.5, color: 'accent' });
          sB.fn((x) => (x > Ic ? F.cs * Math.sqrt(x - Ic) : NaN), { color: 'orange', dash: [5, 4], width: 1.6, domain: [Ic, 75] });
          sB.vline(Ic, { color: 'green', dash: [3, 4], width: 1.2 });
          sC.dots(F.lg.map((r) => [r[0] - Ic, r[1]]), { r: 3.5, color: 'accent' });
          sC.fn((d) => F.c * Math.pow(d, F.slope), { color: 'orange', dash: [5, 4], width: 1.6, domain: [0.05, 40] });
          sC.fn((d) => F.cs * Math.sqrt(d), { color: 'ink', dash: [2, 4], width: 1, domain: [0.05, 40] });
          const r = mlCurve('snic', [i], { T: 6000 })[0][1];
          if (r > 0) sB.dot(i, r, { r: 6, color: 'gold' });
          if (i > Ic) sC.dot(i - Ic, r, { r: 6, color: 'gold' });
          v._r = { eq, r, i };
        });
        v.legend([['accent', 'simulated rate'], ['orange', 'fit', { dash: true }], ['ink', 'slope ½ guide', { dash: true }], ['green', '$I_c$', { dash: true }]]);
        v.readout(() => {
          const r = v._r, F = getFit(); if (!r) return '';
          return String.raw`saddle-node at $I_c=${v.fix(Ic, 3)}$ µA/cm² · at $I=${v.fix(r.i, 1)}$: ${r.eq.length} equilibri${r.eq.length === 1 ? 'um' : 'a'} (${r.eq.map((e) => e.type).join(', ')}) · rate $${v.fix(r.r, 2)}$ Hz` + '\n' +
            String.raw`log–log slope fitted over $0.1\le I-I_c\le 3$ µA/cm²: $${v.fix(F.slope, 3)}$ (square-root law predicts $0.5$) · near onset $f\approx ${v.fix(F.cs, 2)}\sqrt{I-I_c}$ Hz`;
        });
      },
    },
  ],
};
