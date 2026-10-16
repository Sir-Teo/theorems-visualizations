// Human Physiology — Chapter 2: Excitable cells and muscle (part a: 2.1–2.6)
import { clamp, trace, idxAt, at, peaks, HH, hhRun, GDB, gdbRHS, gdbRun, ecRun, HUX, huxF, huxG, huxSolve, hillV, hillF, hillFopt } from './ch02.shared.js';

// ---------- helpers for this file ----------

/** HH threshold: smallest 1 ms pulse (µA/cm²) that makes the spike overshoot 0 mV; null if none up to 60. */
function hhThreshold(Tc, gNaScale, gKScale) {
  const fires = (I) => { const r = hhRun({ tEnd: 12, dt: 0.04, Tc, gNaScale, gKScale, stim: (t) => (t < 1 ? I : 0) }); return Math.max(...r.V) > 0; };
  if (gNaScale === 0 || !fires(60)) return null;
  let lo = 0, hi = 60;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (fires(m)) hi = m; else lo = m; }
  return hi;
}

// Goldbeter–Dupont–Berridge: frequency and amplitude over the whole β range (cached).
let gdbTable = null;
function gdbSummary() {
  if (gdbTable) return gdbTable;
  const out = [];
  for (let k = 0; k <= 40; k++) {
    const beta = 0.2 + k * 0.015, R = gdbRun({ beta, tEnd: 30, dt: 0.005, every: 4 });
    const i0 = idxAt(R.t, 12), Z = R.Z.slice(i0), T = R.t.slice(i0), pk = peaks(Z, 0.5);
    const osc = pk.length >= 3 && Math.max(...Z) - Math.min(...Z) > 0.3;
    const per = osc ? (T[pk[pk.length - 1]] - T[pk[0]]) / (pk.length - 1) : 0;
    out.push({ beta, osc, freq: osc ? 60 / per : 0, per, amp: osc ? Math.max(...Z) : null });
  }
  gdbTable = out; return out;
}

// Sarcomere geometry (µm), frog skeletal muscle (Gordon, Huxley & Julian 1966): thin 1.0, thick 1.6, bare zone 0.16.
const SARC = { thin: 1.0, thick: 1.6, bare: 0.16, dx: 0.04 };
/** Cross-bridge heads of one thick filament with their state at sarcomere length SL: 'on' (one thin filament within reach), 'two' (both: interference), 'free', 'jam' (thick filament pushed through the Z-disc). */
function sarcHeads(SL) {
  const heads = [], half = SARC.thick / 2, nh = Math.round((half - SARC.bare / 2) / SARC.dx);
  for (const side of [-1, 1]) {
    for (let i = 0; i < nh; i++) {
      const x = SL / 2 + side * (SARC.bare / 2 + SARC.dx * (i + 0.5));
      const L = x >= 0 && x <= SARC.thin, R = x <= SL && x >= SL - SARC.thin;
      let st = 'free';
      if (x < 0 || x > SL) st = 'jam'; else if (L && R) st = 'two'; else if (side < 0 ? L : R) st = 'on'; else if (L || R) st = 'free';
      heads.push({ x, side, st });
    }
  }
  return heads;
}
/** Active force (fraction of the plateau): the length of bridge zone reached by exactly one thin filament, with the empirical fall below 1.65 µm. */
function sarcForce(SL) {
  const half = SARC.thick / 2, zone = SARC.thick / 2 - SARC.bare / 2, ov = (A, B) => [Math.max(A[0], B[0]), Math.min(A[1], B[1])], len = (A) => Math.max(0, A[1] - A[0]);
  let on = 0;
  for (const side of [-1, 1]) {
    const Zn = side < 0 ? [SL / 2 - half, SL / 2 - SARC.bare / 2] : [SL / 2 + SARC.bare / 2, SL / 2 + half];
    const own = side < 0 ? [0, SARC.thin] : [SL - SARC.thin, SL], oth = side < 0 ? [SL - SARC.thin, SL] : [0, SARC.thin];
    const o = ov(Zn, own); on += len(o) - len(ov(o, oth));
  }
  return (on / (2 * zone)) * (SL >= 1.6 ? 1 : clamp((SL - 1.27) / 0.33, 0, 1));
}

export default {
  collection: 'physio',
  chapter: 2,
  title: 'Excitable cells and muscle',
  summary: String.raw`Nerve and muscle cells turn changes in membrane permeability into signals. The action potential, the release of intracellular calcium and the molecular motors of the sarcomere link electrical excitation to force. Muscle mechanics obeys the length–tension and Hill force–velocity relations, which Huxley's cross-bridge kinetics explains, and recruitment of motor units follows the size principle. Cardiac cells add a long plateau and built-in pacemaking.`,
  items: [
    // ------------------------------------------------------------------ 2.1
    {
      num: '2.1',
      kind: 'Phenomenon',
      name: 'Action potential: sodium in, potassium out',
      statement: String.raw`A nerve or muscle membrane responds to a depolarizing stimulus in an **all-or-none** way. Below a threshold the voltage simply relaxes back to rest. Above it, the voltage runs away in a stereotyped spike lasting a millisecond or so in a nerve: it rises from about $-65$ mV toward the sodium equilibrium potential $E_{\mathrm{Na}} \approx +50$ mV, overshoots zero, turns around and falls below rest before recovering. The upstroke is carried by a transient rise of the **sodium conductance** $g_{\mathrm{Na}}$ (sodium enters). Repolarization is produced by the slower rise of the **potassium conductance** $g_{\mathrm K}$ (potassium leaves) together with the spontaneous closing of the sodium channels. Blocking sodium channels abolishes the spike, and blocking potassium channels prolongs it.`,
      idea: String.raw`At rest the membrane is mostly permeable to $\mathrm K^+$, so $V$ sits near $E_{\mathrm K}$ (GHK, physio-1.9). Depolarization opens voltage-gated $\mathrm{Na^+}$ channels. The inward current depolarizes further and opens more of them, a regenerative loop that drives $V$ toward $E_{\mathrm{Na}}$. This is why there is a threshold. Two slower processes then end the spike: sodium channels inactivate (the $h$ gate closes) and potassium channels open (the $n$ gate). The picture below is Hodgkin and Huxley's quantitative description (physio-2.11 gives its experimental root), integrated here by RK4: each conductance is a product of voltage- and time-dependent gating variables obeying first-order kinetics.`,
      caption: String.raw`The upper panel is the membrane voltage of a squid giant axon after a 1 ms current pulse, the lower one the two conductances. Raise the **stimulus** through threshold and watch the response jump from a small local bump to a full spike, with no intermediate sizes. The gold lines mark the time at which each conductance peaks: $g_{\mathrm{Na}}$ first, $g_{\mathrm K}$ about 1.5 ms later, as the voltage turns around. Block the sodium channels (**TTX**) or the potassium channels (**TEA**) and see what each current does. Warming the axon speeds up all the gates, so the spike narrows.`,
      scope: String.raw`The Hodgkin–Huxley equations describe the squid giant axon at 6.3 °C and a spatially uniform (space-clamped) membrane, with rates scaled by $Q_{10} = 3$ for other temperatures. Mammalian neurons and muscle cells have other channel types, but the same two-step logic of fast sodium entry followed by potassium exit.`,
      deps: ['physio-1.9'],
      see: ['physio-2.11', 'neuro-2.1'],
      refs: ['Keener–Sneyd ch. 5', 'Guyton–Hall'],
      tags: ['action potential', 'ion channels'],
      credit: 'A. L. Hodgkin and A. F. Huxley, 1952 (the equations); Hodgkin and Katz, 1949 (the sodium hypothesis)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Action_potential' },
      viz(v) {
        const amp = v.slider('stimulus (1 ms pulse)', 0, 30, 15, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} µA/cm²` });
        const drug = v.select('channel block', [{ value: 'none', label: 'none' }, { value: 'ttx', label: 'Na⁺ channels (TTX)' }, { value: 'tea', label: 'K⁺ channels (TEA)' }], 'none');
        const temp = v.slider('temperature', 6.3, 25, 6.3, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} °C` });
        const sv = v.stage({ x: [0, 15], y: [-95, 65], height: 290, axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'V (mV)', weight: 1.2 });
        const sg = v.stage({ x: [0, 15], y: [0, 42], height: 290, axes: 'box', gutter: true, xlabel: 't (ms)', ylabel: 'conductance (mS/cm²)', weight: 1 });
        let key = '', run = null, thrKey = '', thr = null;
        const gate = () => ({ na: drug.value === 'ttx' ? 0 : 1, k: drug.value === 'tea' ? 0 : 1 });
        const get = () => {
          const k = `${amp.value}|${drug.value}|${temp.value}`;
          if (k !== key) { key = k; const g = gate(); run = hhRun({ tEnd: 15, dt: 0.02, Tc: temp.value, gNaScale: g.na, gKScale: g.k, stim: (t) => (t < 1 ? amp.value : 0) }); }
          return run;
        };
        const getThr = () => {
          const k = `${drug.value}|${temp.value}`;
          if (k !== thrKey) { thrKey = k; const g = gate(); thr = hhThreshold(temp.value, g.na, g.k); }
          return thr;
        };
        let tNa = null, tK = null;
        v.render(() => {
          const R = get();
          sv.hline(HH.ENa, { color: 'orange', dash: [5, 4], width: 1.2, alpha: 0.8 });
          sv.hline(HH.EK, { color: 'purple', dash: [5, 4], width: 1.2, alpha: 0.8 });
          sv.hline(HH.Vrest, { color: 'faint', dash: [2, 4], width: 1 });
          sv.text('E_Na = +50 mV', 14.8, HH.ENa, { size: 11, color: 'orange', align: 'right', baseline: 'bottom', dy: -2 });
          sv.text('E_K = −77 mV', 14.8, HH.EK, { size: 11, color: 'purple', align: 'right', baseline: 'top', dy: 3 });
          sv.rect(0, -94, 1, -88, { fill: 'gold', fillAlpha: 0.5, stroke: false });
          sv.text('stimulus', 1.2, -91, { size: 10.5, color: 'muted', align: 'left', baseline: 'middle' });
          const iNa = R.gNa.indexOf(Math.max(...R.gNa)), iK = R.gK.indexOf(Math.max(...R.gK));
          tNa = Math.max(...R.gNa) > 1 ? R.t[iNa] : null; tK = Math.max(...R.gK) > 4 && drug.value !== 'tea' ? R.t[iK] : (drug.value === 'tea' ? null : null);
          if (tNa != null) { sv.vline(tNa, { color: 'gold', width: 1.2, alpha: 0.9 }); sg.vline(tNa, { color: 'gold', width: 1.2, alpha: 0.9 }); }
          if (tK != null) { sv.vline(tK, { color: 'gold', width: 1.2, alpha: 0.9, dash: [4, 3] }); sg.vline(tK, { color: 'gold', width: 1.2, alpha: 0.9, dash: [4, 3] }); }
          trace(sv, R.t, R.V, { color: 'accent', width: 2.4 });
          trace(sg, R.t, R.gNa, { color: 'orange', width: 2.4 });
          trace(sg, R.t, R.gK, { color: 'purple', width: 2.4 });
          sg.text('g_Na', 2.35, 33, { size: 12, color: 'orange', align: 'left', weight: 700 });
          sg.text('g_K', 5.2, 11, { size: 12, color: 'purple', align: 'left', weight: 700 });
        });
        v.legend([['accent', 'membrane voltage'], ['orange', '$g_{\\mathrm{Na}}$'], ['purple', '$g_{\\mathrm K}$'], ['gold', 'time of peak $g_{\\mathrm{Na}}$ (solid), $g_{\\mathrm K}$ (dashed)']]);
        v.readout(() => {
          const R = get(), th = getThr(), pk = Math.max(...R.V), fired = pk > 0;
          const when = (tNa != null ? `$g_{\\mathrm{Na}}$ peaks at ${v.fix(tNa, 2)} ms` : '$g_{\\mathrm{Na}}$ never rises') + (tK != null ? `, $g_{\\mathrm K}$ at ${v.fix(tK, 2)} ms` : (drug.value === 'tea' ? ', $g_{\\mathrm K}$ blocked' : ''));
          return `peak $V = ${v.fix(pk, 1)}$ mV (${fired ? 'a spike' : 'subthreshold'}), minimum $${v.fix(Math.min(...R.V), 1)}$ mV · ${when} · threshold stimulus ${th == null ? 'does not exist (no spike possible)' : `$\\approx ${v.fix(th, 1)}$ µA/cm²`}`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.2
    {
      num: '2.2',
      kind: 'Model',
      name: 'Calcium-induced calcium release and calcium oscillations',
      statement: String.raw`Many cells keep calcium in an internal store (the endoplasmic or sarcoplasmic reticulum) at a concentration thousands of times that of the cytosol. Cytosolic $\mathrm{Ca^{2+}}$ itself opens the release channels of the store, so a small rise triggers a larger one: this is **calcium-induced calcium release** (CICR), a positive feedback. A two-variable model with cytosolic calcium $Z$ and store calcium $Y$,
$$\dot Z = v_0 + v_1\beta - v_2(Z) + v_3(Z,Y) + k_f Y - kZ,\qquad \dot Y = v_2(Z) - v_3(Z,Y) - k_f Y,$$
with uptake $v_2 \propto Z^2/(K_2^2+Z^2)$ and release $v_3 \propto \frac{Y^2}{K_R^2+Y^2}\frac{Z^4}{K_A^4+Z^4}$, has for intermediate agonist levels $\beta$ no stable rest state: $Z$ spikes periodically. The **frequency** of the spikes rises steeply with $\beta$, while their **amplitude** stays roughly constant, so the cell encodes the dose of agonist as a frequency.`,
      idea: String.raw`CICR supplies the fast positive feedback, the term $Z^4/(K_A^4+Z^4)$, and so makes the cytosol excitable like the sodium channel of 2.1. Recovery comes from the store running down: after a spike the store is depleted (small $Y$, small release), uptake by the pump $v_2$ refills it, and the next spike can fire. A steady influx $v_0 + v_1\beta$ sets how fast the store refills, which is why the period shrinks as $\beta$ grows. This is a relaxation oscillator (a limit cycle of a planar system, mathbio-6.6): a fast variable with a sigmoidal nullcline and a slow variable that resets it. Too little stimulation leaves the system on a low, stable fixed point. Too much gives a high one at which the store is permanently half empty.`,
      caption: String.raw`**Top**: cytosolic calcium for the chosen stimulus $\beta$. **Left below**: the same trajectory in the $(Z, Y)$ plane with the nullclines $\dot Z = 0$ (orange) and $\dot Y = 0$ (purple). A limit cycle appears when their crossing point is unstable, and the trajectory then circles it. **Right**: frequency and peak height of the oscillation for every $\beta$ (the gold dot is your setting). Sweep $\beta$ from 0.3 to 0.7: the frequency rises several-fold while the peaks barely change. Switch **CICR feedback** off and the oscillations vanish.`,
      scope: String.raw`A deterministic lumped model of one cell (Goldbeter, Dupont & Berridge 1990). Real calcium signals are also spatial: waves, sparks and puffs from clusters of channels, which need a reaction–diffusion description.`,
      deps: ['physio-2.1', 'mathbio-6.6'],
      see: ['physio-2.3', 'mathbio-6.6'],
      refs: ['Keener–Sneyd ch. 7'],
      tags: ['calcium', 'oscillations'],
      credit: 'A. Goldbeter, G. Dupont and M. J. Berridge, 1990 (model); A. Fabiato, 1983 (calcium-induced calcium release)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Calcium-induced_calcium_release' },
      viz(v) {
        const beta = v.slider('agonist level $\\beta$', 0, 1, 0.5, { step: 0.01 });
        const cicr = v.toggle('CICR feedback (release activated by Ca²⁺)', true);
        const st = v.stage({ x: [0, 15], y: [0, 1.6], height: 220, axes: 'box', gutter: true, xlabel: 't (s)', ylabel: 'cytosolic Ca²⁺ (µM)', full: true });
        const sp = v.stage({ x: [0, 1.6], y: [0.3, 2.6], height: 290, axes: 'box', gutter: true, xlabel: 'cytosolic Ca²⁺  Z (µM)', ylabel: 'store Ca²⁺  Y (µM)', weight: 1.1 });
        const sf = v.stage({ x: [0, 1], y: [0, 170], height: 140, axes: 'box', gutter: true, ylabel: 'spikes / min', weight: 1, minWidth: 220 });
        const sa = v.stage({ x: [0, 1], y: [0, 1.6], height: 140, axes: 'box', gutter: true, xlabel: 'agonist level β', ylabel: 'peak Ca²⁺ (µM)', weight: 1, minWidth: 220 });
        let key = '', R = null;
        const P = () => (cicr.value ? GDB : { ...GDB, VM3: 0 });
        const get = () => { const k = `${beta.value}|${cicr.value}`; if (k !== key) { key = k; R = gdbRun({ beta: beta.value, tEnd: 30, dt: 0.004, every: 5, P: P() }); } return R; };
        v.render(() => {
          const r = get(), p = P();
          st.hband(0.1, 0.1, { color: 'faint' });
          trace(st, r.t, r.Z, { color: 'accent', width: 2.2 });
          // phase plane
          sp.setView([0, 1.6], [0.3, cicr.value ? 2.6 : Math.max(2.6, 1.08 * Math.max(...r.Y))]);
          sp.contour((Z, Y) => gdbRHS(Z, Y, beta.value, p).dZ, [0], { color: 'orange', width: 2, res: 160 });
          sp.contour((Z, Y) => gdbRHS(Z, Y, beta.value, p).dY, [0], { color: 'purple', width: 2, res: 160 });
          trace(sp, r.Z, r.Y, { color: 'accent', width: 1, alpha: 0.35 });
          const j = idxAt(r.t, 12);
          trace(sp, r.Z.slice(j), r.Y.slice(j), { color: 'accent', width: 2.2 });
          sp.dot(r.Z[r.Z.length - 1], r.Y[r.Y.length - 1], { r: 5, color: 'gold' });
          sp.text('$\\dot Z = 0$', 1.58, 2.5, { size: 12, color: 'orange', align: 'right' });
          sp.text('$\\dot Y = 0$', 1.58, 0.45, { size: 12, color: 'purple', align: 'right' });
          // summary
          const T = gdbSummary();
          sf.vline(beta.value, { color: 'gold', width: 1.2 }); sa.vline(beta.value, { color: 'gold', width: 1.2 });
          const osc = T.filter((q) => q.osc);
          sf.path(osc.map((q) => [q.beta, q.freq]), { color: 'green', width: 2 });
          sa.path(osc.map((q) => [q.beta, q.amp]), { color: 'green', width: 2 });
          sa.text('steady outside', 0.82, 0.25, { size: 10.5, color: 'muted', align: 'left', baseline: 'bottom' });
          const cur = osc.length ? osc.reduce((a, q) => (Math.abs(q.beta - beta.value) < Math.abs(a.beta - beta.value) ? q : a)) : null;
          if (cicr.value && cur && Math.abs(cur.beta - beta.value) < 0.016) { sf.dot(cur.beta, cur.freq, { r: 5, color: 'gold' }); sa.dot(cur.beta, cur.amp, { r: 5, color: 'gold' }); }
        });
        v.legend([['accent', 'cytosolic $\\mathrm{Ca^{2+}}$ (transient faint)'], ['orange', 'nullcline $\\dot Z = 0$'], ['purple', 'nullcline $\\dot Y = 0$'], ['green', 'oscillating regime']]);
        v.readout(() => {
          const r = get(), i0 = idxAt(r.t, 12), Z = r.Z.slice(i0), pk = peaks(Z, 0.5), tt = r.t.slice(i0);
          if (pk.length < 3 || Math.max(...Z) - Math.min(...Z) < 0.3) return `$\\beta = ${v.fix(beta.value, 2)}$: **steady state**, $Z = ${v.fix(Z[Z.length - 1], 2)}$ µM, no oscillation${cicr.value ? '' : ' (no feedback, no spikes)'}`;
          const per = (tt[pk[pk.length - 1]] - tt[pk[0]]) / (pk.length - 1);
          return `$\\beta = ${v.fix(beta.value, 2)}$: **oscillating**, period $${v.fix(per, 2)}$ s (${v.fix(60 / per, 0)} spikes/min), peak $${v.fix(Math.max(...Z), 2)}$ µM, trough $${v.fix(Math.min(...Z), 2)}$ µM`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.3
    {
      num: '2.3',
      kind: 'Concept',
      name: 'Excitation–contraction coupling',
      statement: String.raw`In skeletal muscle an action potential on the surface membrane (sarcolemma) is carried deep into the fibre by the **transverse tubules**. There the voltage-sensing dihydropyridine receptors (DHPR) are mechanically coupled to the calcium-release channels (ryanodine receptors, RyR) of the neighbouring sarcoplasmic reticulum (SR). The depolarization opens the RyRs and calcium floods the cytosol, rising from about $0.1\ \mu$M to some 10 $\mu$M. Calcium binds troponin C on the thin filaments, which moves tropomyosin off the myosin-binding sites, and cross-bridges form: force rises. Calcium is then pumped back into the SR by SERCA, troponin lets go, and the muscle relaxes. The chain is voltage $\to$ calcium $\to$ troponin $\to$ force, and each link delays the next.`,
      idea: String.raw`The electrical event is over in about 2 ms, but muscle force lasts tens of milliseconds, because each step is a first-order process with its own time constant: calcium release is fast and uptake slower, troponin binding is steep (cooperative, a Hill function of calcium, as in 2.2), and force lags troponin occupancy. The chain thus acts as a cascade of low-pass filters, which is also why a second action potential arriving before relaxation adds to the force (2.7). In cardiac muscle the DHPR is an L-type calcium channel, and the small calcium current it admits triggers CICR (2.2) instead of coupling mechanically.`,
      caption: String.raw`A single action potential is followed through the coupling chain in slow motion (the animation runs about a hundred times slower than real time: its eight-second loop covers 80 ms; the traces on the right are the same events at their true timing). The sketch on the left shows the tubule lighting up, the SR feet opening, calcium dots rising and the troponin sites turning green. Choose a **fault**: with the voltage sensor or the release channel blocked, the spike is normal but there is no calcium, hence no force; with troponin unable to bind calcium, calcium rises normally but the force is still zero.`,
      scope: String.raw`Skeletal-muscle scheme with mechanical DHPR–RyR coupling. The traces are a cascade of first-order stages with round-number time constants (see the item's code comment), chosen for a fast twitch; real timing depends on fibre type and temperature.`,
      deps: ['physio-2.1', 'physio-2.2'],
      see: ['physio-2.7', 'physio-2.4'],
      refs: ['Guyton–Hall'],
      tags: ['muscle', 'calcium', 'coupling'],
      credit: 'A. Sandow, 1952 (coined the term); Schneider & Chandler, 1973 (charge movement from the voltage sensor)',
      viz(v) {
        const fault = v.select('fault', [{ value: 'normal', label: 'none' }, { value: 'sensor', label: 'voltage sensor blocked' }, { value: 'ryr', label: 'release channel blocked' }, { value: 'tnc', label: 'troponin cannot bind Ca²⁺' }], 'normal');
        const sc = v.stage({ x: [0, 12], y: [0, 7], axes: false, height: 330, weight: 1 });
        const sp = v.stage({ x: [0, 80], y: [-0.15, 4.95], height: 330, axes: 'box', gutter: true, xlabel: 't (ms)', weight: 1.1 });
        const cache = {};
        const get = () => (cache[fault.value] ||= ecRun(fault.value));
        const TMAX = 80, rng = v.rng(7);
        const dots = Array.from({ length: 36 }, () => ({ u: rng(), w: rng(), ph: rng() * 6.28 }));
        let T = 0;
        v.animate((t) => {
          const R = get(); T = ((t % 8) / 8) * TMAX;
          const V = at(R.t, R.V, T), s = at(R.t, R.s, T), C = at(R.t, R.C, T), Tn = at(R.t, R.T, T), F = at(R.t, R.F, T);
          const depol = clamp((V + 55) / 80, 0, 1);
          // ---------- sketch
          sc.text('extracellular fluid', 0.2, 6.75, { size: 11, color: 'muted', align: 'left', baseline: 'middle' });
          const tubeX = [3, 9];
          // sarcolemma lit by the local voltage: the spike reaches a point of the surface at the time shown
          for (let x = 0; x < 12; x += 0.25) {
            const delay = 0.6 * Math.abs(x - 6) / 6, Vloc = at(R.t, R.V, Math.max(0, T - delay)), d = clamp((Vloc + 55) / 80, 0, 1);
            sc.rect(x, 6.2, x + 0.25, 6.45, { fill: v.mix('muted', 'orange', d), stroke: false });
          }
          for (const tx of tubeX) {
            const L = 3.6; // tubule depth
            for (let k = 0; k < 14; k++) {
              const y0 = 6.2 - (k * L) / 14, delay = 0.6 + (k * 1.2) / 14, Vloc = at(R.t, R.V, Math.max(0, T - delay)), d = clamp((Vloc + 55) / 80, 0, 1);
              sc.rect(tx - 0.14, y0 - L / 14, tx + 0.14, y0, { fill: v.mix('muted', 'orange', d), stroke: false });
            }
            sc.rect(tx - 0.14, 2.6, tx + 0.14, 6.2, { fill: 'panel', fillAlpha: 0, color: 'ink', width: 1, alpha: 0.5 });
            // SR terminal cisternae either side of the tubule
            for (const sd of [-1, 1]) {
              const x0 = tx + sd * 0.25, x1 = tx + sd * 1.15;
              sc.rect(Math.min(x0, x1), 2.8, Math.max(x0, x1), 4.3, { fill: 'teal', fillAlpha: 0.12 + 0.2 * clamp(C / 9, 0, 1), color: 'teal', width: 1.5, radius: 6 });
              // DHPR on the tubule, RyR foot on the SR
              const open = s > 0.5 && fault.value !== 'ryr';
              sc.dot(tx + sd * 0.14, 3.95, { r: 4.5, color: fault.value === 'sensor' ? 'red' : s > 0.5 ? 'orange' : 'muted' });
              sc.dot(tx + sd * 0.25, 3.2, { r: 4.5, color: fault.value === 'ryr' ? 'red' : open ? 'green' : 'muted', hollow: !open });
            }
          }
          sc.text('T-tubule', 3.3, 5.4, { size: 11, color: 'ink', align: 'left', baseline: 'middle' });
          sc.text('SR', 4.4, 4.45, { size: 11, color: 'teal', align: 'left', baseline: 'bottom', weight: 700 });
          sc.text('DHPR →', 1.75, 3.95, { size: 10, color: 'orange', align: 'right', baseline: 'middle' });
          sc.text('RyR →', 1.75, 3.2, { size: 10, color: 'green', align: 'right', baseline: 'middle' });
          // myofilaments below
          for (let r = 0; r < 4; r++) {
            const y = 0.55 + r * 0.38, cut = r % 2 ? 0.6 : 0;
            sc.line(0.3, y, 11.7, y, { color: r % 2 ? 'ink' : 'accent', width: r % 2 ? 4.5 : 2, alpha: r % 2 ? 0.35 : 0.9 });
            if (!(r % 2)) for (let x = 0.6 + cut; x < 11.5; x += 0.55) sc.dot(x, y + 0.12, { r: 3.2, color: Tn > 0.5 ? 'green' : v.mix('muted', 'green', clamp(Tn * 2, 0, 1)) });
            if (r % 2) for (let x = 0.9; x < 11.4; x += 0.7) sc.line(x, y, x + 0.18 * (0.3 + F), y + 0.34 * (0.4 + 0.6 * F), { color: F > 0.2 ? 'red' : 'faint', width: 1.4 });
          }
          sc.text('thin filaments with troponin', 11.85, 2.0, { size: 10.5, color: 'green', align: 'right', baseline: 'bottom' });
          sc.text(`force ${v.fix(100 * F, 0)} % of max`, 0.3, 0.12, { size: 11, color: 'red', align: 'left', baseline: 'bottom', weight: 600 });
          // calcium dots stream from the SR to the filaments in proportion to [Ca]
          const nD = Math.round(clamp(C / 9, 0, 1) * dots.length);
          const pts = [];
          for (let i = 0; i < nD; i++) { const d = dots[i], sd = d.u < 0.5 ? -1 : 1, tx = tubeX[d.w < 0.5 ? 0 : 1], f = 0.5 + 0.5 * Math.sin(T * 0.4 + d.ph); pts.push([tx + sd * (0.4 + 0.6 * d.u) + 0.6 * f * sd, 2.7 - 1.5 * f]); }
          sc.dots(pts, { r: 2.6, color: 'teal' });
          sc.text(`[Ca²⁺] = ${v.fix(C, 1)} µM`, 11.85, 6.75, { size: 11, color: 'teal', align: 'right', baseline: 'middle', weight: 600 });
          // ---------- staggered traces
          const lanes = [[3.75, 'V', R.V.map((x) => clamp((x + 70) / 100, 0, 1)), 'accent', 'membrane voltage'], [2.5, 'C', R.C.map((x) => clamp(x / 10, 0, 1.1)), 'teal', 'free Ca²⁺ (10 µM = 1)'], [1.25, 'T', R.T, 'green', 'troponin occupancy'], [0, 'F', R.F, 'red', 'force']];
          for (const [off, , ys, col, lab] of lanes) {
            sp.hline(off, { color: 'grid', width: 1 });
            const yy = ys.map((y) => y * 1.05 + off);
            trace(sp, R.t, yy, { color: col, width: 2.2 });
            sp.text(lab, 79, off + 0.8, { size: 10.5, color: col, align: 'right', baseline: 'middle', plate: true });
          }
          sp.vline(T, { color: 'gold', width: 1.4 });
          const frameIdx = idxAt(R.t, T);
          for (const [off, , ys, col] of lanes) sp.dot(T, ys[frameIdx] * 1.05 + off, { r: 4, color: col });
        }, { period: 8, still: 2.5 });
        v.readout(() => {
          const R = get(), mx = (a) => Math.max(...a), tp = (a) => R.t[a.indexOf(mx(a))];
          if (mx(R.F) < 0.02) return `fault: ${fault.value === 'tnc' ? 'calcium rises to $' + v.fix(mx(R.C), 1) + '$ µM at ' + v.fix(tp(R.C), 1) + ' ms but troponin occupancy never exceeds ' + v.fix(100 * mx(R.T), 0) + ' %' : 'no calcium release (peak $' + v.fix(mx(R.C), 2) + '$ µM)'} → **no force** (peak $${v.fix(100 * mx(R.F), 1)}$ % of maximum). Time now $${v.fix(T, 1)}$ ms.`;
          return `spike peak ${v.fix(tp(R.V), 1)} ms → Ca²⁺ peak ${v.fix(tp(R.C), 1)} ms ($${v.fix(mx(R.C), 1)}$ µM) → troponin peak ${v.fix(tp(R.T), 1)} ms (${v.fix(100 * mx(R.T), 0)} % occupied) → force peak ${v.fix(tp(R.F), 1)} ms (${v.fix(100 * mx(R.F), 0)} % of maximum); each link lags the previous one. Time now $${v.fix(T, 1)}$ ms.`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.4
    {
      num: '2.4',
      kind: 'Model',
      name: 'Sliding filaments and the length–tension relation',
      statement: String.raw`Muscle shortens because thin (actin) filaments slide past thick (myosin) filaments, with their lengths unchanged. The active force a sarcomere can develop depends on its length only through the **overlap** of the two filament sets, because each myosin head that can reach a thin filament contributes a roughly equal share. For frog muscle (thin filaments 1.0 μm, thick filament 1.6 μm with a 0.16 μm bare central zone) the isometric force is
- zero beyond a sarcomere length of about $3.6\ \mu$m, where there is no overlap;
- rising linearly as the length is reduced from $3.6$ to about $2.2\ \mu$m, as more heads meet actin;
- flat on a plateau near $2.0$–$2.2\ \mu$m, where every head faces a thin filament;
- falling again below this, because thin filaments from the two halves collide and overlap each other's heads, then because the thick filaments hit the Z-discs.`,
      idea: String.raw`The reasoning is a count of cross-bridges, the sliding-filament hypothesis of Huxley and Niedergerke and of Huxley and Hanson (1954) put into numbers by Gordon, Huxley and Julian (1966), who measured force in single fibre segments held at a fixed sarcomere length. The picture drawn below does the same counting: each head position on one thick filament is tested for whether it lies within reach of one thin filament (green), of two (red, interference), or of none (grey). Plot the length of green bridge zone against sarcomere length and the whole curve appears, straight lines meeting at corners that are set by the four lengths of the filaments. The curve does not depend on how force is produced, only on which heads can take part.`,
      caption: String.raw`Drag the dot on the curve, or the slider, to change the sarcomere length. In the sarcomere drawing (Z-discs at the ends, one thick filament in the middle, thin filaments from either Z-disc) heads are **green** where exactly one thin filament is within reach, **red** where thin filaments from both sides overlap, **grey** where none is. The curve is simply the green fraction of the bridge zone. Stretch the sarcomere beyond $3.6\ \mu$m: no overlap, no force. Shorten it below $2\ \mu$m: the red heads appear.`,
      scope: String.raw`Geometric counting for a skeletal sarcomere with the frog filament lengths. The measured plateau starts nearer $2.0$ than the $1.84\ \mu$m of the bare geometry; below $1.65\ \mu$m the fall is steeper than the counting predicts, and the model adds an empirical linear fall to zero at about $1.27\ \mu$m for the thick filaments crumpling against the Z-discs. Cardiac muscle is shorter, stiffer and operates on the ascending limb.`,
      deps: ['physio-2.3'],
      see: ['physio-2.5', 'physio-3.4'],
      refs: ['Keener–Sneyd ch. 15'],
      tags: ['muscle', 'sarcomere'],
      credit: 'H. E. Huxley & J. Hanson and A. F. Huxley & R. Niedergerke, 1954 (sliding filaments); A. M. Gordon, A. F. Huxley and F. J. Julian, 1966 (the length–tension curve)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sliding_filament_theory' },
      viz(v) {
        const SL = v.slider('sarcomere length', 1.2, 3.9, 2.2, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} µm` });
        const ss = v.stage({ x: [-0.15, 3.95], y: [-1.15, 1.15], height: 215, axes: false, full: true });
        const sc = v.stage({ x: [1, 4], y: [0, 1.25], height: 260, axes: 'box', gutter: true, xlabel: 'sarcomere length (µm)', ylabel: 'active force (fraction of plateau)', full: true, xticks: [1, 1.5, 2, 2.5, 3, 3.5, 4] });
        const h = sc.handle(2.2, 1, { color: 'accent', r: 8, constrain: (x) => { const L = clamp(x, 1.2, 3.9); return [L, sarcForce(L)]; } });
        h.onDrag = () => SL.set(clamp(h.x, 1.2, 3.9));
        const curve = []; for (let L = 1.0; L <= 4.0001; L += 0.01) curve.push([L, sarcForce(L)]);
        v.render(() => {
          const L = SL.value, hs = sarcHeads(L), F = sarcForce(L);
          h.set(L, F);
          ss.setView([-0.2, Math.max(L + 0.2, 2.6)], [-1.15, 1.15]);
          // sarcomere
          ss.rect(-0.02, -1.0, 0.02, 1.0, { fill: 'ink', fillAlpha: 0.7, stroke: false });
          ss.rect(L - 0.02, -1.0, L + 0.02, 1.0, { fill: 'ink', fillAlpha: 0.7, stroke: false });
          ss.text('Z', 0, 1.1, { size: 11, color: 'muted', align: 'center', baseline: 'middle' }); ss.text('Z', L, 1.1, { size: 11, color: 'muted', align: 'center', baseline: 'middle' });
          const rows = [[-0.6, 'L'], [0.2, 'L'], [-0.2, 'R'], [0.6, 'R']];
          for (const [y, sd] of rows) {
            if (sd === 'L') ss.line(0, y, SARC.thin, y, { color: 'accent', width: 3.5 }); else ss.line(L, y, L - SARC.thin, y, { color: 'blue', width: 3.5 });
          }
          const c = L / 2;
          ss.line(c - 0.8, 0, c + 0.8, 0, { color: 'ink', width: 9, alpha: 0.28 });
          ss.line(c - 0.08, 0, c + 0.08, 0, { color: 'ink', width: 9, alpha: 0.55 });
          const col = { on: 'green', two: 'red', free: 'faint', jam: 'orange' };
          hs.forEach((hd, i) => {
            const up = i % 2 ? 1 : -1;
            ss.line(hd.x, 0, hd.x + hd.side * 0.04, up * 0.3, { color: col[hd.st], width: 2.2 });
          });
          ss.text('thick filament (bare zone dark)', c, -0.98, { size: 10.5, color: 'muted', align: 'center', baseline: 'middle' });
          ss.text('thin filaments', 0.5, 0.82, { size: 10.5, color: 'accent', align: 'center', baseline: 'bottom', dy: 10 });
          // curve
          sc.hband(0.98, 1.02, { color: 'green', alpha: 0.0 });
          sc.vline(2.0, { color: 'faint', dash: [3, 4], width: 1 }); sc.vline(2.2, { color: 'faint', dash: [3, 4], width: 1 });
          sc.path(curve, { color: 'ink', width: 2.2 });
          sc.fn((x) => sarcForce(x), { domain: [1, L], fill: true, fillAlpha: 0.12, color: 'accent', width: 0 });
          sc.text('plateau', 2.1, 1.08, { size: 11, color: 'muted', align: 'center', baseline: 'bottom' });
          sc.text('no overlap', 3.9, 0.06, { size: 10.5, color: 'muted', align: 'right', baseline: 'bottom' });
          sc.text('red heads: thin filaments overlap', 1.62, 0.12, { size: 10.5, color: 'red', align: 'left', baseline: 'bottom' });
        });
        v.legend([['green', 'head within reach of one thin filament'], ['red', 'two thin filaments (interference)'], ['faint', 'no thin filament in reach'], ['orange', 'thick filament pushed into the Z-disc']]);
        v.readout(() => {
          const L = SL.value, hs = sarcHeads(L), n = (s) => hs.filter((x) => x.st === s).length;
          return `$L = ${v.fix(L, 2)}\\ \\mu$m: of the ${hs.length} drawn heads ${n('on')} are green, ${n('two')} red, ${n('free')} grey → force $= ${v.fix(sarcForce(L), 2)}$ of the plateau. Zero overlap at $L = ${v.fix(2 * SARC.thin + SARC.thick, 2)}\\ \\mu$m (Gordon et al. measured 3.65 μm).`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.5
    {
      num: '2.5',
      kind: 'Law',
      name: 'Hill’s force–velocity relation',
      statement: String.raw`When a stimulated muscle lifts a constant load $F$ (an isotonic contraction), it shortens at a steady speed $v$ that falls as the load grows. Hill's equation says that the points lie on a rectangular hyperbola,
$$(F + a)(v + b) = (F_0 + a)\,b,$$
where $F_0$ is the isometric force (the load at which $v = 0$), $v_{\max} = bF_0/a$ is the speed at zero load, and $a$ (a force) and $b$ (a speed) are constants of the muscle. The ratio $a/F_0$ measures the curvature: about $0.25$ for fast skeletal muscle, smaller (more strongly curved) in slow muscle. The mechanical power $P = Fv$ is zero at both ends and has a single maximum, at $F^* = F_0\bigl(\sqrt{\alpha(1+\alpha)} - \alpha\bigr)$ with $\alpha = a/F_0$, which is about a third of $F_0$ for $\alpha = 0.25$.`,
      idea: String.raw`Hill found the form empirically, from the heat released in a shortening muscle (physio-2.12): the extra energy rate $(F + a)v$ is proportional to the force deficit, $b(F_0 - F)$, and the hyperbola is a rearrangement of that. The shape means a muscle is a poor machine at both extremes: it produces no power when loaded to the maximum and none when unloaded. Cross-bridge kinetics (2.6) reproduces the shape, so $a$ and $b$ are traced back to the rates of attachment and detachment. The maximum of $Fv$ is found by setting $d(Fv)/dF = 0$ on the hyperbola, an algebraic exercise that yields the formula above.`,
      caption: String.raw`**Drag the dot** along the force–velocity curve (left) to choose the load. The sketch (centre) hangs that load on a muscle fixed at the top, and the muscle shortens at the corresponding speed. The power curve (right) shows the load at which the work rate is largest. Change $a/F_0$ to bend the curve: the smaller it is, the more strongly curved the force–velocity relation and the lower the peak power relative to $F_0 v_{\max}$. The best load $F^*/F_0$ moves with the curvature (0.31 at $a/F_0 = 0.25$). $F_0$ is the force scale, and $v_{\max}$ is in muscle lengths per second.`,
      scope: String.raw`Holds for shortening (positive $v$) of an actively tetanized skeletal muscle at fixed temperature, between roughly $0.02F_0$ and $0.8F_0$ (fits are poorest at the extremes). For lengthening muscle the force rises above $F_0$ along a different branch.`,
      deps: ['physio-2.4'],
      see: ['physio-2.12', 'physio-2.6'],
      refs: ['Keener–Sneyd ch. 15'],
      tags: ['muscle', 'mechanics'],
      credit: 'A. V. Hill, 1938',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hill%27s_muscle_model' },
      viz(v) {
        const al = v.slider('curvature $a/F_0$', 0.08, 1, 0.25, { step: 0.01 });
        const vm = v.slider('$v_{\\max}$', 1, 10, 4, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} L₀/s` });
        const sf = v.stage({ x: [0, 1.1], y: [0, 10.5], height: 300, axes: 'box', gutter: true, xlabel: 'load F / F₀', ylabel: 'shortening speed v (L₀/s)', weight: 1.1 });
        const sm = v.stage({ x: [0, 4], y: [0, 6.4], height: 300, axes: false, weight: 0.65, minWidth: 190 });
        const sp = v.stage({ x: [0, 1.1], y: [0, 1], height: 300, axes: 'box', gutter: true, xlabel: 'load F / F₀', ylabel: 'power F·v  (relative to F₀·vmax)', weight: 1, minWidth: 220 });
        const bOf = () => al.value * vm.value;
        const h = sf.handle(0.5, 1, { color: 'gold', r: 8, constrain: (x) => { const F = clamp(x, 0.005, 1); return [F, hillV(F, al.value, bOf())]; } });
        const load = { F: 0.5 };
        h.onDrag = () => { load.F = clamp(h.x, 0.005, 1); };
        let tt = 0;
        v.animate((t) => {
          const a = al.value, b = bOf(), F = load.F, vel = hillV(F, a, b), Pw = F * vel;
          h.set(F, vel);
          sf.fn((x) => hillV(x, a, b), { domain: [0, 1], color: 'accent', width: 2.4 });
          sf.hline(vm.value, { color: 'faint', dash: [3, 4], width: 1 });
          sf.text('$v_{\\max}$', 1.08, vm.value, { size: 11, color: 'muted', align: 'right', baseline: 'bottom' });
          sf.vline(1, { color: 'faint', dash: [3, 4], width: 1 });
          sf.text('F₀ (isometric)', 0.99, 10.1, { size: 10.5, color: 'muted', align: 'right', baseline: 'top' });
          sf.vline(F, { color: 'gold', width: 1, alpha: 0.5 }); sf.hline(vel, { color: 'gold', width: 1, alpha: 0.5 });
          // power
          const pn = vm.value;
          sp.fn((x) => (x * hillV(x, a, b)) / pn, { domain: [0, 1], color: 'green', width: 2.4 });
          const Fo = hillFopt(a), Pm = (Fo * hillV(Fo, a, b)) / pn;
          sp.setView([0, 1.1], [0, Math.max(0.12, Pm * 1.35)]);
          sp.dot(Fo, Pm, { r: 5, color: 'green', label: 'max power', labelPos: 'n' });
          sp.vline(Fo, { color: 'green', dash: [3, 4], width: 1, alpha: 0.6 });
          sp.dot(F, Pw / pn, { r: 7, color: 'gold' });
          // muscle with weight: loops
          const loopT = 2.4, tau = (t % loopT) * 0.9, shorten = Math.min(0.3, (vel * tau) / 1);
          const yTop = 5.8, Lm = 3.2 * (1 - shorten), yBot = yTop - Lm, w = 1.5, hgt = 0.45 + 0.9 * F;
          sm.rect(0.8, yTop, 3.2, yTop + 0.35, { fill: 'ink', fillAlpha: 0.5, stroke: false });
          sm.rect(2 - 0.32, yBot, 2 + 0.32, yTop, { fill: 'red', fillAlpha: 0.2, color: 'red', width: 2, radius: 8 });
          for (let k = 1; k < 7; k++) sm.line(2 - 0.32, yBot + (Lm * k) / 7, 2 + 0.32, yBot + (Lm * k) / 7, { color: 'red', width: 1, alpha: 0.3 });
          sm.line(2, yBot, 2, yBot - 0.35, { color: 'ink', width: 1.5 });
          sm.rect(2 - w / 2, yBot - 0.35 - hgt, 2 + w / 2, yBot - 0.35, { fill: 'ink', fillAlpha: 0.35, color: 'ink', width: 1.8, radius: 3 });
          sm.text(`load ${v.fix(F, 2)} F₀`, 2, yBot - 0.35 - hgt / 2, { size: 11, color: 'ink', align: 'center', baseline: 'middle', weight: 600 });
          sm.text('muscle length', 0.5, 0.5, { size: 10.5, color: 'muted', align: 'left' });
          sm.text(`${v.fix(100 * (1 - shorten), 0)} % of L₀`, 0.5, 0.18, { size: 10.5, color: 'red', align: 'left', weight: 600 });
          tt = tau;
        }, { period: 2.4, still: 1.4 });
        v.legend([['accent', '$(F+a)(v+b) = (F_0+a)b$'], ['green', 'power $Fv$'], ['gold', 'your load']]);
        v.readout(() => {
          const a = al.value, b = bOf(), F = load.F, vel = hillV(F, a, b), Fo = hillFopt(a), Pm = Fo * hillV(Fo, a, b);
          return `at $F = ${v.fix(F, 2)}F_0$: $v = ${v.fix(vel, 2)}\\ L_0/\\mathrm s$, and $(F+a)(v+b) = ${v.fix((F + a) * (vel + b), 3)}$ against $(F_0+a)b = ${v.fix((1 + a) * b, 3)}$ · power $Fv = ${v.fix(F * vel, 2)}$, maximum $${v.fix(Pm, 2)}$ at $F^*/F_0 = ${v.fix(Fo, 3)}$ (and $v^*/v_{\\max} = ${v.fix(hillV(Fo, a, b) / vm.value, 3)}$)`;
        });
      },
    },

    // ------------------------------------------------------------------ 2.6
    {
      num: '2.6',
      kind: 'Model',
      name: 'Huxley’s cross-bridge model',
      statement: String.raw`Let $n(x,t)$ be the fraction of myosin heads attached at displacement $x$ from their rest position (in units of the reach $h$), where positive $x$ means the attached head is stretched so that it pulls. A head attaches with rate $f(x)$ and detaches with rate $g(x)$, and the filaments slide at speed $w$ so that every head's $x$ changes at that rate:
$$\frac{\partial n}{\partial t} - w\frac{\partial n}{\partial x} = f(x)\,(1-n) - g(x)\,n.$$
Huxley's rates are $f = f_1 x$ for $0 < x \le 1$ and zero elsewhere, $g = g_1 x$ for $x > 0$ and a large constant $g_2$ for $x < 0$ (heads that are being dragged backwards are detached quickly). The force is $F = \int x\,n(x)\,dx$ (each attached head acts as a linear spring). In the steady state the equation is an ordinary differential equation in $x$, and solving it for each sliding speed $w$ gives a force–velocity curve that falls from the isometric force $F_0$ at $w = 0$ to zero at $v_{\max}$, close to Hill's hyperbola (2.5).`,
      idea: String.raw`At rest ($w = 0$) the attached fraction is $f/(f+g)$ for $x>0$ and zero for $x<0$, so every pulling head contributes. Sliding adds an advection term. Heads that attach near $x = 1$ are carried through the zone towards $x = 0$ and then to negative $x$ before they can detach: the faster the sliding, the less time each head spends attached on the pulling side, and the more of them arrive at $x<0$ where they push the wrong way. At $v_{\max}$ the pulling and dragging contributions cancel. The model thus derives the shape of Hill's curve from the kinetics of single bridges, the first successful molecular theory of contraction. Huxley's later extension (1971) added the second attached state needed for the rapid transients.`,
      caption: String.raw`**Top left**: the steady distribution $n(x)$ of attached heads (green pulls, red drags) at the sliding speed $w$ you choose. **Top right**: the attachment and detachment rate functions. **Bottom**: the force–velocity curve built from this equation (solid) with the best Hill hyperbola through it (dashed). Raise $w$ (the slider is in units of $v_{\max}$) and watch the green area shrink and the red tail grow until the net force vanishes at $w = v_{\max}$; beyond it the dragging heads win. The drag rate $g_2$ sets the speed scale: doubling it doubles $v_{\max}$ and straightens or bends the curve ($a/F_0$ falls as $g_2$ grows). The hyperbola follows the Huxley curve to within about 1 % of $F_0$ but is not exactly it.`,
      scope: String.raw`Steady-state model with linear springs and two bridge states; rate constants are those fitted by Huxley (1957) to frog muscle at 0 °C. Real muscle also has a series elasticity, a second force-generating step and ATP turnover, none of which are modelled here.`,
      deps: ['physio-2.5'],
      see: ['physio-2.5', 'physio-2.12'],
      refs: ['Keener–Sneyd ch. 15'],
      tags: ['muscle', 'cross-bridge'],
      credit: 'A. F. Huxley, 1957',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Crossbridge' },
      viz(v) {
        const wf = v.slider('sliding speed $w / v_{\\max}$', 0, 1.25, 0.22, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const g2 = v.slider('drag detachment $g_2$', 50, 400, 209, { step: 1, fmt: (x) => `${v.fix(x, 0)} s⁻¹` });
        const f1 = v.slider('attachment $f_1$', 15, 90, 43.3, { step: 0.1, fmt: (x) => `${v.fix(x, 1)} s⁻¹` });
        const showHill = v.toggle('overlay best Hill hyperbola', true);
        const sn = v.stage({ x: [-2.5, 1.3], y: [0, 1.05], height: 250, axes: 'box', gutter: true, xlabel: 'head displacement x / h', ylabel: 'attached fraction n(x)', weight: 1.2 });
        const sr = v.stage({ x: [-2.5, 1.3], y: [0, 400], height: 250, axes: 'box', gutter: true, xlabel: 'x / h', ylabel: 'rate (s⁻¹)', weight: 0.9, minWidth: 240 });
        const sf = v.stage({ x: [0, 135], y: [-0.25, 1.1], height: 300, axes: 'box', gutter: true, xlabel: 'sliding speed w (h/s)', ylabel: 'force F / F₀', full: true });
        let key = '', C = null;
        const P = () => ({ f1: f1.value, g1: HUX.g1, g2: g2.value });
        const curve = () => {
          const k = `${g2.value}|${f1.value}`;
          if (k !== key) {
            key = k; const p = P(), F0 = huxSolve(0, p).F, pts = [];
            let lo = 0, hi = 800; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (huxSolve(m, p, -2.5, 300).F > 0) lo = m; else hi = m; }
            const vmax = (lo + hi) / 2;
            for (let i = 0; i <= 52; i++) { const ww = (i / 40) * vmax, r = huxSolve(ww, p, -2.5, 300); pts.push([ww, r.F / F0]); }
            let best = { a: 0.2, e: Infinity };
            for (let a = 0.02; a < 4; a += 0.01) { let e = 0; for (const [ww, F] of pts) { if (ww >= vmax || F <= 0) continue; const Fh = hillF(ww, a, a * vmax); e += (Fh - F) ** 2; } if (e < best.e) best = { a, e }; }
            C = { pts, F0, vmax, a: best.a, err: Math.sqrt(best.e / Math.max(1, pts.length)) };
          }
          return C;
        };
        v.render(() => {
          const p = P(), c = curve(), wv = wf.value * c.vmax, r = huxSolve(wv, p), r0 = huxSolve(0, p);
          sf.setView([0, 1.3 * c.vmax], [-0.25, 1.1]);
          // distribution
          const pos = [[0, 0]], neg = [];
          for (let i = 0; i < r.x.length; i++) { if (r.x[i] >= 0) pos.push([r.x[i], r.n[i]]); else neg.push([r.x[i], r.n[i]]); }
          pos.push([1, 0]); neg.unshift([r.x[0], 0]); neg.push([0, 0]);
          sn.poly(neg, { fill: 'red', fillAlpha: 0.3, color: 'red', width: 1.6 });
          sn.poly(pos, { fill: 'green', fillAlpha: 0.3, color: 'green', width: 1.6 });
          sn.path(r0.x.map((x, i) => [x, r0.n[i]]), { color: 'muted', dash: [4, 4], width: 1.3 });
          sn.text('isometric (w = 0)', 0.95, 0.99, { size: 10.5, color: 'muted', align: 'right', baseline: 'top' });
          sn.vline(0, { color: 'faint', width: 1 });
          // rates
          sr.fn((x) => huxF(x, p), { domain: [-2.5, 1.3], color: 'orange', width: 2.2 });
          sr.fn((x) => Math.min(huxG(x, p), 395), { domain: [-2.5, 1.3], color: 'red', width: 2.2 });
          sr.text('g (detachment)', -2.4, g2.value + 10, { size: 11, color: 'red', align: 'left', baseline: 'bottom' });
          sr.text('f (attachment)', 0.45, huxF(0.95, p) + 6, { size: 11, color: 'orange', align: 'right', baseline: 'bottom' });
          sr.vline(0, { color: 'faint', width: 1 });
          // F–v
          sf.hline(0, { color: 'faint', width: 1 });
          sf.path(c.pts, { color: 'accent', width: 2.4 });
          if (showHill.value) sf.fn((ww) => hillF(ww, c.a, c.a * c.vmax), { domain: [0, c.vmax * 0.995], color: 'ink', width: 1.6, dash: [6, 4] });
          sf.vline(c.vmax, { color: 'faint', dash: [3, 4], width: 1 });
          sf.dot(wv, r.F / c.F0, { r: 7, color: 'gold' });
          sf.text(`v_max = ${v.fix(c.vmax, 0)} h/s`, c.vmax * 0.985, 0.55, { size: 10.5, color: 'muted', align: 'right' });
        });
        v.legend([['green', 'pulling heads $(x>0)$'], ['red', 'dragging heads $(x<0)$'], ['accent', 'Huxley force–velocity'], ['ink', 'Hill hyperbola (best fit)', { dash: true }]]);
        v.readout(() => {
          const p = P(), c = curve(), wv = wf.value * c.vmax, r = huxSolve(wv, p);
          return `$w = ${v.fix(wv, 0)}\\ h/\\mathrm s$: $F/F_0 = ${v.fix(r.F / c.F0, 3)}$, attached heads ${v.fix(100 * r.B / huxSolve(0, p).B, 0)} % of the isometric number · $v_{\\max} = ${v.fix(c.vmax, 0)}\\ h/\\mathrm s$ · best Hill fit $a/F_0 = ${v.fix(c.a, 2)}$ (rms deviation ${v.fix(c.err, 3)} of $F_0$)`;
        });
      },
    },
  ],
};
