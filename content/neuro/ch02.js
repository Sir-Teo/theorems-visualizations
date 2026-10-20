// Computational Neuroscience — Chapter 2: The Hodgkin–Huxley model
// (this file: 2.1–2.5; 2.6–2.9 are in ch02-b.js and the landmark paper 2.10 in ch02-papers.js)
//
// Facts used and how they were checked (Oct 2026):
// - The n⁴ and m³h forms, the rate functions and the parameters (ḡNa = 120, ḡK = 36, ḡL = 0.3 mS/cm², C = 1 µF/cm², 6.3 °C,
//   temperature factor 3^((T−6.3)/10)) are those of Hodgkin & Huxley (1952), J. Physiol. 117: 500–544 (Crossref DOI
//   10.1113/jphysiol.1952.sp004764), in the modern convention with rest at −65 mV (Dayan & Abbott §5.6; Sterratt et al. Box 3.5).
//   The paper's page images could not be text-read here, so statements about what the paper itself says (power 4 chosen to fit the
//   records; K⁺ passes when four similar particles are in place) rest on secondary accounts and are worded accordingly.
// - Every curve on these pages is computed from the model; no original record of the 1952 experiments is reproduced.
import { HH, ION_COL, gateInf, gateTau, gateRates, clamp, trace, hhSim, hhRun, spikeTimes, pulse, gateAt } from './ch02.shared.js';

const GC = { n: ION_COL.K, m: ION_COL.Na, h: 'teal' };
const bisectAmp = (spikes, hi, lo = 0, it = 18) => {
  if (!spikes(hi)) return Infinity;
  for (let i = 0; i < it; i++) { const m = (lo + hi) / 2; if (spikes(m)) hi = m; else lo = m; }
  return hi;
};
/** Number of spikes (upward crossings of 0 mV) in the response to the current waveform. */
const nSpikes = (I, tEnd, opt = {}) => hhRun(I, { tEnd, dt: 0.04, ...opt }).spikes.length;

export default {
  collection: 'neuro',
  chapter: 2,
  title: 'The Hodgkin–Huxley model',
  summary: String.raw`From voltage-clamp records of the squid giant axon, Hodgkin and Huxley built four equations, one for the voltage and three for gating variables, that reproduce the action potential quantitatively. The model explains threshold, all-or-none spikes, refractoriness, rebound and repetitive firing, and its descendants with additional currents explain the variety of real neurons. With stochastic channels, the same model shows how a small number of channels makes spike timing noisy.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Model',
      name: 'Potassium conductance and the n⁴ gate',
      statement: String.raw`In the Hodgkin–Huxley description the delayed-rectifier potassium conductance of the squid axon is $g_K(t) = \bar g_K\, n(t)^4$, where the gating variable obeys first-order kinetics $\dot n = \alpha_n(V)(1-n) - \beta_n(V)\,n$. After a voltage-clamp step from a hyperpolarized holding potential, where $n\approx 0$, to a fixed $V$, the conductance rises as
$$g_K(t) = g_{K\infty}\big(1 - e^{-t/\tau_n}\big)^4,\qquad g_{K\infty} = \bar g_K\, n_\infty(V)^4,\quad \tau_n = \frac{1}{\alpha_n+\beta_n},$$
an S-shaped curve with a delay at onset, After repolarization, n relaxes toward the new equilibrium fraction. If that target is zero, $g_K\propto e^{-4t/\tau_n}$; for a nonzero target, the conductance approaches $\bar g_K n_\infty^4$ with a generally leading $e^{-t/\tau_n}$ correction instead. The exponent 4 is the model's empirical choice for the squid axon; other preparations are fitted with other powers.`,
      idea: String.raw`A single first-order process (ode-1.5) starts with its steepest slope, so no single exponential can produce the slow start of the measured potassium conductance (neuro-1.5). If $n$ is the probability that one independent gate is open (neuro-1.7), a channel conducting only when $p$ such gates are open has conductance $\propto n^p$, and raising an exponential rise $1-e^{-t/\tau}$ to the power $p$ gives a sigmoid whose delay grows with $p$. Secondary accounts of the 1952 paper report that Hodgkin and Huxley took the lowest power that fitted their records, which was 4, and pictured it as four similar particles that must all be in place for K⁺ to pass. Today the same structure is read as four voltage-sensing subunits of the channel.

For the independent-subunit interpretation, prob-2.1.11 gives the joint law of the four gate indicators as a product at a fixed time. The conducting event is the single box in which all four indicators equal one, so its probability is $n^4$. Multiplication by the maximal channel-population conductance gives the stated potassium conductance. This mathematical consequence of the chosen independence model does not derive the empirical number of subunits from first principles or establish independence in a real channel.`,
      caption: String.raw`Generated records: the dots are $g_K(t)$ of the model (holding potential $-100$ mV, a step to the voltage you choose) plus Gaussian measurement noise, not the original 1952 records. Each power $p=1,\dots,6$ of $g_{K\infty}(1-e^{-t/\tau})^p$ is fitted to them by least squares; the line shows your chosen $p$ and the dashed line the best single exponential ($p=1$). Top right: the rms residual for every $p$. Below: if the power is right, $-\ln\!\big(1-(g/g_{K\infty})^{1/p}\big)$ is a straight line through the origin of slope $1/\tau$. Raise the noise and watch the preference for $p=4$ become less sharp; the straightening test is the sensitive one.`,
      scope: String.raw`Squid giant axon at 6.3 °C. The fourth power is an empirical fit; it describes onset and offset well but not every detail of the records (later reanalyses use other forms), and the exponent differs in other preparations.`,
      deps: ['neuro-1.7', 'neuro-1.5', 'prob-2.1.11'],
      see: ['neuro-2.10', 'neuro-2.3'],
      refs: ['Gerstner §2.2', 'Dayan–Abbott ch. 5'],
      tags: ['potassium', 'gating'],
      credit: 'A. L. Hodgkin and A. F. Huxley, 1952 (J. Physiol. 117: 500–544)',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1952.sp004764' },
      viz(v) {
        const Vh = -100, T = 12;
        const Vs = v.slider('step to $V$', -40, 60, 10, { step: 1, fmt: (x) => `${x} mV` });
        const pSel = v.select('power $p$', [1, 2, 3, 4, 5, 6].map((p) => ({ value: p, label: `${p}` })), 4);
        const noise = v.slider('measurement noise', 0, 10, 2, { step: 0.5, fmt: (x) => `${x} %` });
        const sA = v.stage({ x: [0, T], y: [0, 40], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'gK (mS/cm²)', height: 300, weight: 1.5, minWidth: 380 });
        const sB = v.stage({ x: [0.4, 6.6], y: [0, 1], axes: 'box', gutter: true, xlabel: 'power p', ylabel: 'rms residual', height: 300, weight: 1, minWidth: 260 });
        const sC = v.stage({ x: [0, T], y: [0, 8], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: '−ln(1 − (g/g∞)^(1/p))', height: 300, weight: 1, minWidth: 280 });
        const r = v.rng(11), Z = Array.from({ length: 60 }, () => r.normal());
        const ts = Array.from({ length: 60 }, (_, i) => 0.2 * (i + 1));
        const n0 = gateInf('n', Vh);
        let key = '', S = null;
        const get = () => {
          const k = `${Vs.value}|${noise.value}`; if (k === key) return S; key = k;
          const V = Vs.value, [a, b] = gateRates('n', V), tau = 1 / (a + b), ninf = a / (a + b);
          const clean = ts.map((t) => HH.gK * gateAt('n', n0, V, t) ** 4);
          const plateau = Math.max(HH.gK * ninf ** 4 * (1 - Math.exp(-T / tau)) ** 4, 1e-3);
          const y = clean.map((c, i) => c + (noise.value / 100) * plateau * Z[i]);
          const fits = [1, 2, 3, 4, 5, 6].map((p) => {
            const sse = (q) => { const A = Math.exp(q[0]), tt = Math.exp(q[1]); let s = 0; for (let i = 0; i < ts.length; i++) { const d = A * (1 - Math.exp(-ts[i] / tt)) ** p - y[i]; s += d * d; } return s; };
            let best = null;
            for (const f0 of [0.6, 2, 6]) { const res = v.M.nelderMead(sse, [Math.log(Math.max(y[y.length - 1], plateau * 0.5) * 1.1), Math.log(tau * f0)], { step: [0.3, 0.4], tol: 1e-12, maxIt: 500 }); if (!best || res.fx < best.fx) best = res; }
            return { p, A: Math.exp(best.x[0]), tau: Math.exp(best.x[1]), rms: Math.sqrt(best.fx / ts.length) };
          });
          S = { V, tau, ninf, y, fits, plateau, gInf: HH.gK * ninf ** 4 };
          return S;
        };
        v.render(() => {
          const R = get(), F = R.fits[pSel.value - 1], F1 = R.fits[0], ymax = Math.max(R.plateau, ...R.y) * 1.2;
          sA.setView([0, T], [-0.03 * ymax, ymax]);
          sA.fn((t) => HH.gK * gateAt('n', n0, R.V, t) ** 4, { color: 'faint', width: 1.2, dash: [3, 3] });
          sA.fn((t) => F1.A * (1 - Math.exp(-t / F1.tau)), { color: 'red', width: 1.6, dash: [6, 4] });
          sA.fn((t) => F.A * (1 - Math.exp(-t / F.tau)) ** F.p, { color: 'accent', width: 2.4 });
          sA.dots(ts.map((t, i) => [t, R.y[i]]), { r: 2.6, color: 'gold' });
          sA.text('data', ts[8], R.y[8], { size: 11, color: 'gold', dx: -4, dy: -10, align: 'right' });
          // rms by power
          const rmsMax = Math.max(...R.fits.map((f) => f.rms)) * 1.15 || 1;
          sB.setView([0.4, 6.6], [0, rmsMax]);
          const bestP = R.fits.reduce((a, f) => (f.rms < a.rms ? f : a)).p;
          R.fits.forEach((f, i) => sB.rect(i + 1 - 0.38, 0, i + 1 + 0.38, f.rms, { fill: i + 1 === bestP ? 'green' : i + 1 === pSel.value ? 'accent' : 'muted', fillAlpha: 0.75, stroke: false }));
          for (let q = 1; q <= 6; q++) sB.text(String(q), q, 0, { size: 11, color: 'ink', align: 'center', baseline: 'top', dy: 4 });
          // straightening
          sC.setView([0, T], [0, 7]);
          const lin = []; for (let i = 0; i < ts.length; i++) { const q = R.y[i] / F.A; if (q > 0.02 && q < 0.97) { const w = -Math.log(1 - q ** (1 / F.p)); if (isFinite(w)) lin.push([ts[i], w]); } }
          sC.line(0, 0, T, T / F.tau, { color: 'accent', width: 2 });
          sC.dots(lin, { r: 2.6, color: 'gold' });
        });
        v.legend([['gold', 'noisy $g_K$ records'], ['accent', 'fit with chosen $p$'], ['red', 'best single exponential', { dash: true }], ['green', 'lowest residual'], ['faint', 'noise-free model', { dash: true }]]);
        v.readout(() => {
          const R = get(), F = R.fits[pSel.value - 1], best = R.fits.reduce((a, f) => (f.rms < a.rms ? f : a));
          return String.raw`$V = ${R.V}$ mV: $n_\infty^4\bar g_K = ${v.fix(R.gInf, 2)}$ mS/cm², $\tau_n = ${v.fix(R.tau, 2)}$ ms (from the rate functions)` + '\n' +
            String.raw`fit with $p=${F.p}$: $g_{K\infty} = ${v.fix(F.A, 2)}$, $\tau = ${v.fix(F.tau, 2)}$ ms, rms ${v.fix(F.rms, 3)} · best power: $p = ${best.p}$ (rms ${v.fix(best.rms, 3)}) · single exponential: rms ${v.fix(R.fits[0].rms, 3)}` +
            (F.p === 4 ? String.raw` · for $p=4$ the fitted $\tau$ should equal $\tau_n$ (${v.fix(100 * (F.tau / R.tau - 1), 1)} %)` : '');
        });
      },
    },

    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Model',
      name: 'Sodium conductance: activation m³ and inactivation h',
      statement: String.raw`In the Hodgkin–Huxley description the sodium conductance is $g_{Na}(t) = \bar g_{Na}\, m(t)^3 h(t)$. The activation variable $m$ and the inactivation variable $h$ each follow first-order kinetics, $\dot x = \alpha_x(V)(1-x)-\beta_x(V)\,x$, but with very different speeds and opposite voltage dependence: $m_\infty(V)$ rises with depolarization and $\tau_m$ is of the order of a fraction of a millisecond, while $h_\infty(V)$ falls and $\tau_h$ is several times slower. After a depolarizing step the conductance therefore rises quickly as $m^3$, reaches a peak, and then decays as $h$ falls, even though the voltage is still held: the sodium current is **transient**. The fraction of channels that can open is $h_\infty(V_{\text{hold}})$ at the holding potential.`,
      idea: String.raw`Two first-order gates of opposite sign (neuro-1.7) multiply. Their steady states $m_\infty^3(V)$ and $h_\infty(V)$ overlap only in a narrow window, and their time constants are separated, so under voltage clamp (neuro-1.5) the product has a peak at a time set mostly by $\tau_m$ and an exponential decay set by $\tau_h$. Hodgkin and Huxley separated the two processes by using prepulses to change $h$ before the test step, and a power of 3 for $m$ was chosen to describe the rising phase (secondary accounts of the 1952 papers). In modern terms three voltage sensors must move for the pore to open, and a separate inactivation particle then blocks it.

Apply the independent-product law prob-2.1.11 to three activation indicators of open probability m and one availability indicator of probability h. The event in which all four required states hold has probability $m^3h$, which produces the model conductance after multiplication by its maximum. The last coordinate has a different marginal law and time scale; independence does not require identical coordinates. Coupled activation and inactivation need a different joint law, as the scope already notes.`,
      caption: String.raw`Voltage clamp from the holding potential to the step at $t=0$ (6.3 °C, squid-axon rate functions). Left: the activation cube $m^3$, the inactivation $h$ and their product $g_{Na}/\bar g_{Na}$. Drag the step voltage and see the peak move earlier and higher, while the decay speeds up. Lower the holding potential: more channels are available, and the peak grows. Switch inactivation off and the conductance no longer decays. Top right: the peak against step voltage for your holding potential and for $-100$ mV. Below: the steady states; the product $m_\infty^3h_\infty$ (gold, magnified 20 times) is the small window where sodium channels are open but not inactivated.`,
      scope: String.raw`Model of the squid axon at 6.3 °C; the rate functions are empirical fits. A real channel's inactivation is coupled to its activation, which the independent product $m^3h$ ignores (a Markov scheme with coupling fits better).`,
      deps: ['neuro-1.7', 'neuro-1.5', 'prob-2.1.11'],
      see: ['neuro-2.3', 'neuro-2.6', 'neuro-2.10'],
      refs: ['Gerstner §2.2', 'Dayan–Abbott ch. 5'],
      tags: ['sodium', 'inactivation'],
      credit: 'A. L. Hodgkin and A. F. Huxley, 1952 (J. Physiol. 117: 500–544)',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1952.sp004764' },
      viz(v) {
        const Vs = v.slider('step to $V$', -50, 50, -10, { step: 1, fmt: (x) => `${x} mV` });
        const Vhs = v.slider('holding $V_h$', -100, -40, -65, { step: 1, fmt: (x) => `${x} mV` });
        const noInact = v.toggle('remove inactivation ($h\\equiv 1$)', false);
        const sA = v.stage({ x: [-1, 10], y: [-0.03, 1.03], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'fraction of ḡNa', height: 290, weight: 1.4, minWidth: 360 });
        const sB = v.stage({ x: [-50, 50], y: [0, 100], axes: 'box', gutter: true, xlabel: 'step V (mV)', ylabel: 'peak gNa (mS/cm²)', height: 290, weight: 1, minWidth: 260 });
        const sC = v.stage({ x: [-110, 50], y: [0, 1.03], axes: 'box', gutter: true, xlabel: 'V (mV)', ylabel: 'steady state', height: 290, weight: 1, minWidth: 260 });
        const rec = (V, Vh, t) => { const m = gateAt('m', gateInf('m', Vh), V, t), h = noInact.value ? 1 : gateAt('h', gateInf('h', Vh), V, t); return [m, h]; };
        const peak = (V, Vh) => { let best = 0, tb = 0; for (let t = 0; t <= 14; t += 0.05) { const [m, h] = rec(V, Vh, t); const g = m ** 3 * h; if (g > best) { best = g; tb = t; } } return [best * HH.gNa, tb]; };
        v.render(() => {
          const V = Vs.value, Vh = Vhs.value, m0 = gateInf('m', Vh), h0 = noInact.value ? 1 : gateInf('h', Vh);
          const mf = (t) => (t < 0 ? m0 : gateAt('m', m0, V, t)), hf = (t) => (t < 0 ? h0 : noInact.value ? 1 : gateAt('h', h0, V, t));
          sA.fn((t) => mf(t) ** 3, { color: ION_COL.Na, width: 1.6, dash: [5, 4] });
          sA.fn((t) => hf(t), { color: 'teal', width: 1.8 });
          sA.fn((t) => mf(t) ** 3 * hf(t), { color: ION_COL.Na, width: 2.8, fill: true, base: 0 });
          sA.vline(0, { color: 'muted', dash: [3, 3] });
          const [pk, tp] = peak(V, Vh);
          sA.dot(tp, pk / HH.gNa, { r: 5, color: 'gold' });
          // peak curve
          const curve = (Vhold) => { const pts = []; for (let x = -50; x <= 50; x += 1) pts.push([x, peak(x, Vhold)[0]]); return pts; };
          sB.setView([-50, 50], [0, 100]);
          sB.path(curve(-100), { color: 'faint', width: 1.4, dash: [4, 4] });
          sB.path(curve(Vh), { color: ION_COL.Na, width: 2.6 });
          sB.dot(V, pk, { r: 5.5, color: 'gold' });
          // steady states
          sC.fn((x) => gateInf('m', x) ** 3, { color: ION_COL.Na, width: 2 });
          sC.fn((x) => gateInf('h', x), { color: 'teal', width: 2 });
          sC.fn((x) => 20 * gateInf('m', x) ** 3 * gateInf('h', x), { color: 'gold', width: 2, fill: true, base: 0, fillAlpha: 0.3 });
          sC.dot(Vh, gateInf('h', Vh), { r: 5, color: 'muted', label: 'V_h', labelPos: 'ne' });
          sC.dot(V, gateInf('m', V) ** 3, { r: 5, color: 'gold', label: 'V', labelPos: 'nw' });
        });
        v.legend([[ION_COL.Na, '$m^3$ (dashed) and $g_{Na}/\\bar g_{Na}$'], ['teal', '$h$'], ['gold', 'step; window $20\\,m_\\infty^3h_\\infty$'], ['faint', 'peak from $V_h=-100$ mV', { dash: true }]]);
        v.readout(() => {
          const V = Vs.value, Vh = Vhs.value, [pk, tp] = peak(V, Vh);
          return String.raw`step to $${V}$ mV from $V_h=${Vh}$ mV: available fraction $h_\infty(V_h) = ${v.fix(gateInf('h', Vh), 3)}$ · peak $g_{Na} = ${v.fix(pk, 1)}$ mS/cm² at $t = ${v.fix(tp, 2)}$ ms` + '\n' +
            String.raw`$\tau_m(V) = ${v.fix(gateTau('m', V), 3)}$ ms, $\tau_h(V) = ${v.fix(gateTau('h', V), 2)}$ ms (decay of the conductance, ratio ${v.fix(gateTau('h', V) / gateTau('m', V), 1)}) · $m_\infty^3 h_\infty\bar g_{Na}$ at $V$: $${v.fix(gateInf('m', V) ** 3 * gateInf('h', V) * HH.gNa, 2)}$ mS/cm² (the sustained part)`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Model',
      name: 'Hodgkin–Huxley equations',
      statement: String.raw`The space-clamped squid-axon membrane obeys four coupled differential equations, with $x\in\{m,h,n\}$ and $I$ the injected current density,
$$C\dot V = I - \bar g_{Na}m^3h\,(V-E_{Na}) - \bar g_K n^4 (V-E_K) - g_L (V-E_L),\qquad \dot x = \alpha_x(V)(1-x)-\beta_x(V)\,x,$$
with $C = 1\ \mu\text{F/cm}^2$, $\bar g_{Na} = 120$, $\bar g_K = 36$, $g_L = 0.3$ mS/cm², $E_{Na} = 50$, $E_K = -77$, $E_L = -54.4$ mV (rest at $-65$ mV) and empirical rate functions $\alpha_x,\beta_x$ fitted at 6.3 °C. All rates scale by $3^{(T-6.3)/10}$ at other temperatures. A suprathreshold input triggers a spike of about $100$ mV amplitude and about a millisecond width, followed by an undershoot.`,
      idea: String.raw`This is the conductance-based membrane equation (neuro-1.4) with the two voltage-dependent conductances measured under voltage clamp: the delayed-rectifier $n^4$ of neuro-2.1 and the transient $m^3h$ of neuro-2.2. The spike is a race between three first-order processes: sodium activation $m$ is fast and regenerative (depolarization opens more sodium channels, which depolarize more), then $h$ falls and $n$ rises over a millisecond, which together turn the net current outward and repolarize the membrane. No spike was put in by hand; threshold, amplitude and propagation speed all came out of the fitted rate functions (neuro-2.10).`,
      caption: String.raw`A current pulse (amplitude and width are yours) is integrated with a fourth-order Runge–Kutta scheme. Top: $V(t)$; middle: the gates $m$ (fast), $h$ and $n$ (slow); bottom: the three ionic currents (inward negative), whose sum cancels the capacitive current. Drag the time cursor to read all variables at one instant. Below threshold the response is a decaying bump; just above it a full spike appears. Raise the temperature to 18.5 °C and everything happens about 3.5 times faster, with a smaller spike.`,
      scope: String.raw`Space-clamped (uniform) squid giant axon; a single compartment without spatial propagation. The rate functions are fits at 6.3 °C. At higher temperatures the same factor $3^{(T-6.3)/10}$ multiplies every rate (the original description) although a real axon's channels have different temperature sensitivities.`,
      deps: ['neuro-2.1', 'neuro-2.2', 'neuro-1.4'],
      see: ['neuro-2.10', 'neuro-3.1'],
      refs: ['Gerstner §2.2', 'Dayan–Abbott ch. 5'],
      tags: ['action potential', 'conductance-based'],
      credit: 'A. L. Hodgkin and A. F. Huxley, 1952 (J. Physiol. 117: 500–544; Nobel Prize 1963)',
      links: { doi: 'https://doi.org/10.1113/jphysiol.1952.sp004764', wikipedia: 'https://en.wikipedia.org/wiki/Hodgkin%E2%80%93Huxley_model' },
      viz(v) {
        const Is = v.slider('pulse amplitude $I$', 0, 40, 12, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} µA/cm²` });
        const Ds = v.slider('pulse width', 0.1, 10, 1, { step: 0.1, log: true, fmt: (x) => `${v.fix(x, 1)} ms` });
        const Tsel = v.select('temperature', [{ value: 6.3, label: '6.3 °C' }, { value: 18.5, label: '18.5 °C' }], 6.3);
        const tc = v.slider('time cursor', 0, 25, 3, { step: 0.05, fmt: (x) => `${v.fix(x, 2)} ms` });
        const sV = v.stage({ x: [0, 25], y: [-90, 60], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 230, weight: 1, full: true });
        const sG = v.stage({ x: [0, 25], y: [0, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'gates', height: 170, weight: 1, full: true });
        const sI = v.stage({ x: [0, 25], y: [-1, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'ionic currents (µA/cm²)', height: 190, weight: 1, full: true });
        let key = '', R = null;
        const get = () => {
          const k = `${Is.value}|${Ds.value}|${Tsel.value}`; if (k === key) return R; key = k;
          R = hhSim(pulse(1, Ds.value, Is.value), { T: Tsel.value, tEnd: 25, dt: 0.02, every: 2 });
          return R;
        };
        v.render(() => {
          const o = get(), c = tc.value, k = Math.min(o.t.length - 1, Math.round(c / (o.t[1] - o.t[0])));
          sV.hline(HH.ENa, { color: ION_COL.Na, dash: [3, 4], width: 1 }); sV.hline(HH.EK, { color: ION_COL.K, dash: [3, 4], width: 1 });
          sV.text('E_Na', 24.8, HH.ENa, { size: 10, color: ION_COL.Na, align: 'right', dy: -6 }); sV.text('E_K', 24.8, HH.EK, { size: 10, color: ION_COL.K, align: 'right', dy: 9 });
          sV.rect(1, -90, 1 + Ds.value, -90 + Math.min(40, Is.value * 1.2), { fill: 'gold', fillAlpha: 0.5, stroke: false });
          trace(sV, o.t, o.V, { color: 'accent', width: 2.4 });
          sV.vline(c, { color: 'muted', width: 1 });
          for (const g of ['m', 'h', 'n']) trace(sG, o.t, o[g], { color: GC[g], width: 2 });
          sG.vline(c, { color: 'muted', width: 1 });
          let im = 1; for (let i = 0; i < o.t.length; i++) im = Math.max(im, Math.abs(o.INa[i]), Math.abs(o.IK[i]));
          sI.setView([0, 25], [-im * 1.08, im * 1.08]);
          for (const [key2, col] of [['INa', ION_COL.Na], ['IK', ION_COL.K], ['IL', 'green']]) {
            if (key2 !== 'IL') sI.path(o.t.map((t, i) => [t, 0]).concat(o.t.map((t, i) => [t, o[key2][i]]).reverse()), { color: col, fill: col, fillAlpha: 0.12, stroke: false });
            trace(sI, o.t, o[key2], { color: col, width: 2 });
          }
          sI.hline(0, { color: 'muted', width: 1 }); sI.vline(c, { color: 'muted', width: 1 });
        });
        v.legend([['accent', '$V$'], [GC.m, '$m$ and $I_{Na}$'], [GC.h, '$h$'], [GC.n, '$n$ and $I_K$'], ['green', '$I_L$']]);
        v.readout(() => {
          const o = get(), c = tc.value, k = Math.min(o.t.length - 1, Math.round(c / (o.t[1] - o.t[0])));
          const sp = spikeTimes(o.t, o.V, 0), pk = Math.max(...o.V);
          let qNa = 0, qK = 0; const dt = o.t[1] - o.t[0]; for (let i = 0; i < o.t.length; i++) { qNa += o.INa[i] * dt; qK += o.IK[i] * dt; }
          return String.raw`at $t=${v.fix(c, 2)}$ ms: $V=${v.fix(o.V[k], 1)}$ mV, $m=${v.fix(o.m[k], 3)}$, $h=${v.fix(o.h[k], 3)}$, $n=${v.fix(o.n[k], 3)}$, $g_{Na}=${v.fix(HH.gNa * o.m[k] ** 3 * o.h[k], 1)}$, $g_K=${v.fix(HH.gK * o.n[k] ** 4, 1)}$ mS/cm²` + '\n' +
            (sp.length ? String.raw`spike: peak $${v.fix(pk, 1)}$ mV (just below $E_{Na}=50$) · net charge so far through Na⁺: $${v.fix(qNa, 1)}$, through K⁺: $${v.fix(qK, 1)}$ µA·ms/cm² (inward and outward nearly cancel; the pulse supplies only ${v.fix(Is.value * Ds.value, 1)})` : String.raw`no spike: peak $V = ${v.fix(pk, 1)}$ mV; increase the pulse above threshold`);
        });
      },
    },

    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Phenomenon',
      name: 'Threshold and all-or-none spikes',
      statement: String.raw`When the Hodgkin–Huxley membrane receives a brief current pulse, the response depends sharply on its size. Pulses below a **threshold** amplitude produce only a small, graded, passively decaying depolarization, with peak growing about linearly with the pulse. Just above the threshold, the response is a full-size spike whose amplitude and shape are almost independent of the stimulus: the spike is **all-or-none**. The threshold is not a fixed voltage: it depends on the stimulus shape (for short pulses it is a fixed charge, for long pulses a fixed current, the rheobase), and a slow ramp can bypass it.`,
      idea: String.raw`Near rest the net ionic current is a stable restoring current, so small depolarizations decay (neuro-1.2). Raising $V$ opens sodium channels faster than the leak and potassium can pull back; at one value of the stimulus the inward sodium current first exceeds the outward current, and from there the regenerative loop runs to completion at its own pace, limited by the sodium reversal potential (neuro-2.3). The fast variable $m$ moves before $h$ and $n$ can respond, which is why a brief pulse needs a fixed charge and a long one a fixed current.

The finite-window continuity qualification follows from parameter dependence ode-2.8. With the removable limits of the analytical HH rates included, the vector field is smooth in state and pulse amplitude on bounded state regions. For a pulse with fixed switching times, compose the smooth flow on each constant-input interval. The resulting voltage traces vary continuously and uniformly on a common finite observation window; the difference of their maxima is bounded by the largest trace difference. A steep response curve is therefore not a finite-time discontinuity. This does not make infinite-time attractor selection or a spike-count detector continuous.`,
      caption: String.raw`Pulses of a chosen duration are delivered at $t=2$ ms. Left: a ladder of responses at fixed multiples of the threshold, from 0.25 to 2 times (grey below, green above) and the chosen amplitude in blue: all the green traces have almost the same size. Right: the peak voltage against pulse amplitude; drag the handle along it and see the jump from a few millivolts to a full spike at the threshold. Below: the threshold amplitude against pulse duration, computed by bisection for each duration (log scales); the plateau is the rheobase and the slope $-1$ line for short pulses is a constant charge.`,
      scope: String.raw`Space-clamped Hodgkin–Huxley membrane, 6.3 °C, current pulses at rest. The sharpness of the jump is finite, not a true discontinuity: the response grows steeply in a very narrow interval of amplitudes (the model is a smooth ODE and has no sharp threshold), and spatially extended axons add further effects.`,
      deps: ['neuro-2.3', 'ode-2.8'],
      see: ['neuro-3.4', 'neuro-3.5'],
      refs: ['Gerstner §4.1'],
      tags: ['threshold', 'all-or-none'],
      credit: 'Model of A. L. Hodgkin and A. F. Huxley, 1952',
      viz(v) {
        const Dsel = v.select('pulse duration', [{ value: 0.2, label: '0.2 ms' }, { value: 1, label: '1 ms' }, { value: 5, label: '5 ms' }], 1);
        const sA = v.stage({ x: [0, 14], y: [-90, 60], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 290, weight: 1.1, minWidth: 300 });
        const sB = v.stage({ x: [0, 1], y: [-70, 60], axes: 'box', gutter: true, xlabel: 'pulse amplitude (µA/cm²)', ylabel: 'peak V (mV)', height: 290, weight: 1, minWidth: 280 });
        const sC = v.stage({ x: [0.1, 20], y: [1, 200], xlog: true, ylog: true, axes: 'box', gutter: true, xlabel: 'pulse duration (ms)', ylabel: 'threshold (µA/cm²)', height: 290, weight: 1, minWidth: 280 });
        const run = (a, d) => hhSim(pulse(2, d, a), { tEnd: 14, dt: 0.04, every: 2 });
        const peakOf = (a, d) => hhRun(pulse(2, d, a), { tEnd: 14, dt: 0.02 }).peak;
        const thrOf = (d) => bisectAmp((a) => nSpikes(pulse(2, d, a), 14, { dt: 0.02 }) > 0, 400, 0, 20);
        const durs = Array.from({ length: 16 }, (_, i) => 0.1 * Math.pow(20 / 0.1, i / 15));
        const sd = durs.map(thrOf);
        const cache = {};
        const tab = (d) => {
          if (cache[d]) return cache[d];
          const th = thrOf(d), amax = th * 2, xs = Array.from({ length: 81 }, (_, i) => (amax * i) / 80);
          return (cache[d] = { th, amax, xs, pk: xs.map((a) => peakOf(a, d)) });
        };
        let amp = null, lastD = null;
        const h = sB.handle(0.5, -60, { color: 'gold', r: 8, constrain: (x) => { const T = tab(Dsel.value); const xx = clamp(x, 0, T.amax); const i = Math.min(79, Math.floor((xx / T.amax) * 80)), f = (xx / T.amax) * 80 - i; return [xx, T.pk[i] * (1 - f) + T.pk[i + 1] * f]; } });
        h.onDrag = () => { amp = h.x; };
        v.render(() => {
          const d = Dsel.value, T = tab(d);
          if (lastD !== d) { lastD = d; amp = T.th * 1.03; sB.setView([0, T.amax], [-70, 60]); }
          const a = clamp(amp, 0, T.amax), i = Math.min(79, Math.floor((a / T.amax) * 80)), f = (a / T.amax) * 80 - i;
          h.set(a, T.pk[i] * (1 - f) + T.pk[i + 1] * f);
          for (const q of [0.25, 0.5, 0.75, 0.9, 0.97, 1.03, 1.1, 1.3, 1.6, 2]) { const o = run(q * T.th, d), spk = Math.max(...o.V) > 0; trace(sA, o.t, o.V, { color: spk ? 'green' : 'muted', width: 1.2, alpha: 0.55 }); }
          const o = run(a, d); trace(sA, o.t, o.V, { color: 'accent', width: 2.6 });
          sA.rect(2, -90, 2 + d, -82, { fill: 'gold', fillAlpha: 0.6, stroke: false });
          sB.vline(T.th, { color: 'red', dash: [4, 4] });
          sB.text('threshold', T.th, -62, { size: 11, color: 'red', align: 'left', dx: 5 });
          sB.path(T.xs.map((x, k) => [x, T.pk[k]]), { color: 'purple', width: 2.4 });
          sC.path(durs.map((x, k) => [x, sd[k]]), { color: 'purple', width: 2.4 });
          const rheo = sd[sd.length - 1];
          sC.hline(rheo, { color: 'muted', dash: [4, 4] }); sC.text('rheobase', 0.12, rheo, { size: 11, color: 'muted', dy: -8, align: 'left' });
          sC.fn((x) => (sd[0] * 0.1) / x, { color: 'faint', dash: [3, 4] });
          sC.dot(d, T.th, { r: 6, color: 'gold' });
        });
        v.legend([['green', 'ladder: spikes'], ['muted', 'ladder: subthreshold'], ['accent', 'chosen amplitude'], ['red', 'threshold', { dash: true }], ['faint', 'constant charge', { dash: true }]]);
        v.readout(() => {
          const d = Dsel.value, T = tab(d), a = clamp(amp ?? T.th, 0, T.amax), pk = peakOf(a, d), pLo = peakOf(T.th * 0.99, d), pHi = peakOf(T.th * 1.01, d);
          return String.raw`$${v.fix(d, 1)}$ ms pulse of $${v.fix(a, 2)}$ µA/cm² gives peak $V = ${v.fix(pk, 1)}$ mV ${pk > 0 ? '(spike)' : '(subthreshold)'} · threshold $\theta = ${v.fix(T.th, 2)}$ µA/cm² (charge $\theta d = ${v.fix(T.th * d, 2)}$ µA·ms/cm²)` + '\n' +
            String.raw`$0.99\,\theta$: peak ${v.fix(pLo, 1)} mV · $1.01\,\theta$: peak ${v.fix(pHi, 1)} mV, a ${v.fix(pHi - pLo, 0)} mV jump for a 2 % change of stimulus · rheobase $\approx ${v.fix(sd[sd.length - 1], 2)}$ µA/cm²`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Phenomenon',
      name: 'Absolute and relative refractory periods',
      statement: String.raw`Just after a spike the Hodgkin–Huxley membrane is hard or impossible to excite again. During the **absolute refractory period** (a few milliseconds at 6.3 °C) no stimulus of any size produces a second spike. During the following **relative refractory period** a second spike is possible, but only for a stimulus larger than the resting threshold, and the required amplitude declines back toward the resting threshold as the gating variables recover. Both effects are a result of the slow gates: $h$ is still low (sodium channels are inactivated) and $n$ is still high (potassium channels are open), so the net inward current available to a new stimulus is reduced.`,
      idea: String.raw`After a spike $h$ has fallen and $n$ has risen (neuro-2.3), and both relax back to rest with time constants of several milliseconds. Early on there are too few un-inactivated sodium channels, whatever the voltage, for the inward current to win over the potassium current (absolute refractoriness); later $h$ has partly recovered but the elevated $n$ and the undershoot still demand a larger depolarization (relative refractoriness). In this model the threshold even dips below its resting value for a while (a supernormal phase) before settling.`,
      caption: String.raw`A first pulse (twice the resting threshold, 1 ms) fires a spike; a second 1 ms pulse follows $\Delta$ ms later. Top left: $V(t)$ for your $\Delta$ and second amplitude (the first pulse is at 2 ms). Top right: for every $\Delta$ the smallest second pulse that fires a second spike, relative to the resting threshold (log scale), found by bisection; where no pulse up to 12 times the resting threshold works, the band is hatched (absolute refractory). The dot shows your choice, green if it fires a second spike, red if not. Below: the gates $h$ and $n$ after the first spike, with your $\Delta$ marked; their recovery sets the curve.`,
      scope: String.raw`Space-clamped Hodgkin–Huxley membrane at 6.3 °C with 1 ms current pulses; the durations quoted here are those of this model and scale with temperature. The boundary between the periods is a convention (here: no second spike for any pulse up to 12 times the resting threshold).`,
      deps: ['neuro-2.3'],
      see: ['neuro-2.4'],
      refs: ['Gerstner §2.3'],
      tags: ['refractory', 'recovery'],
      credit: 'Model of A. L. Hodgkin and A. F. Huxley, 1952',
      viz(v) {
        const CAP = 12, D1 = 1, t0 = 2;
        const th0 = bisectAmp((a) => nSpikes(pulse(t0, D1, a), 14) > 0, 100, 0, 20);
        const amp1 = 2 * th0;
        const second = (D, a) => (t) => pulse(t0, D1, amp1)(t) + pulse(t0 + D, D1, a)(t);
        const fires2 = (D, a) => nSpikes(second(D, a), D + 24) >= 2;
        const Ds = Array.from({ length: 40 }, (_, i) => i + 1);
        const thr = Ds.map((D) => { const th = bisectAmp((a) => fires2(D, a), CAP * th0, 0, 12); return th / th0; });
        const first = thr.findIndex((x) => isFinite(x));
        const absEnd = first <= 0 ? 0 : Ds[first - 1];
        const Aslider = v.slider('second pulse (× resting threshold)', 0.3, 12, 3, { step: 0.05, log: true, fmt: (x) => `${v.fix(x, 2)}×` });
        const sA = v.stage({ x: [0, 45], y: [-90, 60], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', height: 270, weight: 1.2, minWidth: 300 });
        const sB = v.stage({ x: [0, 41], y: [0.4, 14], ylog: true, axes: 'box', gutter: true, xlabel: 'Δ: interval between pulses (ms)', ylabel: 'threshold ÷ resting threshold', height: 270, weight: 1.1, minWidth: 300 });
        const sC = v.stage({ x: [0, 45], y: [0, 1], axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'gates', height: 270, weight: 0.9, minWidth: 260 });
        const one = hhSim(pulse(t0, D1, amp1), { tEnd: 45, dt: 0.04, every: 2 });
        const h = sB.handle(10, 3, { color: 'gold', r: 8, constrain: (x, y) => [clamp(x, 1, 40), clamp(y, 0.3 * 1, CAP)] });
        v.render(() => {
          const D = Math.round(clamp(h.x, 1, 40) * 2) / 2, amp = clamp(h.y, 0.4, CAP);
          const o = hhSim(second(D, amp * th0), { tEnd: 45, dt: 0.04, every: 2 }), n2 = spikeTimes(o.t, o.V, 0).length;
          h.set(D, amp);
          trace(sA, one.t, one.V, { color: 'faint', width: 1.2, dash: [4, 3] });
          trace(sA, o.t, o.V, { color: 'accent', width: 2.4 });
          sA.rect(t0, -90, t0 + D1, -80, { fill: 'gold', fillAlpha: 0.6, stroke: false });
          sA.rect(t0 + D, -90, t0 + D + D1, -90 + Math.min(10, 4 + amp * 1.0), { fill: n2 >= 2 ? 'green' : 'red', fillAlpha: 0.6, stroke: false });
          // threshold curve
          if (absEnd > 0) sB.rect(0, 0.4, absEnd + 0.5, 14, { fill: 'red', fillAlpha: 0.1, hatch: 'red', stroke: false });
          sB.hline(1, { color: 'muted', dash: [4, 4] });
          sB.path(Ds.map((x, k) => (isFinite(thr[k]) ? [x, thr[k]] : null)), { color: 'purple', width: 2.6 });
          sB.text('absolute', Math.max(0.5, absEnd / 2), 6, { size: 11, color: 'red', align: 'center' });
          sB.text('relative', Math.min(36, absEnd + 8), 8.5, { size: 11, color: 'purple', align: 'left' });
          sB.dot(D, amp, { r: 6.5, color: n2 >= 2 ? 'green' : 'red' });
          trace(sC, one.t, one.h, { color: GC.h, width: 2.2 }); trace(sC, one.t, one.n, { color: GC.n, width: 2.2 });
          sC.vline(t0 + D, { color: 'gold', width: 1.5 });
          sC.hline(gateInf('h', -65), { color: GC.h, dash: [3, 4], width: 1 }); sC.hline(gateInf('n', -65), { color: GC.n, dash: [3, 4], width: 1 });
          h._n2 = n2;
        });
        v.legend([['accent', '$V(t)$'], ['faint', 'response to the first pulse alone', { dash: true }], [GC.h, '$h$'], [GC.n, '$n$']]);
        v.readout(() => {
          const D = Math.round(clamp(h.x, 1, 40) * 2) / 2, k = Math.min(Ds.length - 1, Math.max(0, Math.round(D) - 1)), idx = Math.round((t0 + D) / (one.t[1] - one.t[0]));
          return String.raw`resting threshold of a 1 ms pulse: $\theta_0 = ${v.fix(th0, 2)}$ µA/cm² (first pulse $2\theta_0$) · second pulse $${v.fix(h.y, 2)}\,\theta_0$ at $\Delta = ${D}$ ms: ${h._n2 >= 2 ? 'second spike' : 'no second spike'}` + '\n' +
            String.raw`minimum second amplitude at $\Delta=${Ds[k]}$ ms: ${isFinite(thr[k]) ? v.fix(thr[k], 2) + String.raw`$\,\theta_0$` : 'none up to ' + CAP + String.raw`$\,\theta_0$ (absolute refractory)`} · absolute refractory period $\approx ${absEnd}$ to $${Ds[first] ?? '—'}$ ms · at the second pulse $h = ${v.fix(one.h[Math.min(one.h.length - 1, idx)], 2)}$, $n = ${v.fix(one.n[Math.min(one.n.length - 1, idx)], 2)}$ (rest ${v.fix(gateInf('h', -65), 2)}, ${v.fix(gateInf('n', -65), 2)}) · lowest threshold ${v.fix(Math.min(...thr.filter(isFinite)), 2)}$\theta_0$`;
        });
      },
    },
  ],
};
