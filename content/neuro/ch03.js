// Computational Neuroscience — Chapter 3: Reductions and the phase plane
// (this file: 3.1–3.5; 3.6–3.9 are in ch03-b.js)
//
// Facts used and how they were checked (Oct 2026):
// - Crossref-checked references: FitzHugh 1961 Biophys. J. 1: 445–466 (10.1016/S0006-3495(61)86902-6); Nagumo, Arimoto & Yoshizawa 1962,
//   Proc. IRE 50: 2061–2070 (10.1109/JRPROC.1962.288235); FitzHugh 1955, Bull. Math. Biophys. 17: 257–278 (10.1007/BF02477753);
//   Hodgkin 1948, J. Physiol. 107: 165–181 (10.1113/jphysiol.1948.sp004260); Ermentrout 1996, Neural Comput. 8: 979–1001
//   (10.1162/neco.1996.8.5.979). Rinzel 1985, Fed. Proc. 44 (existence confirmed by a ModelDB citation list; page numbers not checked).
// - 3.4 source audit reads the complete author Hopf/normal-form treatments cited there; no original-paper priority is inferred.
// - The FitzHugh–Nagumo parameters a = 0.7, b = 0.8, ε = 0.08 are the usual textbook values, not those of the 1961 paper.
// - The explicitly chosen Morris–Lecar examples and exact fold calculations are audited in3.5/3.6; no original parameter table is claimed.
// - Every curve on these pages is computed from the model; no digitised data are used.
import { HH, ION_COL, gateInf, gateTau, trace, hhSim, spikeTimes, pulse, lineHn, hh2Sim, FHN, fhnF, fhnRest, fhnEig, fhnOrbit, rk4, ML_SETS, mlF, mlWinf, mlWnull, mlEquilibria, mlCurve, snicCurrent, mlOrbit } from './ch03.shared.js';
import { mlFolds, mlEquilibriaAudit, mlRateCurveAudit, clippedMLCurve } from './source-audit-morris-lecar.shared.js';
import { fhnHopfPoints, windowOscillation } from './source-audit-bifurcation.shared.js';
import { fitGateClosure, closureDiagnostics, meanInterval } from './source-audit-reduction.shared.js';

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
  summary: String.raw`Fast sodium activation and correlated slower gates motivate approximate reductions of Hodgkin–Huxley to a phase plane. Hopf and saddle-node-on-invariant-circle bifurcations are two important mechanisms for oscillation onset; other global bifurcations and the stability of the emerging cycle also matter. FitzHugh–Nagumo, Morris–Lecar, integrate-and-fire and Izhikevich models illustrate selected regimes and bursting.`,
  items: [
    // ------------------------------------------------------------------ 3.1
    {
      num: '3.1',
      kind: 'Method',
      name: 'Reducing Hodgkin–Huxley to two dimensions',
      statement: String.raw`A two-dimensional **approximation** to the four-variable Hodgkin–Huxley membrane can set the fast sodium activation to $m_\infty(V)$ and close the two slower gates by a selected relation $h\approx h_0-kn$. Retaining the original $n$ equation gives $$C\dot V=I-\bar g_{Na}m_\infty(V)^3(h_0-kn)(V-E_{Na})-\bar g_K n^4(V-E_K)-g_L(V-E_L),\qquad\dot n=\alpha_n(V)(1-n)-\beta_n(V)n.$$ This closure is a modeling choice, not an exact equivalence or a universally valid slow manifold. Its predicted $h$ may leave the probability interval; the readout reports that failure instead of treating it as a physical gate.`,
      idea: String.raw`The author treatment in Gerstner et al. §4.2 explains fast $m$ equilibration and a projection combining the $n$ and $h$ dynamics; Eqs. (4.12)–(4.21) construct a rest-preserving geometric projection. Our simpler comparison instead keeps the $n$ equation and uses either a line fitted to the same full trajectory or the explicitly chosen illustrative line $0.89-1.1n$. The fixed closure matches Izhikevich’s author treatment §5.2.1 (printed148–150); its waveform comparison there is at I=8, whereas the fitted alternative here is computed afresh from the chosen run. Fitting a trajectory does not independently validate the resulting reduced dynamics, and similarity of gate time constants does not make a straight-line relation exact.

The fitted closure consumes the least-distance projection theorem ladr-6.61. Regard the sampled h values as a Euclidean vector and project onto the span of the constant vector and the sampled n values. Orthogonality of the residual gives the least-squares intercept and the coefficient written as minus k. Distinct sampled n values are needed to identify both coefficients, and the implementation declines nearly constant clouds rather than claiming a well-conditioned fit. This minimizes error on that trajectory only; it does not prove that the fitted line is an invariant or attracting manifold.`,
      caption: String.raw`The input starts at 1 ms. Gold points are the full-model gate cloud. A subset of that **same run**, beginning 2 ms before its first detected spike (or at 3 ms when none is detected), supplies the optional least-squares line, with its sample count and $R^2$; a nearly constant cloud is reported as unsuitable for fitting. Compare full and reduced voltage traces and the actual $m(t)$ against $m_\infty(V(t))$. Views include both traces and the selected line. The surrogate $h$ range along the reduced solution is reported, including values outside 0–1. Spike counts and mean intervals are finite-run comparisons; unavailable intervals are not reported as zero.`,
      scope: String.raw`Space-clamped atlas squid-axon parameters at 6.3°C, with a selected constant input after 1 ms. Both models begin with the same $V,n$; the closure replaces $h$ and therefore need not share the full model’s resting state. The fixed n-only closure follows Izhikevich’s simpler reduction; the fitted closure is an atlas alternative. Both differ from Gerstner’s rest-preserving projection. Accuracy can fail for onset, different inputs and spike timing. An out-of-range surrogate remains visible as a mathematical closure diagnostic; it is not clipped into a probability or endorsed as a valid ionic conductance.`,
      deps: ['neuro-2.3', 'ladr-6.61'],
      see: ['neuro-3.2', 'neuro-2.7'],
      refs: ['Izhikevich, Dynamical Systems in Neuroscience (2007), complete §5.2.1 printed148–150, Figs.5.18–5.21: https://izhikevich.org/publications/dsn.pdf', 'Gerstner, Kistler, Naud & Paninski, Neuronal Dynamics (2014), complete §4.2.1–4.2.2, Eqs. (4.3)–(4.23), Fig. 4.5–4.6: https://neuronaldynamics.epfl.ch/online/Ch4.S2.html'],
      tags: ['reduction', 'time-scale separation'],
      credit: 'Dimensional-reduction framework follows the complete author treatment by Gerstner et al.; the displayed fitted/fixed closures are explicitly specified atlas comparisons.',
      verify: false,
      viz(v) {
        const I = v.slider('current $I$', 0, 40, 15, { step: 1, fmt: (x) => `${x} µA/cm²` });
        const how = v.select('line $h=h_0-kn$', [{ value: 'fit', label: 'fitted' }, { value: 'fixed', label: 'chosen illustration: 0.89 − 1.1 n' }], 'fit');
        const sA = v.stage({ x: [0.25, 0.8], y: [0, 0.8], axes: 'box', gutter: true, xlabel: 'n', ylabel: 'h', height: 300, weight: 1, minWidth: 260 });
        const sB = v.stage({ x: [0, 60], y: [-90, 50], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 300, weight: 1.3, minWidth: 320 });
        const sC = v.stage({ x: [0, 60], y: [0, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'm', height: 300, weight: 1, minWidth: 260 });
        let key = null, R = null;
        const get = () => {
          if (key === I.value) return R; key = I.value;
          const f = hhSim(pulse(1, 80, I.value), { tEnd: 60, dt: 0.02, every: 5 }), sp = spikeTimes(f.t, f.V, 0);
          const t0 = Math.max(0, (sp[0] ?? 5) - 2), sel = f.t.map((t) => t >= t0);
          const fit = fitGateClosure(f.n.filter((_, i) => sel[i]), f.h.filter((_, i) => sel[i]));
          R = { f, sp, fit, minf: f.V.map((V) => gateInf('m', V)) }; return R;
        };
        v.render(() => {
          const { f, sp, fit, minf } = get(), h0 = how.value === 'fit' && fit ? fit.h0 : 0.89, k = how.value === 'fit' && fit ? fit.k : 1.1;
          const nx=[Math.min(.25,...f.n)-.01,Math.max(.8,...f.n)+.01],hy=[h0-k*nx[0],h0-k*nx[1]];sA.setView(nx,[Math.min(0,...f.h,...hy)-.03,Math.max(.8,...f.h,...hy)+.03]);
          sA.line(nx[0], h0 - k * nx[0], nx[1], h0 - k * nx[1], { color: 'orange', width: 2 });
          sA.dots(f.n.map((n, i) => [n, f.h[i]]), { r: 2, color: 'gold', alpha: 0.8 });
          sA.dot(gateInf('n', -65), gateInf('h', -65), { r: 5, color: 'ink', label: 'rest', labelPos: 'ne' });
          const red = hh2Sim(pulse(1, 80, I.value), h0, k, { tEnd: 60, dt: 0.02, every: 5 }), spR = spikeTimes(red.t, red.V, 0);
          sB.setView([0,60],[Math.min(-80,...f.V,...red.V)-4,Math.max(40,...f.V,...red.V)+4]);
          trace(sB, f.t, f.V, { color: 'accent', width: 2.2 });
          trace(sB, red.t, red.V, { color: 'orange', width: 2, dash: [6, 4] });
          trace(sC, f.t, f.m, { color: ION_COL.Na, width: 2.2 });
          trace(sC, f.t, minf, { color: 'ink', width: 1.4, dash: [4, 4] });
          v._r = { fit, h0, k, T: meanInterval(sp), TR: meanInterval(spR),count:sp.length,countR:spR.length,diagnostic:closureDiagnostics(red.n,h0,k) };
        });
        v.legend([['gold', 'full model $(n,h)$', { dot: true }], ['orange', 'line / 2D model'], ['accent', '$V$, full model'], [ION_COL.Na, '$m(t)$'], ['ink', '$m_\\infty(V(t))$', { dash: true }]]);
        v.readout(() => {
          const r = v._r; if (!r) return '';
          const fit=r.fit?String.raw`Same-run fit: $h\approx${v.fix(r.fit.h0,4)}-${v.fix(r.fit.k,4)}n$, $R^2=${v.fix(r.fit.r2,4)}$, ${r.fit.N} samples.`:'Same-run cloud nearly constant: fit unavailable; the fixed illustrative closure is shown.';
          return fit+'\n'+String.raw`Selected closure $h_0=${v.fix(r.h0,4)}$, $k=${v.fix(r.k,4)}$. Over 60 ms: full ${r.count} spikes, reduced ${r.countR}; mean interval full ${r.T===null?'unavailable':v.fix(r.T,3)+' ms'}, reduced ${r.TR===null?'unavailable':v.fix(r.TR,3)+' ms'}.`+'\n'+String.raw`Surrogate h along the reduced run: $[${v.fix(r.diagnostic.min,4)},${v.fix(r.diagnostic.max,4)}]$; ${r.diagnostic.outside} sampled states outside 0–1. ${r.diagnostic.outside?'This closure leaves the physical gate range; its voltage is an approximation diagnostic.':'No out-of-range sampled surrogate in this run; this is not a general validity guarantee.'}`;
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
      idea: String.raw`The cubic and the line are the caricature of the two planar reductions of the previous item: a fast variable with a positive feedback region (the middle branch of the cubic stands for regenerative sodium activation) and a slow variable that restores it. A relaxation-type picture (ode-7.8) says that for small $\varepsilon$ an orbit moves almost horizontally to the nearest stable branch of the cubic, creeps along it as $w$ changes, and jumps horizontally at the knee. Whether the equilibrium on the middle branch is stable decides between excitability (neuro-3.3, mathbio-6.7) and repetitive firing (neuro-3.4). FitzHugh derived the model from the Bonhoeffer–van der Pol oscillator; Nagumo and colleagues built an electronic circuit with a tunnel diode that realizes it.

For the chosen $0<b<1$, the stationary equations reduce to $I=(v+a)/b-v+v^3/3$. The derivative of the right side is $1/b-1+v^2>0$. The derivative-sign argument pma-5.11 thus makes it strictly increasing, so it has at most one equilibrium voltage for a fixed input. This justifies the uniqueness part of the stated rest-state example; it does not determine stability or guarantee a relaxation cycle. Other b values need a new equilibrium count.`,
      caption: String.raw`Phase plane of $(v,w)$: the orange curve is the $v$-nullcline, the purple line the $w$-nullcline, arrows show the flow. Drag the gold handle to choose where the orbit starts (its path is drawn in blue, with the voltage and recovery traces on the right). With $I=0$ a small kick returns to rest and a large one makes a spike; raise $I$ to move the cubic up until the crossing sits on the middle branch and the orbit circles forever. Change $\varepsilon$ to see the relaxation shape sharpen.`,
      scope: String.raw`Dimensionless two-variable caricature (no physical units; $v$ is a scaled voltage). It does not reproduce quantitative Hodgkin–Huxley data, and for large $\varepsilon$ or other $a,b$ the equilibrium count and the phase portrait change.`,
      deps: ['neuro-3.1', 'mathbio-6.7', 'ode-7.8', 'pma-5.11'],
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
      idea: String.raw`The fast variable $v$ relaxes almost instantly (neuro-3.2): a displaced orbit runs horizontally toward a stable branch of the $v$-nullcline. If it starts to the left of the middle (unstable) branch, it lands on the left branch near rest and returns slowly; if it starts to the right, it lands on the right branch and must travel up and around, which is the spike. The middle branch of the cubic therefore divides the plane into two basins of the fast dynamics, and the dividing line is only slightly bent by the slow drift of $w$. In the limit $\varepsilon\to0$ the sensitive window collapses onto the middle branch; for moderate $\varepsilon$ it is a thin band of orbits that follow the middle branch for a while, “canard-like”, before choosing a side. FitzHugh described this graded-but-steep behaviour as a quasi-threshold (1955).

Continuous dependence ode-2.6 distinguishes the finite-epsilon quasi-threshold from a jump. The polynomial FHN field is locally Lipschitz; on any common bounded region containing nearby trajectories through a fixed finite observation time it has a finite Lipschitz constant. The theorem bounds their separation by the initial displacement times an exponential factor. Consequently the finite-window maximum voltage is continuous in the launch voltage, although its slope can be very large. The bound is not uniform as the observation time grows or epsilon tends to zero, and it does not remove a genuine saddle separatrix in a different regime.`,
      caption: String.raw`Left: orbits launched from a few initial voltages on the line through the rest point (clustered around the threshold); those that end in a full spike are green, the others orange, the one you select with the slider is drawn bold. Right: the largest value of $v$ reached against the launch voltage $v_0$; this is the all-or-none curve of the neuron, nearly a step. Shrink $\varepsilon$ and the step becomes steeper. The readout gives the launch voltages at which the peak first passes 1 and at which it reaches 90 % of its full height.`,
      scope: String.raw`FitzHugh–Nagumo with $a=0.7$, $b=0.8$, $I=0$ (stable rest state), perturbations in $v$ only. A strict separatrix exists only when the model has a saddle (for example the bistable regime or the Hodgkin–Huxley-like models with an unstable manifold of a saddle); here the transition is steep but continuous.`,
      deps: ['neuro-3.2', 'ode-2.6'],
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
      name: 'Hopf bifurcation and local oscillation frequency',
      statement: String.raw`For a smooth planar family $\dot x=F(x,I)$ with a smooth equilibrium branch, suppose its eigenvalues at $I_c$ are $\pm i\omega_0$, $\omega_0>0$, the real part crosses zero transversely, and the first Lyapunov coefficient is nonzero. A local branch of periodic orbits then has amplitude proportional to $\sqrt{|I-I_c|}$ and period tending to $2\pi/\omega_0$. With the radial convention $\dot r=\mu r+\ell_1r^3+\cdots$, $\ell_1<0$ gives stable small cycles on the unstable-equilibrium side; $\ell_1>0$ gives unstable small cycles on the stable-equilibrium side. A subcritical Hopf alone does **not** establish a stable firing orbit or its observed onset frequency. For a planar Jacobian the spectral conditions are $\operatorname{tr}J=0$, $\det J>0$ and $\omega_0=\sqrt{\det J}$; transversality and the nonlinear coefficient must still be checked.`,
      idea: String.raw`The normal form separates radial stability from angular motion: $\dot r=\mu r+\ell_1r^3+\cdots$, $\dot\theta=\omega_0+O(|I-I_c|+r^2)$. Solving the radial equilibrium gives $r^2\sim-\mu/\ell_1$; its derivative is $-2\mu$, determining stability. This is a local statement in the original time scale. In the displayed FitzHugh–Nagumo family, $\operatorname{tr}J=1-v_*^2-\varepsilon b$, so the two candidate voltages are $v_*=\pm\sqrt{1-\varepsilon b}$ and $I_c=(v_*+a)/b-v_*+v_*^3/3$. At either point $\omega_0^2=\varepsilon(1-\varepsilon b^2)$. The explicit coefficient in the coordinates $v-v_*=x$, $w-w_*=(\varepsilon b)x+\omega_0y$ is $\ell_1=(2b-1-\varepsilon b^2)/[8(1-\varepsilon b^2)]$. Thus the two offered recovery settings have opposite criticality.

The stability calculation for a small normal-form cycle uses the one-dimensional derivative test ode-1.8 on the radial equation, away from the critical parameter itself. In the cubic truncation its nonzero radial equilibrium has $r^2=-\mu/\ell_1$ and radial derivative $-2\mu$. A negative derivative attracts radial perturbations and a positive one repels them. Under the stated nondegeneracy hypotheses the small higher terms preserve that sign on the local branch. The phase direction remains neutral along the periodic orbit; radial attraction is not a theorem about a distant stable firing branch.`,
      caption: String.raw`Eigenvalue paths cover the full current range, with both actual eigenvalues marked. The frequency panel shows only trajectories passing a finite-window oscillation detector: last-quarter size greater than 0.05, at least 90% of the preceding-quarter size, and at least three upward crossings of the latter half’s mean level. A failed detector is “unresolved”, not frequency zero or a proof of no cycle. The size panel retains the actual last-quarter range even when detection fails. Each run starts 0.1 above its own equilibrium voltage; the time trace shows the first 200 units, while the detector uses 800 or 1500. The dashed frequency is the limiting **local branch** frequency, including an unstable branch in the subcritical case.`,
      scope: String.raw`Generic nondegenerate local Hopf theorem, following the complete author normal-form treatments cited below. For these dimensionless FHN parameters, ε=1 is supercritical and ε=0.08 subcritical. Between the two computed Hopf currents the unique equilibrium is unstable; this does not by itself locate the creation or destruction of every stable global cycle. A fixed kick and finite observation can select a different attractor or miss slow growth/decay. Large-amplitude relaxation firing need not have the local Hopf frequency. These are chosen mathematical examples, not physiological fits or a complete classification of neuronal excitability.`,
      deps: ['neuro-3.2', 'mathbio-3.12', 'ode-1.8'],
      see: ['neuro-3.5', 'neuro-2.7'],
      refs: ['Izhikevich, Dynamical Systems in Neuroscience (2007), complete §6.1.3–6.1.4, printed168–178, Eqs.(6.4)–(6.9): https://izhikevich.org/publications/dsn.pdf', 'Kuznetsov, Four Lectures on Bifurcation Phenomena in ODEs, Lecture2 (2010), Theorem2 and4, physical8–13: https://webspace.science.uu.nl/~kouzn101/INLDS/L2.pdf'],
      tags: ['Hopf', 'type II'],
      credit: 'Local theorem and coefficient conventions follow the cited complete author treatments by Izhikevich and Kuznetsov; displayed FHN formulas are derived for the explicitly chosen family.',
      verify: false,
      viz(v) {
        const epsSel = v.select('recovery rate $\\varepsilon$', [{ value: 1, label: 'ε = 1 (supercritical)' }, { value: 0.08, label: 'ε = 0.08 (subcritical)' }], 1);
        const I = v.slider('current $I$', 0, 1.6, 0.9, { step: 0.005 });
        const sA = v.stage({ x: [-.8, 1], y: [-.8, .8], axes: true, height: 300, weight: 1, minWidth: 240, xlabel: 'Re λ', ylabel: 'Im λ' });
        const sB = v.stage({ x: [0, 1.6], y: [0, .12], axes: 'box', gutter: true, xlabel: 'current I', ylabel: 'detected cycles / time', height: 300, weight: 1.1, minWidth: 260 });
        const sD = v.stage({ x: [0, 1.6], y: [0, 4.2], axes: 'box', gutter: true, xlabel: 'current I', ylabel: 'last-quarter size', height: 300, weight: 1, minWidth: 240 });
        const sC = v.stage({ x: [0, 200], y: [-2.6, 2.6], axes: 'box', gutter: true, xlabel: 't', ylabel: 'v', height: 260, weight: 1, minWidth: 320 });
        const Is = Array.from({ length: 81 }, (_, i) => .02*i), cache = new Map();
        const setup = () => {
          const eps=epsSel.value;if(cache.has(eps))return cache.get(eps);
          const p={...FHN,eps},T=eps<.5?1500:800,hopf=fhnHopfPoints(p);
          const sweep=Is.map(i=>{const[x,y]=fhnRest(i,p);return{i,...windowOscillation(fhnOrbit(i,T,{dt:.1,y0:[x+.1,y],p}),.1)};}),trail=Array.from({length:321},(_,k)=>fhnEig(.005*k,p).l),D={p,T,hopf,sweep,trail};cache.set(eps,D);return D;
        };
        v.render(() => {
          const D=setup(),{p}=D,e=fhnEig(I.value,p),all=D.trail.flat(),xr=[Math.min(-.1,...all.map(x=>x.re))-.08,Math.max(.1,...all.map(x=>x.re))+.08],ym=Math.max(.1,...all.map(x=>Math.abs(x.im)))+.08;
          sA.setView(xr,[-ym,ym]);sA.rect(0,-ym,xr[1],ym,{fill:'red',fillAlpha:.06,stroke:false});sA.vline(0,{color:'ink',width:1.2});
          for(let j=0;j<2;j++)sA.path(D.trail.map(l=>[l[j].re,l[j].im]),{color:'muted',width:1.6});
          for(const l of e.l)sA.dot(l.re,l.im,{r:6,color:l.re<0?'green':'red'});
          const local=D.hopf[0].omega/(2*Math.PI),on=D.sweep.filter(q=>q.detected),[x,y]=fhnRest(I.value,p),ys=fhnOrbit(I.value,200,{dt:.1,y0:[x+.1,y],p}),f=windowOscillation(fhnOrbit(I.value,D.T,{dt:.1,y0:[x+.1,y],p}),.1);
          sB.setView([0,1.6],[0,Math.max(.12,local*1.1,...on.map(q=>q.rate*1.1),f.rate??0)]);sD.setView([0,1.6],[0,Math.max(.1,f.amp*1.05,...D.sweep.map(q=>q.amp*1.05))]);sC.setView([0,200],[Math.min(-2.6,...ys.map(q=>q[0]))-.05,Math.max(2.6,...ys.map(q=>q[0]))+.05]);
          sB.hline(local,{color:'orange',dash:[5,4],width:1.4});sB.dots(on.map(q=>[q.i,q.rate]),{r:3,color:'accent'});sD.dots(D.sweep.map(q=>[q.i,q.amp]),{r:3,color:'purple'});
          for(const h of D.hopf){sB.vline(h.I,{color:'faint',dash:[3,4],width:1});sD.vline(h.I,{color:'faint',dash:[3,4],width:1});}
          sC.path(ys.map((q,k)=>[k*.1,q[0]]).filter((_,k)=>k%2===0),{color:'accent',width:2});if(f.detected)sB.dot(I.value,f.rate,{r:7,color:'gold'});sD.dot(I.value,f.amp,{r:7,color:'gold'});v._r={D,e,f};
        });
        v.legend([['muted','eigenvalue paths'],['accent','detected finite-window rate',{dot:true}],['purple','actual last-quarter range',{dot:true}],['orange','local branch frequency at first Hopf',{dash:true}]]);
        v.readout(() => {
          const r=v._r;if(!r)return'';const{D,e,f}=r,h=D.hopf[0],eigen=e.l.map(l=>`${v.fix(l.re,4)}${l.im?(l.im>0?'+':'')+v.fix(l.im,4)+'i':''}`).join(', ');
          return String.raw`trace $${v.fix(e.tr,4)}$, determinant $${v.fix(e.det,4)}$ · eigenvalues $${eigen}$`+'\n'+String.raw`Hopf currents $${D.hopf.map(q=>v.fix(q.I,4)).join(', ')}$; first $\omega_0=${v.fix(h.omega,4)}$, local frequency $${v.fix(h.omega/(2*Math.PI),4)}$; $\ell_1=${v.fix(h.l1,5)}$ (${h.l1<0?'supercritical: stable local cycles':'subcritical: unstable local cycles'}).`+'\n'+String.raw`${D.T}-unit run: ${f.detected?'detected rate '+v.fix(f.rate,5):'rate unresolved (detector not passed)'}; last-quarter size ${v.fix(f.amp,5)}, preceding ${v.fix(f.previous,5)}, latter-half crossings ${f.count}. No global cycle conclusion follows from a failed detector.`;
        });
      },
    },

    // ------------------------------------------------------------------ 3.5
    {
      num: '3.5',
      kind: 'Theorem',
      name: 'Type I onset at a saddle-node on an invariant circle',
      statement: String.raw`Suppose a smooth planar family has a transversely attracting invariant circle whose flow, near a generic saddle-node at $I_c$, is $\dot x=a\delta+b x^2+\text{higher terms}$, with $\delta=I-I_c$ and $a,b>0$. Assume this is the only vanishing velocity on the circle and the travel time outside a fixed neighborhood remains bounded. For $\delta<0$ its node and saddle interrupt periodic motion; for $\delta>0$ the flow goes around the circle and forms an attracting periodic orbit. Its period and frequency satisfy $$T(I)\sim\frac{\pi}{\sqrt{ab(I-I_c)}},\qquad f(I)\sim\frac{\sqrt{ab(I-I_c)}}{\pi}.$$ This is a **saddle-node on an invariant circle** (SNIC), allowing arbitrarily low firing rates. A local saddle-node by itself does not establish the global return or a periodic attractor.`,
      idea: String.raw`For a fixed small cutoff $L>0$, the leading bottleneck passage is $\int_{-L}^{L}dx/(a\delta+bx^2)=2\arctan(L\sqrt{b/(a\delta)})/\sqrt{ab\delta}$. As $\delta\downarrow0$ its coefficient tends to $\pi$, and the bounded travel time around the remainder of the circle is lower order. Higher smooth nondegenerate terms preserve this leading scaling. The two normal-form coefficients include parameter transversality; setting the coefficient of $\delta$ to1 requires an explicit rescaling. The critical loop approaches and leaves through the center direction, not an assumed returning strong unstable manifold. Before the fold the invariant circle contains heteroclinic connections, rather than a periodic orbit.

The bottleneck estimate is an application of separation ode-1.3 on the positive-velocity side, where $a\delta+bx^2$ never vanishes. Its reciprocal integrates to the arctangent passage time already displayed. Rescaling $x=\sqrt{a\delta/b}\,u$ supplies the factor $1/\sqrt{ab\delta}$, and the fixed cutoff becomes unbounded in u as delta tends to zero. The bounded time outside the bottleneck is a separate global hypothesis. At or below the fold one cannot divide through a zero of the velocity and infer a periodic traversal.`,
      caption: String.raw`Drag the current in the chosen calcium–potassium model. The phase plane shows nullclines, classified equilibria and a finite orbit. The fold current comes from a stationary point of the equilibrium current curve. Middle: finite-run crossing rates and an empirical square-root guide. Right: logarithmic axes, an ordinary log–log regression over the displayed near-fold samples, and a slope½ guide. Only positive resolved rates are drawn on log axes; a run with fewer than three retained crossings is unresolved. Missing events do not prove quiescence or exclude a slow cycle.`,
      scope: String.raw`The theorem requires the global invariant-circle/attraction assumptions in addition to a generic fold. The Morris–Lecar illustration uses an explicitly chosen parameter set in neuro-3.6, not a reconstruction of an original experimental table. Its finite trajectories and fitted slopes are consistent with the SNIC scaling but do not certify the exact global connection or asymptotic exponent. The phase orbit lasts 300 ms below the fold or 700 ms above; rate curves use 5000/9000 ms and the selected point 6000 ms, initialized at V=−60 with w=w∞(−60), retaining only crossings after the first third. Rates are Hz because time is ms. The finite-range fit and its coefficient are not universal theorem constants.`,
      deps: ['neuro-3.2', 'ode-8.3', 'ode-1.3'],
      see: ['neuro-3.4', 'neuro-3.7', 'neuro-2.8'],
      refs: ['Izhikevich, Dynamical Systems in Neuroscience (2007), complete §6.1.1–6.1.2 printed162–168 and §6.2.1 printed180, Eq.(6.2), Fig.6.6–6.8 and6.20: https://izhikevich.org/publications/dsn.pdf', 'Gerstner et al., Neuronal Dynamics (2014), §4.2.1 Eqs.(4.6)–(4.10) and complete §4.4.1: https://neuronaldynamics.epfl.ch/online/Ch4.S4.html'],
      tags: ['saddle-node', 'type I'],
      credit: 'SNIC geometry and period derivation follow the cited author treatments; the chosen calcium–potassium example is an atlas numerical illustration.',
      verify: false,
      viz(v) {
        const p=ML_SETS.snic,fold=mlFolds(p).find(q=>q.I>30&&q.I<50),Ic=fold.I;
        const I=v.slider('current $I$',30,60,38,{step:.1,fmt:x=>`${x.toFixed(1)} µA/cm²`});
        const sA=v.stage({x:[-75,60],y:[-.05,1.05],axes:'box',gutter:true,xlabel:'V (mV)',ylabel:'w',height:330,weight:1.2,minWidth:300});
        const sB=v.stage({x:[30,76],y:[0,24],axes:'box',gutter:true,xlabel:'I (µA/cm²)',ylabel:'finite crossing rate (Hz)',height:330,weight:1,minWidth:260});
        const sC=v.stage({x:[.05,40],y:[.1,40],xlog:true,ylog:true,axes:'box',gutter:true,xlabel:'I − Ic',ylabel:'finite crossing rate (Hz)',height:330,weight:1,minWidth:260});
        const grid=Array.from({length:26},(_,i)=>Ic+.1+i*1.4),gridLog=Array.from({length:13},(_,i)=>Ic+.1*10**(i*2.4/12));let fit=null;
        const getFit=()=>{if(fit)return fit;const lin=mlRateCurveAudit('snic',p,grid,{T:5000}),lg=mlRateCurveAudit('snic',p,gridLog,{T:9000}).filter(q=>q.rate!==null),near=lg.filter(q=>q.I-Ic<=3),xs=near.map(q=>Math.log(q.I-Ic)),ys=near.map(q=>Math.log(q.rate)),mx=mean(xs),my=mean(ys);let sxy=0,sxx=0;for(let j=0;j<xs.length;j++){sxy+=(xs[j]-mx)*(ys[j]-my);sxx+=(xs[j]-mx)**2;}const slope=sxy/sxx,c=Math.exp(my-slope*mx),cs=mean(lg.filter(q=>q.I-Ic<2).map(q=>q.rate/Math.sqrt(q.I-Ic)));return fit={lin,lg,slope,c,cs,N:near.length};};
        v.render(()=>{
          const i=I.value,F=getFit(),ys=mlOrbit(p,i,i>Ic?700:300,{dt:.25,every:2}),eq=mlEquilibriaAudit(p,i),xlim=[Math.min(-75,...ys.map(q=>q[0]),...eq.map(q=>q.V))-1,Math.max(60,...ys.map(q=>q[0]),...eq.map(q=>q.V))+1],ylim=[-.05,1.05];sA.setView(xlim,ylim);
          for(const[fn,color]of[[V=>mlWnull(p,V,i),'orange'],[V=>mlWinf(p,V),'purple']])for(const path of clippedMLCurve(fn,[Math.max(-80,xlim[0]),xlim[1]],ylim))sA.path(path,{color,width:2.2});sA.path(ys.map(q=>[q[0],q[1]]),{color:'accent',width:2});for(const e of eq)eqDot(sA,e.V,e.w,e.type);
          const rate=mlRateCurveAudit('snic',p,[i],{T:6000})[0],xmax=Math.max(75,...grid),ymax=Math.max(24,F.cs*Math.sqrt(xmax-Ic)*1.08,...F.lin.filter(q=>q.rate!==null).map(q=>q.rate*1.08));sB.setView([30,xmax],[0,ymax]);
          const resolved=F.lin.filter(q=>q.rate!==null);sB.path(F.lin.map(q=>q.rate===null?null:[q.I,q.rate]),{color:'accent',width:2});sB.dots(resolved.map(q=>[q.I,q.rate]),{r:2.5,color:'accent'});sB.path(Array.from({length:161},(_,k)=>{const x=Ic+(xmax-Ic)*k/160;return[x,F.cs*Math.sqrt(x-Ic)];}),{color:'orange',dash:[5,4],width:1.6});sB.vline(Ic,{color:'green',dash:[3,4],width:1.2});
          const curves=[Array.from({length:161},(_,k)=>{const d=.05*(40/.05)**(k/160);return[d,F.c*d**F.slope];}),Array.from({length:161},(_,k)=>{const d=.05*(40/.05)**(k/160);return[d,F.cs*Math.sqrt(d)];})],all=[...F.lg.map(q=>q.rate),...curves.flat().map(q=>q[1]),...(rate.rate!==null&&i>Ic?[rate.rate]:[])];sC.setView([Math.min(.05,i>Ic&&rate.rate!==null?(i-Ic)*.9:.05),40],[Math.min(.5,...all)*.9,Math.max(30,...all)*1.1]);sC.dots(F.lg.map(q=>[q.I-Ic,q.rate]),{r:3.5,color:'accent'});curves.forEach((path,k)=>sC.path(path,{color:k?'ink':'orange',dash:k?[2,4]:[5,4],width:k?1:1.6}));if(rate.rate!==null){sB.dot(i,rate.rate,{r:6,color:'gold'});if(i>Ic)sC.dot(i-Ic,rate.rate,{r:6,color:'gold'});}v._r={eq,rate,i,F};
        });
        v.legend([['accent','finite-run crossing rates'],['orange','empirical guide/regression',{dash:true}],['ink','slope½ guide',{dash:true}],['green','fold current',{dash:true}]]);
        v.readout(()=>{const r=v._r;if(!r)return'';return String.raw`Fold $I_c=${v.fix(Ic,6)}$ µA/cm² at $V=${v.fix(fold.V,5)}$ mV; determinant $${v.sci(fold.det,2)}$, transverse eigenvalue ${v.fix(fold.tr,5)}/ms. Selected I=${v.fix(r.i,1)}: ${r.eq.length} ${r.eq.length===1?'equilibrium':'equilibria'} (${r.eq.map(q=>q.type).join(', ')}).`+'\n'+String.raw`6000 ms run, crossings retained after 2000 ms: ${r.rate.count}; ${r.rate.rate===null?'rate unresolved (fewer than three retained crossings)':v.fix(r.rate.rate,4)+' Hz from finite intervals'}.`+'\n'+String.raw`Log–log slope over 0.1≤I−Ic≤3: ${v.fix(r.F.slope,4)}, ${r.F.N} resolved points (asymptotic prediction½). Empirical square-root coefficient ${v.fix(r.F.cs,4)}; no certified asymptotic/global-connection claim.`;});
      },
    },
  ],
};
