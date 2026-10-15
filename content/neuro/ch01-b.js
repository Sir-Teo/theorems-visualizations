// Computational Neuroscience — Chapter 1: The neuron as an electrical circuit (part b: 1.5–1.7)
import { ION_COL, HH, gateRates, gateInf, gateTau, clamp, idxAt, trace } from './ch01.shared.js';

// ---------- helpers for this file ----------
/**
 * Voltage clamp of a Hodgkin–Huxley membrane (per cm²): an amplifier of gain A drives current through an electrode of
 * conductance Gs, I = Gs·(A(Vc − V) − V). V is advanced exactly for frozen conductances (stable at any gain), the gates by
 * Rush–Larsen steps. drug: 'all' | 'ttx' (no Na⁺) | 'tea' (no K⁺).
 */
function clampRun(Vcmd, drug, A, o = {}) {
  const Gs = o.Gs ?? 2, dt = o.dt ?? 0.002, tEnd = o.tEnd ?? 10, t0 = 1, t1 = 8, Vh = -65;
  const cmd = (t) => (t >= t0 && t < t1 ? Vcmd : Vh);
  let V = Vh, m = gateInf('m', V), h = gateInf('h', V), n = gateInf('n', V);
  const out = { t: [], V: [], Vc: [], I: [], INa: [], IK: [], every: 5 };
  const N = Math.round(tEnd / dt);
  let capPeak = 0;
  for (let k = 0; k <= N; k++) {
    const t = k * dt, vc = cmd(t);
    const gNa = drug === 'ttx' ? 0 : HH.gNa * m ** 3 * h, gK = drug === 'tea' ? 0 : HH.gK * n ** 4, gL = HH.gL;
    const iNa = gNa * (V - HH.ENa), iK = gK * (V - HH.EK), Ic = Gs * (A * (vc - V) - V);
    if (Math.abs(t - t0) < 0.02 || Math.abs(t - t1) < 0.02) capPeak = Math.max(capPeak, Math.abs(Ic - iNa - iK - gL * (V - HH.EL)));
    if (k % out.every === 0) { out.t.push(t); out.V.push(V); out.Vc.push(vc); out.I.push(Ic); out.INa.push(iNa); out.IK.push(iK); }
    if (k === N) break;
    // gates (Rush–Larsen at the current V)
    for (const g of ['m', 'h', 'n']) {
      const [a, b] = gateRates(g, V), inf = a / (a + b), e = Math.exp(-(a + b) * dt);
      if (g === 'm') m = inf + (m - inf) * e; else if (g === 'h') h = inf + (h - inf) * e; else n = inf + (n - inf) * e;
    }
    // voltage: exact relaxation for the frozen conductances during this step
    const vcn = cmd(t + dt), G = Gs * (1 + A) + gNa + gK + gL, Vinf = (Gs * A * vcn + gNa * HH.ENa + gK * HH.EK + gL * HH.EL) / G;
    V = Vinf + (V - Vinf) * Math.exp((-dt * G) / HH.C);
  }
  out.capPeak = capPeak;
  return out;
}

export default {
  collection: 'neuro',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5',
      kind: 'Method',
      name: 'Voltage clamp',
      statement: String.raw`In a **voltage clamp** a feedback amplifier measures the membrane potential, compares it with a command voltage $V_c$ and injects whatever current $I$ is needed to hold $V = V_c$. Once the capacitive transient is over the membrane potential is constant, so $C\,dV/dt = 0$ and the injected current equals the total ionic current, $I = I_{\text{ion}}(V_c, t)$. Stepping $V_c$ therefore reveals how the ionic conductances change with voltage and time. Blocking channels pharmacologically, or replacing ions, separates the components: tetrodotoxin (TTX) blocks Na⁺ channels and tetraethylammonium (TEA) blocks K⁺ channels. In a depolarized squid axon the clamp current is first inward (Na⁺) and then outward (K⁺). For an amplifier of finite gain $A$, the clamp error and settling time both shrink by the factor $1 + A$.`,
      idea: String.raw`This is negative feedback used as a measuring instrument (ctrl-1.8, circ-8.3). The ionic current acts as a disturbance that the loop rejects, so the residual voltage error is the open-loop error divided by $1 + A$, and the loop also charges the capacitance $1 + A$ times faster. Holding $V$ fixed removes the regenerative coupling between voltage and conductance that produces the action potential, and leaves currents that are functions of $V$ and $t$ alone. Cole (1949), Marmont, and Hodgkin, Huxley and Katz used the technique on squid axons to show that the Na⁺ conductance turns on fast and then inactivates, while the K⁺ conductance turns on slowly and persists. Those records became the gating equations of neuro-2.1–2.3 and the Hodgkin–Huxley model (neuro-2.10).`,
      caption: String.raw`The schematic is drawn and solved by the circuit kit at each instant. The amplifier compares $V_m$ with the command $V_c$ and drives current through the electrode, and the ionic current of the Hodgkin–Huxley membrane appears as a current source. Below: a step from $-65$ mV to the command and back. The recorded clamp current shows a brief capacitive spike, the inward Na⁺ current (orange) and then the outward K⁺ current (purple). Apply TTX or TEA to separate them. Now lower the amplifier gain toward 1: the clamp can no longer hold the voltage, the Na⁺ current runs away and the axon fires, which is the instability the clamp exists to prevent.`,
      scope: String.raw`An ideal space clamp of a uniform patch (axial wire in the squid axon); real clamps also contend with series resistance, amplifier bandwidth and poorly clamped dendrites (space-clamp errors).`,
      deps: ['neuro-1.4', 'ctrl-1.8'],
      see: ['circ-8.2', 'circ-8.3', 'ctrl-1.4', 'neuro-2.1', 'neuro-2.2', 'neuro-2.10'],
      refs: ['Dayan–Abbott ch. 5'],
      tags: ['voltage clamp', 'feedback'],
      credit: 'K. S. Cole and G. Marmont, 1947–1949; A. L. Hodgkin, A. F. Huxley and B. Katz, 1952',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Voltage_clamp' },
      viz(v) {
        const Vc = v.slider('command step $V_c$', -100, 60, 0, { step: 1, fmt: (x) => `${x} mV` });
        const drug = v.select('channels', [{ value: 'all', label: 'control' }, { value: 'ttx', label: 'TTX: Na⁺ blocked' }, { value: 'tea', label: 'TEA: K⁺ blocked' }], 'all');
        const Ag = v.slider('amplifier gain $A$', 1, 10000, 1000, { log: true, fmt: (x) => v.fix(x, 0) });
        const sc = v.stage({ x: [-2.3, 11.4], y: [-0.9, 4.6], equal: true, axes: false, height: 250, weight: 1.05 });
        const sv = v.stage({ x: [0, 10], y: [-110, 70], height: 250, axes: 'box', xlabel: 't (ms)', ylabel: 'V (mV)', weight: 1 });
        const si = v.stage({ x: [0, 10], y: [-1500, 2200], height: 230, axes: 'box', xlabel: 't (ms)', ylabel: 'clamp current (µA/cm²)', full: true });
        // kit units: 1 "V" = 1 mV, 1 "Ω" = 1 kΩ·cm², 1 "A" = 1 µA/cm²
        const C = v.circuit(sc, [
          { type: 'V', id: 'Vc', value: -65, at: [0, 2, 0, 0], label: '' },
          { type: 'W', at: [0, 2, 1.5, 2] },
          { type: 'OA', id: 'Amp', at: [3, 2.5], gain: 1000, label: 'amplifier' },
          { type: 'R', id: 'Rs', value: 0.5, at: [4.5, 2.5, 7, 2.5], label: 'electrode' },
          { type: 'C', id: 'Cm', value: 1, at: [7, 2.5, 7, 0], label: 'membrane' },
          { type: 'W', at: [7, 2.5, 9.9, 2.5] },
          { type: 'I', id: 'Iion', value: 0, at: [9.9, 2.5, 9.9, 0], label: '' },
          { type: 'W', at: [9.9, 0, 0, 0] }, { type: 'GND', at: [4, 0] },
          { type: 'W', at: [7, 2.5, 7, 3.9, 1.1, 3.9, 1.1, 3.0, 1.5, 3.0] },
        ]);
        let key = '', R = null;
        const get = () => { const k = `${Vc.value}|${drug.value}|${Ag.value}`; if (k !== key) { key = k; R = clampRun(Vc.value, drug.value, Ag.value); } return R; };
        let cur = 0;
        v.animate((t) => {
          const R = get(), tc = Math.min(10, ((t % 7) / 6) * 10), i = idxAt(R.t, tc); cur = i;
          const Iion = R.I[i] - (R.I[i] - R.INa[i] - R.IK[i] - HH.gL * (R.V[i] - HH.EL)); // ionic part only (no capacitive)
          C.set('Vc', R.Vc[i]); C.part('Amp').gain = Ag.value; C.set('Iion', Iion);
          C.part('Vc').label = `${R.Vc[i]} mV`;
          const res = C.draw({ result: C.dc(), t, vmax: 100, imax: 1500 });
          const nm = C.net.termNode.get('Cm').a;
          sc.tex('V_m', 7.25, 3.25, { size: 14, color: 'ink', align: 'left' });
          sc.text(`${v.fix(res.V(nm), 1)} mV`, 8.1, 3.25, { size: 11, color: 'ink', align: 'left', baseline: 'middle', weight: 600 });
          sc.text(`ionic current ${v.fix(Iion, 0)} µA/cm² (${Iion < 0 ? 'inward' : 'outward'})`, 3.5, 0.55, { size: 11, color: Iion < 0 ? ION_COL.Na : ION_COL.K, align: 'center', baseline: 'middle', weight: 700 });
          // traces
          sv.hline(-65, { color: 'faint', width: 1 });
          trace(sv, R.t, R.Vc, { color: 'ink', dash: [5, 4], width: 1.4 });
          trace(sv, R.t, R.V, { color: 'accent', width: 1.2, alpha: 0.3 });
          trace(sv, R.t.slice(0, i + 1), R.V.slice(0, i + 1), { color: 'accent', width: 2.4 });
          sv.vline(tc, { color: 'gold', width: 1 });
          let lo = -200, hi = 200; for (let j = 0; j < R.t.length; j++) if (Math.abs(R.t[j] - 1) > 0.05 && Math.abs(R.t[j] - 8) > 0.05) { lo = Math.min(lo, R.I[j], R.INa[j]); hi = Math.max(hi, R.I[j], R.IK[j]); }
          const pad = 0.12 * (hi - lo); si.setView([0, 10], [lo - pad, hi + pad]);
          si.hline(0, { color: 'faint', width: 1 });
          si.clip(() => {
            trace(si, R.t, R.INa, { color: ION_COL.Na, dash: [5, 3], width: 1.6 });
            trace(si, R.t, R.IK, { color: ION_COL.K, dash: [5, 3], width: 1.6 });
            trace(si, R.t, R.I, { color: 'ink', width: 1.2, alpha: 0.3 });
            trace(si, R.t.slice(0, i + 1), R.I.slice(0, i + 1), { color: 'ink', width: 2.2 });
          });
          si.vline(tc, { color: 'gold', width: 1 });
          si.text('← capacitive spike (clipped)', 1.1, hi * 0.8, { size: 10, color: 'muted', align: 'left', baseline: 'middle' });
        }, { period: 7, still: 1.25 });
        v.legend([['accent', '$V_m$'], ['ink', 'command $V_c$ / clamp current'], [ION_COL.Na, '$I_{Na}$', { dash: true }], [ION_COL.K, '$I_K$', { dash: true }]]);
        v.readout(() => {
          const R = get(), A = Ag.value;
          let peakIn = 0, tIn = 0, err = 0; const j1 = idxAt(R.t, 1.2), j2 = idxAt(R.t, 7.95);
          for (let j = j1; j <= j2; j++) { if (R.I[j] < peakIn) { peakIn = R.I[j]; tIn = R.t[j]; } err = Math.max(err, Math.abs(R.V[j] - R.Vc[j])); }
          const steady = R.I[j2], tauC = HH.C / (2 * (1 + A));
          return `${peakIn < -1 ? `peak inward ${v.fix(peakIn, 0)} µA/cm² at ${v.fix(tIn - 1, 2)} ms after the step` : 'no inward current'} · late outward ${v.fix(steady, 0)} µA/cm² · worst clamp error during the step ${v.fix(err, 2)} mV ${err > 5 ? '(**clamp lost**)' : ''} · charging time constant $C/(G_s(1+A)) = ${v.fix(tauC * 1000, 2)}$ µs, capacitive spike ${v.fix(R.capPeak, 0)} µA/cm²`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6',
      kind: 'Concept',
      name: 'Ion channels as stochastic gates',
      statement: String.raw`A single ion channel is either closed or open, and it switches between the two at random. In the simplest model, a two-state Markov chain C ⇄ O with opening rate $\alpha$ and closing rate $\beta$, the dwell times in each state are exponential with means $1/\alpha$ and $1/\beta$, and the current through one channel is a random telegraph signal of unitary amplitude $i = \gamma(V - E)$. The expected open probability obeys
$$\frac{dp}{dt} = \alpha(1-p) - \beta p,$$
so the average of $N$ independent channels follows the deterministic relaxation to $p_\infty = \alpha/(\alpha+\beta)$ with time constant $1/(\alpha+\beta)$. The fluctuations around it have standard deviation $\sqrt{p(1-p)/N}$, shrinking as $1/\sqrt N$. Macroscopic currents are smooth because they sum thousands of noisy channels.`,
      idea: String.raw`Each channel is a two-state continuous-time Markov chain (stoch-1.4, stoch-10.2). Its open probability satisfies the forward equation, which is the rate equation above, and channels are independent. The fraction open is therefore a binomial average whose mean obeys the deterministic ODE and whose variance is $p(1-p)/N$ (law of large numbers, central limit theorem). Neher and Sakmann's patch clamp (1976) made single channels visible as rectangular current steps of a few picoamperes. Averaging hundreds of identical sweeps rebuilt the smooth macroscopic currents seen with the voltage clamp (neuro-1.5). With few channels, as in small axons, this noise makes spike timing stochastic (neuro-2.9).`,
      caption: String.raw`At $t = 5$ ms a voltage step changes the rates from mostly-closed to the values set by the sliders. Top: eight individual channels, each a random telegraph signal (1 pA when open). Bottom left: the average of $N$ simulated channels (gold) against the ODE solution $p(t)$ (blue). Raise $N$ and the average sticks ever closer to the deterministic curve. Bottom right: the measured standard deviation of the average at steady state (over a 200 ms record) for $N = 1 \dots 1000$ on log–log axes, against $\sqrt{p_\infty(1-p_\infty)/N}$, a line of slope $-\tfrac12$. Press *New run* for fresh randomness.`,
      scope: String.raw`Independent, identical channels with two states; real channels have several closed and inactivated states (neuro-2.2), giving multi-exponential dwell times.`,
      deps: ['neuro-1.4'],
      see: ['stoch-1.4', 'stoch-10.2', 'stoch-9.1', 'thermo-6.9', 'neuro-2.9'],
      refs: ['Gerstner §2.2', 'Neher & Sakmann, Nature 260 (1976)'],
      tags: ['ion channels', 'noise'],
      credit: 'Erwin Neher and Bert Sakmann, 1976 (single-channel recording; Nobel 1991)',
      viz(v) {
        const Ns = v.slider('channels averaged $N$', 1, 1000, 25, { log: true, fmt: (x) => `${Math.round(x)}` });
        const As = v.slider('opening rate $\\alpha$ after the step', 0.05, 2, 0.4, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 2)} ms⁻¹` });
        const Bs = v.slider('closing rate $\\beta$ after the step', 0.05, 2, 0.2, { log: true, sig: 2, fmt: (x) => `${v.fix(x, 2)} ms⁻¹` });
        let seed = 1;
        v.button('New run', () => { seed++; });
        const st = v.stage({ x: [0, 40], y: [-1.2, 8.2], height: 230, axes: 'box', xlabel: 't (ms)', ylabel: 'single channels', full: true, yticks: [] });
        const sa = v.stage({ x: [0, 40], y: [-0.05, 1.05], height: 260, axes: 'box', xlabel: 't (ms)', ylabel: 'fraction open', weight: 1.25 });
        const sn = v.stage({ x: [0.7, 1500], y: [0.005, 1], xlog: true, ylog: true, height: 260, axes: 'box', xlabel: 'N', ylabel: 'SD of the average', weight: 1 });
        const NMAX = 1000, DT = 0.05, TS = 5, TE = 40, TSIM = 200, A0 = 0.01, B0 = 1;
        let key = '', S = null;
        const sim = () => {
          const a = As.value, b = Bs.value, r = v.rng(100 + seed), nT = Math.round(TSIM / DT) + 1, nShow = Math.round(TE / DT) + 1;
          const states = new Uint8Array(NMAX * nT), p0 = A0 / (A0 + B0);
          const po0 = 1 - Math.exp(-A0 * DT), pc0 = 1 - Math.exp(-B0 * DT), po1 = 1 - Math.exp(-a * DT), pc1 = 1 - Math.exp(-b * DT);
          for (let c = 0; c < NMAX; c++) {
            let s = r() < p0 ? 1 : 0;
            for (let k = 0; k < nT; k++) {
              states[c * nT + k] = s;
              const after = k * DT >= TS, po = after ? po1 : po0, pc = after ? pc1 : pc0;
              s = s ? (r() < pc ? 0 : 1) : (r() < po ? 1 : 0);
            }
          }
          const pinf = a / (a + b), tau = 1 / (a + b), from = Math.round((TS + 5 * tau) / DT);
          const prefix = new Float64Array(nT), sds = [];
          const Ns = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
          let done = 0;
          for (const N of Ns) {
            for (let c = done; c < N; c++) for (let k = 0; k < nT; k++) prefix[k] += states[c * nT + k];
            done = N;
            let ss = 0, cnt = 0; for (let k = from; k < nT; k++) { const d = prefix[k] / N - pinf; ss += d * d; cnt++; }
            sds.push([N, Math.sqrt(ss / cnt)]);
          }
          return { states, nT, nShow, pinf, tau, p0, sds, a, b, from };
        };
        const get = () => { const k = `${As.value}|${Bs.value}|${seed}`; if (k !== key) { key = k; S = sim(); } return S; };
        v.render(() => {
          const R = get(), N = Math.round(Ns.value), ts = Array.from({ length: R.nShow }, (_, k) => k * DT);
          // single-channel records
          for (let c = 0; c < 8; c++) {
            const y0 = 7 - c, pts = [];
            for (let k = 0; k < R.nShow; k++) { const s = R.states[c * R.nT + k]; if (k > 0 && s !== R.states[c * R.nT + k - 1]) pts.push([k * DT, y0 + 0.7 * R.states[c * R.nT + k - 1]]); pts.push([k * DT, y0 + 0.7 * s]); }
            st.hline(y0, { color: 'grid', width: 1 });
            st.path(pts, { color: c < Math.min(8, N) ? ION_COL.K : 'muted', width: 1.3 });
          }
          st.vline(TS, { color: 'red', dash: [3, 3] });
          st.text('voltage step', TS + 0.4, 8.1, { size: 10, color: 'red', align: 'left', baseline: 'top' });
          st.text('open (1 pA)', 39.8, 7.7, { size: 9.5, color: 'muted', align: 'right', baseline: 'middle' });
          st.text('closed', 39.8, 7.0, { size: 9.5, color: 'muted', align: 'right', baseline: 'middle', dy: -6 });
          // ensemble average
          const avg = new Float64Array(R.nShow); for (let c = 0; c < N; c++) for (let k = 0; k < R.nShow; k++) avg[k] += R.states[c * R.nT + k];
          sa.vline(TS, { color: 'red', dash: [3, 3] });
          sa.hline(R.pinf, { color: 'green', dash: [4, 4], width: 1 });
          trace(sa, ts, Array.from(avg, (x) => x / N), { color: 'gold', width: 1.4 });
          sa.fn((t) => (t < TS ? R.p0 : R.pinf + (R.p0 - R.pinf) * Math.exp(-(t - TS) / R.tau)), { color: 'accent', width: 2.4 });
          sa.text(`p∞ = α/(α+β) = ${v.fix(R.pinf, 3)}`, 39.5, 1.03, { size: 10.5, color: 'green', align: 'right', baseline: 'top', weight: 600 });
          // noise vs N
          sn.fn((x) => Math.sqrt((R.pinf * (1 - R.pinf)) / x), { color: 'accent', width: 2 });
          sn.dots(R.sds, { r: 4, color: 'gold' });
          const here = R.sds.reduce((best, p) => (Math.abs(Math.log(p[0] / N)) < Math.abs(Math.log(best[0] / N)) ? p : best));
          sn.vline(N, { color: 'faint', dash: [2, 3] });
          sn.dot(here[0], here[1], { r: 6, color: 'gold', hollow: true });
        });
        v.legend([[ION_COL.K, 'single channels (shown up to N)'], ['gold', 'average of N channels / measured SD'], ['accent', 'two-state ODE / $\\sqrt{p(1-p)/N}$'], ['green', '$p_\\infty$', { dash: true }]]);
        v.readout(() => {
          const R = get(), N = Math.round(Ns.value);
          const avg = new Float64Array(R.nT); for (let c = 0; c < N; c++) for (let k = 0; k < R.nT; k++) avg[k] += R.states[c * R.nT + k];
          let ss = 0, cnt = 0; for (let k = R.from; k < R.nT; k++) { const d = avg[k] / N - R.pinf; ss += d * d; cnt++; }
          let opens = 0, openTime = 0; for (let c = 0; c < 200; c++) for (let k = Math.round(TS / DT) + 1; k < R.nT; k++) { const s = R.states[c * R.nT + k], p = R.states[c * R.nT + k - 1]; if (s && !p) opens++; if (s) openTime += DT; }
          return `$\\tau = 1/(\\alpha+\\beta) = ${v.fix(R.tau, 2)}$ ms, $p_\\infty = ${v.fix(R.pinf, 3)}$ · steady-state SD of the average of ${N}: ${v.fix(Math.sqrt(ss / cnt), 4)} vs $\\sqrt{p_\\infty(1-p_\\infty)/N} = ${v.fix(Math.sqrt((R.pinf * (1 - R.pinf)) / N), 4)}$ · mean open dwell (200 channels) ${v.fix(openTime / Math.max(1, opens), 2)} ms vs $1/\\beta = ${v.fix(1 / R.b, 2)}$ ms`;
        });
      },
    },

    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7',
      kind: 'Model',
      name: 'Gating variables from two-state channel kinetics',
      statement: String.raw`Model each gate of a channel as an independent two-state particle that opens with rate $\alpha_x(V)$ and closes with rate $\beta_x(V)$, both depending on the membrane potential. The fraction $x$ of open gates (the **gating variable**) then obeys first-order kinetics,
$$\frac{dx}{dt} = \alpha_x(V)(1-x) - \beta_x(V)\,x \quad\Longleftrightarrow\quad \tau_x(V)\frac{dx}{dt} = x_\infty(V) - x,$$
with $x_\infty = \alpha_x/(\alpha_x+\beta_x)$ and $\tau_x = 1/(\alpha_x+\beta_x)$. After a voltage step from $V_0$ to $V_1$ the gate relaxes exponentially, $x(t) = x_\infty(V_1) + \big(x_\infty(V_0) - x_\infty(V_1)\big)e^{-t/\tau_x(V_1)}$. A channel needing several gates open (Hodgkin–Huxley's $n^4$ and $m^3h$) has open probability equal to a power or product of gating variables.`,
      idea: String.raw`This is mass-action kinetics (pchem-7.4) for the reaction closed ⇄ open, or equivalently the mean of the two-state Markov chain of neuro-1.6. The voltage dependence comes from charged parts of the protein moving in the membrane field. The ratio $\alpha/\beta$ is a Boltzmann factor $e^{q(V - V_{1/2})/kT}$ (thermo-6.1), which makes $x_\infty(V)$ sigmoidal. Since the relaxation is exponential with a single time constant (ode-1.5), measuring $x_\infty$ and $\tau_x$ at each voltage under voltage clamp (neuro-1.5) determines $\alpha_x(V) = x_\infty/\tau_x$ and $\beta_x(V) = (1-x_\infty)/\tau_x$. Hodgkin and Huxley did exactly this for the gates $n$, $m$ and $h$ (neuro-2.1, neuro-2.2).`,
      caption: String.raw`A population of 2000 gates, each flipping at random with the Hodgkin–Huxley rates of the chosen gate (squid axon, 6.3 °C); 400 of them are shown as tiles (filled = open). At the step, from $V_0$ to $V_1$, the open fraction (gold) relaxes along the exponential predicted by the ODE (blue dashed). Bottom: $x_\infty(V)$ and $\tau_x(V)$ for all three gates, with the chosen one bold and the two voltages marked. Note that $h$ runs the other way: it *closes* on depolarization. Try $m$: it is about ten times faster than the other two gates.`,
      scope: String.raw`Independent gates with first-order kinetics; the Hodgkin–Huxley rate functions are empirical fits for the squid axon at 6.3 °C (rates scale roughly ×3 per 10 °C).`,
      deps: ['neuro-1.6', 'pchem-7.4'],
      see: ['ode-1.5', 'thermo-6.1', 'neuro-2.1', 'neuro-2.2', 'mathbio-5.2'],
      refs: ['Dayan–Abbott ch. 5'],
      tags: ['gating', 'kinetics'],
      credit: 'A. L. Hodgkin and A. F. Huxley, 1952',
      viz(v) {
        const gate = v.select('gate', [{ value: 'n', label: '$n$ (K⁺ activation)' }, { value: 'm', label: '$m$ (Na⁺ activation)' }, { value: 'h', label: '$h$ (Na⁺ inactivation)' }], 'n');
        const V0s = v.slider('holding $V_0$', -100, 20, -65, { step: 1, fmt: (x) => `${x} mV` });
        const V1s = v.slider('step to $V_1$', -100, 40, -20, { step: 1, fmt: (x) => `${x} mV` });
        const sg = v.stage({ x: [0, 20], y: [0, 20], equal: true, axes: false, height: 260, weight: 0.75 });
        const sx = v.stage({ x: [0, 10], y: [-0.03, 1.03], height: 260, axes: 'box', xlabel: 't (ms)', ylabel: 'fraction open', weight: 1.3, minWidth: 430 });
        const si = v.stage({ x: [-100, 40], y: [0, 1.02], height: 190, axes: 'box', xlabel: 'V (mV)', ylabel: 'x∞(V)', weight: 1, minWidth: 300 });
        const sT = v.stage({ x: [-100, 40], y: [0, 10], height: 190, axes: 'box', xlabel: 'V (mV)', ylabel: 'τx(V) (ms)', weight: 1, minWidth: 300 });
        const NG = 2000, NSHOW = 400, NS = 1500, GC = { n: ION_COL.K, m: ION_COL.Na, h: 'teal' };
        let key = '', S = null;
        const sim = () => {
          const g = gate.value, V0 = V0s.value, V1 = V1s.value, t1 = gateTau(g, V1), T = 10 * t1, ts = 0.2 * T, dt = T / NS;
          const [a0, b0] = gateRates(g, V0), [a1, b1] = gateRates(g, V1), r = v.rng(7);
          const st = new Uint8Array(NG * (NS + 1)), frac = new Float64Array(NS + 1);
          const p = (a, b) => [1 - Math.exp(-a * dt), 1 - Math.exp(-b * dt)];
          const [o0, c0] = p(a0, b0), [o1, c1] = p(a1, b1), x0 = a0 / (a0 + b0);
          for (let i = 0; i < NG; i++) {
            let s = r() < x0 ? 1 : 0;
            for (let k = 0; k <= NS; k++) { st[i * (NS + 1) + k] = s; frac[k] += s; const after = k * dt >= ts; s = s ? (r() < (after ? c1 : c0) ? 0 : 1) : (r() < (after ? o1 : o0) ? 1 : 0); }
          }
          for (let k = 0; k <= NS; k++) frac[k] /= NG;
          return { g, V0, V1, T, ts, dt, st, frac, x0, xinf: a1 / (a1 + b1), tau: t1, a1, b1 };
        };
        const get = () => { const k = `${gate.value}|${V0s.value}|${V1s.value}`; if (k !== key) { key = k; S = sim(); } return S; };
        let cur = 0;
        v.animate((t) => {
          const R = get(), tc = Math.min(R.T, ((t % 8) / 6.5) * R.T), k = Math.min(NS, Math.round(tc / R.dt)); cur = k;
          const col = GC[R.g];
          // tiles
          for (let i = 0; i < NSHOW; i++) {
            const x = i % 20, y = Math.floor(i / 20), s = R.st[i * (NS + 1) + k];
            sg.rect(x + 0.1, y + 0.1, x + 0.9, y + 0.9, { fill: s ? col : 'grid', fillAlpha: s ? 0.85 : 1, stroke: false, radius: 2 });
          }
          // relaxation
          sx.setView([0, R.T], [-0.03, 1.03]);
          sx.vline(R.ts, { color: 'red', dash: [3, 3] });
          sx.hline(R.xinf, { color: 'green', dash: [4, 4], width: 1 });
          sx.hline(R.x0, { color: 'faint', dash: [2, 3], width: 1 });
          const ts = Array.from({ length: NS + 1 }, (_, j) => j * R.dt);
          trace(sx, ts, Array.from(R.frac), { color: 'gold', width: 1.2, alpha: 0.3 });
          trace(sx, ts.slice(0, k + 1), Array.from(R.frac.slice(0, k + 1)), { color: 'gold', width: 2 });
          sx.fn((tt) => (tt < R.ts ? R.x0 : R.xinf + (R.x0 - R.xinf) * Math.exp(-(tt - R.ts) / R.tau)), { color: 'accent', width: 2, dash: [6, 4] });
          sx.vline(R.ts + R.tau, { color: 'muted', dash: [2, 3] });
          sx.text('τ', R.ts + R.tau, 0.02, { size: 12, color: 'ink', align: 'left', dx: 4, baseline: 'bottom', weight: 700 });
          sx.text(`x∞(V₁) = ${v.fix(R.xinf, 3)}`, R.T * 0.99, R.xinf, { size: 10.5, color: 'green', align: 'right', baseline: R.xinf > 0.85 ? 'top' : 'bottom', dy: R.xinf > 0.85 ? 3 : -3 });
          sx.vline(tc, { color: 'gold', width: 1 });
          // steady-state and time-constant curves
          let tmax = 1; for (let V = -100; V <= 40; V += 2) tmax = Math.max(tmax, gateTau(R.g, V));
          sT.setView([-100, 40], [0, tmax * 1.12]);
          for (const g of ['n', 'm', 'h']) {
            const bold = g === R.g;
            si.fn((V) => gateInf(g, V), { color: GC[g], width: bold ? 2.6 : 1.2, alpha: bold ? 1 : 0.35 });
            sT.fn((V) => gateTau(g, V), { color: GC[g], width: bold ? 2.6 : 1.2, alpha: bold ? 1 : 0.35 });
          }
          for (const [V, lab] of [[R.V0, 'V₀'], [R.V1, 'V₁']]) {
            si.dot(V, gateInf(R.g, V), { r: 5, color: lab === 'V₁' ? 'gold' : 'muted' });
            sT.dot(V, gateTau(R.g, V), { r: 5, color: lab === 'V₁' ? 'gold' : 'muted' });
            si.text(lab, V, gateInf(R.g, V), { size: 11, color: 'ink', align: 'left', dx: 7, dy: -8, baseline: 'middle', weight: 600 });
          }
        }, { period: 8, still: 7 });
        v.legend([['gold', 'fraction open (2000 gates)'], ['accent', 'ODE: exponential relaxation', { dash: true }], [ION_COL.K, '$n$'], [ION_COL.Na, '$m$'], ['teal', '$h$']]);
        v.readout(() => {
          const R = get();
          // fit τ to the population by least squares on the exponential (golden-section search in log τ)
          let pre = 0, np = 0; for (let k = 0; k * R.dt < R.ts; k++) { pre += R.frac[k]; np++; } pre /= Math.max(1, np);
          const k0 = Math.ceil(R.ts / R.dt), sse = (tau) => { let q = 0; for (let k = k0; k <= NS; k++) { const t = k * R.dt - R.ts, m = R.xinf + (pre - R.xinf) * Math.exp(-t / tau), d = R.frac[k] - m; q += d * d; } return q; };
          let lo = Math.log(R.tau / 5), hi = Math.log(R.tau * 5); const gr = (Math.sqrt(5) - 1) / 2;
          for (let it = 0; it < 60; it++) { const a1 = hi - gr * (hi - lo), b1 = lo + gr * (hi - lo); if (sse(Math.exp(a1)) < sse(Math.exp(b1))) hi = b1; else lo = a1; }
          const fit = Math.abs(pre - R.xinf) > 0.05 ? Math.exp((lo + hi) / 2) : NaN;
          return `at $V_1 = ${R.V1}$ mV: $\\alpha = ${v.fix(R.a1, 3)}$, $\\beta = ${v.fix(R.b1, 3)}$ ms⁻¹ · $x_\\infty = \\alpha/(\\alpha+\\beta) = ${v.fix(R.xinf, 3)}$, $\\tau = 1/(\\alpha+\\beta) = ${v.fix(R.tau, 3)}$ ms · from 2000 simulated gates (400 shown): fitted $\\tau = ${isFinite(fit) ? v.fix(fit, 3) : '—'}$ ms, final fraction ${v.fix(R.frac[NS], 3)}`;
        });
      },
    },
  ],
};
