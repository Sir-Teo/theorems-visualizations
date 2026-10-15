// Computational Neuroscience — Chapter 2, landmark papers: Hodgkin & Huxley (1952).
//
// Model and data (verified):
// - The Hodgkin–Huxley equations with their parameters: ḡNa = 120, ḡK = 36, ḡL = 0.3 mS/cm², C = 1 µF/cm²,
//   E_Na = 115, E_K = −12, E_L = 10.613 mV relative to rest (in their convention V is the displacement from rest with
//   depolarisation NEGATIVE, so V_Na = −115 mV), rate functions at 6.3 °C, temperature factor 3^((T − 6.3)/10).
//   Modern form with rest at −65 mV: Sterratt, Graham, Gillies & Willshaw, Principles of Computational Modelling in
//   Neuroscience (2011), Box 3.5.
// - Computed against measured (same source, summarising Hodgkin & Huxley 1952d): propagated velocity 18.8 m/s
//   computed, 21.2 m/s measured at 18.5 °C; threshold for a brief shock about 6 mV in the model, about 10 mV in the
//   experiments. Axoplasm resistivity 35.4 Ω·cm (HH's value, as used e.g. in arXiv:0905.3154); axon radius 238 µm.
//   With these the cable computed here gives 18.9 m/s, in agreement with HH's 18.8.

const ENA = 115, EK = -12, EL = 10.613, GNA = 120, GK = 36, GL = 0.3;
const vtrap = (x, y) => (Math.abs(x / y) < 1e-6 ? y * (1 - x / y / 2) : x / (Math.exp(x / y) - 1));
// rates in ms⁻¹ at 6.3 °C, u = depolarisation from rest (mV, positive = depolarised)
const RATES = (u) => [0.1 * vtrap(25 - u, 10), 4 * Math.exp(-u / 18), 0.07 * Math.exp(-u / 20), 1 / (Math.exp((30 - u) / 10) + 1), 0.01 * vtrap(10 - u, 10), 0.125 * Math.exp(-u / 80)];
const phiOf = (T) => Math.pow(3, (T - 6.3) / 10);
const REST = (() => { const r = RATES(0); return [r[0] / (r[0] + r[1]), r[2] / (r[2] + r[3]), r[4] / (r[4] + r[5])]; })();
const currents = (u, m, h, n) => ({ na: GNA * m ** 3 * h * (u - ENA), k: GK * n ** 4 * (u - EK), l: GL * (u - EL), gna: GNA * m ** 3 * h, gk: GK * n ** 4 });
/** One exponential-Euler step of the space-clamped membrane (gates exact for frozen u, then u). */
function stepMem(s, dt, phi) {
  const r = RATES(s.u), ex = (a, b, x) => { const A = phi * a, B = phi * b, inf = A / (A + B); return inf + (x - inf) * Math.exp(-(A + B) * dt); };
  s.m = ex(r[0], r[1], s.m); s.h = ex(r[2], r[3], s.h); s.n = ex(r[4], r[5], s.n);
  const c = currents(s.u, s.m, s.h, s.n); s.u -= dt * (c.na + c.k + c.l);
}
/** Membrane response to instantaneous depolarising shocks [[t, Δu], …]; returns samples [t, u, m, h, n]. */
function membrane(shocks, T, tEnd, dt0 = 0.01) {
  const phi = phiOf(T), dt = dt0 / Math.max(1, phi / 1.5), s = { u: 0, m: REST[0], h: REST[1], n: REST[2] }, out = [];
  let k = 0, t = 0;
  while (t <= tEnd + 1e-9) {
    while (k < shocks.length && shocks[k][0] <= t + 1e-9) { s.u += shocks[k][1]; k++; }
    out.push([t, s.u, s.m, s.h, s.n]); stepMem(s, dt, phi); t += dt;
  }
  return out;
}
/** Did a new spike start at or after t0? Net ionic current turns inward while depolarised (regeneration) and the
 *  potential then exceeds 40 mV; `pre` (same time grid, without the test shock) rules out the tail of an earlier spike. */
function newSpike(run, pre, t0) {
  let inward = false;
  for (let i = 0; i < run.length; i++) {
    const [t, u, m, h, n] = run[i]; if (t < t0 + 0.02) continue;
    const c = currents(u, m, h, n), net = c.na + c.k + c.l;
    let preIn = false; if (pre) { const q = pre[i], cq = currents(q[1], q[2], q[3], q[4]); preIn = q[1] > 15 && cq.na + cq.k + cq.l < 0; }
    if (u > 15 && net < 0 && !preIn) inward = true;
    if (inward && u > 40) return true;
  }
  return false;
}
/** Smallest shock (mV, up to `hi`) that fires a new spike at t0 after the earlier shocks `pre`, by bisection. */
function threshold(pre, t0, T, hi = 100) {
  const tEnd = t0 + 8, runPre = membrane(pre, T, tEnd, 0.02), ok = (x) => newSpike(membrane([...pre, [t0, x]], T, tEnd, 0.02), runPre, t0);
  if (!ok(hi)) return Infinity;
  let lo = 0; for (let i = 0; i < 15; i++) { const mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid; }
  return hi;
}
/** Propagated action potential: cable, Crank–Nicolson diffusion with Strang-split ionic currents (exponential gates). */
function cable(T) {
  const phi = phiOf(T), a = 0.0238, R = 35.4, D = a / (2 * R * 1e-6) / 1000; // cm²/ms
  const dx = 0.025, dt = 0.005, L = 5, n = Math.round(L / dx) + 1;
  const u = new Float64Array(n), m = new Float64Array(n).fill(REST[0]), h = new Float64Array(n).fill(REST[1]), q = new Float64Array(n).fill(REST[2]);
  for (let i = 0; i < Math.round(0.3 / dx); i++) u[i] = 40; // shock the first 3 mm
  const r = (D * dt) / (dx * dx), cp = new Float64Array(n), dp = new Float64Array(n), d = new Float64Array(n);
  const ion = (dt2) => { for (let i = 0; i < n; i++) { const U = u[i], k = RATES(U), ex = (A, B, x) => { A *= phi; B *= phi; const inf = A / (A + B); return inf + (x - inf) * Math.exp(-(A + B) * dt2); };
    m[i] = ex(k[0], k[1], m[i]); h[i] = ex(k[2], k[3], h[i]); q[i] = ex(k[4], k[5], q[i]); u[i] = U - dt2 * (GNA * m[i] ** 3 * h[i] * (U - ENA) + GK * q[i] ** 4 * (U - EK) + GL * (U - EL)); } };
  const iA = Math.round(2 / dx), iB = Math.round(4 / dx), rec = [], snaps = [], snapT = [0.5, 1.2, 1.9, 2.6];
  let t = 0, tA = null, tB = null, si = 0;
  while (t < 4.2 - 1e-9) {
    ion(dt / 2);
    for (let i = 0; i < n; i++) { const ul = u[i > 0 ? i - 1 : 1], ur = u[i < n - 1 ? i + 1 : n - 2]; d[i] = u[i] + 0.5 * r * (ul - 2 * u[i] + ur); }
    const Bd = 1 + r, A = -0.5 * r; // sealed ends: ghost nodes double the off-diagonal at the boundaries
    cp[0] = (2 * A) / Bd; dp[0] = d[0] / Bd;
    for (let i = 1; i < n; i++) { const C = i === n - 1 ? 0 : A, Ai = i === n - 1 ? 2 * A : A, mm = Bd - Ai * cp[i - 1]; cp[i] = C / mm; dp[i] = (d[i] - Ai * dp[i - 1]) / mm; }
    u[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) u[i] = dp[i] - cp[i] * u[i + 1];
    ion(dt / 2); t += dt;
    if (tA == null && u[iA] > 50) tA = t; if (tB == null && u[iB] > 50) tB = t;
    if (Math.round(t / dt) % 4 === 0) rec.push([t, u[iA], u[iB]]);
    if (si < snapT.length && t >= snapT[si] - 1e-9) { snaps.push({ t, u: Array.from(u), gna: Array.from(m, (mm, i) => GNA * mm ** 3 * h[i]), gk: Array.from(q, (x) => GK * x ** 4) }); si++; }
  }
  return { dx, n, rec, snaps, v: tA != null && tB != null ? (2 / (tB - tA)) * 10 : NaN }; // cm/ms → m/s
}

export default {
  collection: 'neuro',
  chapter: 2,
  items: [
    // ───────────────────────────────────────────────────────────── 2.10
    {
      num: '2.10',
      kind: 'Paper',
      name: 'A Quantitative Description of Membrane Current',
      paper: { authors: 'A. L. Hodgkin and A. F. Huxley', year: 1952, title: 'A quantitative description of membrane current and its application to conduction and excitation in nerve', venue: 'Journal of Physiology 117 (4): 500–544', doi: '10.1113/jphysiol.1952.sp004764' },
      introduces: ['neuro-1.4', 'neuro-2.1', 'neuro-2.2', 'neuro-2.3'],
      statement: String.raw`From voltage-clamp records of the squid giant axon (neuro-1.5), Hodgkin and Huxley wrote the membrane current as a capacitive current plus three ionic currents through conductances in series with their reversal potentials (neuro-1.3, the conductance-based membrane equation neuro-1.4):
$$C\frac{dV}{dt} = -\bar g_{\rm Na}\,m^3h\,(V-V_{\rm Na}) - \bar g_{\rm K}\,n^4(V-V_{\rm K}) - \bar g_L (V-V_L) + I ,$$
where each gate $x \in \{m, h, n\}$ relaxes as $dx/dt = \alpha_x(V)(1-x) - \beta_x(V)x$ with empirically fitted rate functions (potassium activation $n^4$, neuro-2.1; sodium activation $m^3$ and inactivation $h$, neuro-2.2), $\bar g_{\rm Na} = 120$, $\bar g_{\rm K} = 36$, $\bar g_L = 0.3$ mS/cm² and $C = 1$ µF/cm² at 6.3 °C. (In their convention $V$ is the displacement from the resting potential with depolarisation **negative**, so $V_{\rm Na} = -115$ mV and $V_{\rm K} = +12$ mV.)

Solved numerically, without further adjustment, these four equations (neuro-2.3) reproduce the form, amplitude and threshold of the action potential, the refractory period, the conductance changes and, combined with the cable equation (neuro-4.1), a propagated impulse whose computed speed, 18.8 m/s, is close to the 21.2 m/s measured at 18.5 °C. The description is phenomenological: the gates stand for the voltage-dependent opening of ion channels, whose molecular nature was unknown.`,
      idea: String.raw`Bernstein had proposed that the membrane at rest is permeable to potassium; Hodgkin and Katz (1949) showed that during the impulse it becomes selectively permeable to sodium, and the voltage clamp of Cole, Hodgkin, Huxley and Katz let them hold the membrane potential fixed and measure the currents. In four earlier papers of 1952 they separated the current into sodium and potassium components (by replacing external sodium), found that each conductance turns on and off with characteristic time courses at each clamped voltage, and that sodium conductance also inactivates. This fifth paper condenses those measurements into equations and then asks whether they explain excitation. Integrating the equations by hand on a mechanical calculator took weeks; the computed action potentials matched the recordings. The model founded quantitative neuroscience: every conductance-based neuron model descends from it, and its gating particles anticipated the voltage sensors and inactivation gates of sodium and potassium channels. Hodgkin and Huxley shared the 1963 Nobel Prize with Eccles.`,
      caption: String.raw`The Hodgkin–Huxley equations with their own constants, integrated here. **Membrane action potential**: a brief shock depolarises the membrane by the amount you set; below threshold it decays, above it fires a full spike (faint curves: just below and just above threshold). Middle: the gates $m$, $h$, $n$; right: the sodium (inward) and potassium (outward) currents. **Refractory period**: a second shock after the interval you set; the right panel plots the shock needed to fire again against the interval. **Propagated**: the cable equation on an axon of radius 238 µm at 18.5 °C, a shock at the left end; the impulse travels at the speed read out. Raise the **temperature** (rates ×3 per 10 °C); switch to **HH's sign convention** to see the voltage as they plotted it, depolarisation downward.`,
      deps: ['neuro-1.5', 'neuro-1.3', 'neuro-4.1'],
      refs: [],
      tags: ['action potential', 'ion channels', 'history'],
      credit: 'A. L. Hodgkin & A. F. Huxley, 1952',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Hodgkin%E2%80%93Huxley_model' },
      viz(v) {
        const mode = v.select('experiment', [{ value: 'mem', label: 'membrane action potential' }, { value: 'ref', label: 'refractory period' }, { value: 'prop', label: 'propagated' }], 'mem', { onChange: (m) => { if (m === 'prop' && Tm.value === 6.3) Tm.set(18.5); if (m !== 'prop' && Tm.value === 18.5) Tm.set(6.3); sync(); } });
        const u0 = v.slider('shock: depolarisation (mV)', 1, 40, 15, { step: 0.1 });
        const dT = v.slider('interval to 2nd shock (ms)', 1, 25, 8, { step: 0.1 });
        const u2 = v.slider('2nd shock (mV)', 1, 80, 20, { step: 0.5 });
        const Tm = v.slider('temperature (°C)', 3, 20, 6.3, { step: 0.1 });
        const hhSign = v.toggle('HH’s 1952 sign convention (depolarisation negative)', false);
        const sync = () => { const m = mode.value; dT.el.hidden = m !== 'ref'; u2.el.hidden = m !== 'ref'; u0.el.hidden = m === 'prop'; };
        const sV = v.stage({ x: [0, 15], y: [-25, 120], height: 250, axes: 'box', full: true, xlabel: 't (ms)', ylabel: 'membrane potential (mV from rest)', title: 'membrane potential' });
        const sG = v.stage({ x: [0, 15], y: [-0.05, 1.05], height: 210, axes: 'box', xlabel: 't (ms)', title: 'gates' });
        const sC = v.stage({ x: [0, 15], y: [-950, 950], height: 210, axes: 'box', xlabel: 't (ms)', title: 'ionic currents (µA/cm²)' });
        const S = (y) => (hhSign.value ? -y : y);
        const cache = new Map(), memo = (k, f) => { if (!cache.has(k)) { if (cache.size > 40) cache.clear(); cache.set(k, f()); } return cache.get(k); };
        let st = null;
        v.render(() => {
          const T = Tm.value, m = mode.value, flip = hhSign.value;
          const yr = flip ? [-122, 32] : [-32, 122];
          sV.setLabels(m === 'prop' ? 'x (cm)' : 't (ms)', flip ? 'V (mV), HH convention' : 'depolarisation (mV from rest)');
          const thr0 = memo(`thr|${T}`, () => threshold([], 0, T));
          if (m !== 'prop') {
            const tEnd = m === 'ref' ? Math.max(20, dT.value + 12) : 15;
            [sV, sG, sC].forEach((s) => s.setView([s === sV && m === 'mem' ? -2.6 : 0, tEnd], s === sV ? yr : s === sG ? [-0.05, 1.05] : [-950, 950]));
            sV.setTitle('membrane potential'); sG.setTitle('gates $m$, $h$, $n$ and the open fractions $m^3h$, $n^4$');
            const shocks = m === 'ref' ? [[0, u0.value], [dT.value, u2.value]] : [[0, u0.value]];
            const run = membrane(shocks, T, tEnd);
            sV.hline(0, { color: 'faint', width: 1 });
            sV.hline(S(ENA), { color: 'orange', width: 1, dash: [3, 4] }); sV.text(`${flip ? 'V_Na = −115' : 'E_Na = 115'} mV`, tEnd, S(ENA), { align: 'right', dx: -4, dy: flip ? -9 : 11, size: 11, color: 'orange' });
            sV.hline(S(EK), { color: 'teal', width: 1, dash: [3, 4] }); sV.text(`${flip ? 'V_K = +12' : 'E_K = −12'} mV`, tEnd, S(EK), { align: 'right', dx: -4, dy: flip ? 11 : -9, size: 11, color: 'teal' });
            if (m === 'mem' && isFinite(thr0)) {
              for (const d of [-0.3, 0.3]) sV.path(membrane([[0, thr0 + d]], T, tEnd, 0.02).map((p) => [p[0], S(p[1])]), { color: d < 0 ? 'red' : 'green', width: 1.1, alpha: 0.55 });
              sV.dot(0, S(thr0), { r: 4, color: 'red', label: `threshold ${v.fix(thr0, 1)}`, labelPos: 'w', math: false, labelSize: 11.5 });
            }
            sV.path(run.map((p) => [p[0], S(p[1])]), { color: 'accent', width: 2.6 });
            if (m === 'ref') sV.vline(dT.value, { color: 'gold', width: 1.4, dash: [4, 3] });
            // gates
            sG.path(run.map((p) => [p[0], p[2]]), { color: 'orange', width: 2.2 }); sG.path(run.map((p) => [p[0], p[3]]), { color: 'purple', width: 2.2 }); sG.path(run.map((p) => [p[0], p[4]]), { color: 'teal', width: 2.2 });
            sG.path(run.map((p) => [p[0], p[2] ** 3 * p[3]]), { color: 'orange', width: 1.2, dash: [4, 3] }); sG.path(run.map((p) => [p[0], p[4] ** 4]), { color: 'teal', width: 1.2, dash: [4, 3] });
            const lab = (i, txt, col) => { const p = run[Math.round(run.length * 0.62)]; sG.text(txt, p[0], p[i], { dy: -9, color: col, size: 12, weight: 700, math: true }); };
            lab(2, 'm', 'orange'); lab(3, 'h', 'purple'); lab(4, 'n', 'teal');
            const peakU = Math.max(...run.map((p) => p[1]));
            if (m === 'mem') {
              const cur = run.map((p) => [p[0], currents(p[1], p[2], p[3], p[4])]);
              sC.hline(0, { color: 'faint', width: 1 });
              sC.path(cur.map(([t, c]) => [t, c.na]), { color: 'orange', width: 2.2 }); sC.path(cur.map(([t, c]) => [t, c.k]), { color: 'teal', width: 2.2 });
              sC.setTitle('ionic currents (µA/cm²): Na⁺ inward, K⁺ outward');
              const iNa = Math.min(...cur.map(([, c]) => c.na)), iK = Math.max(...cur.map(([, c]) => c.k));
              // sodium charge per impulse → moles
              let q = 0; for (let i = 1; i < cur.length; i++) q += Math.min(0, cur[i][1].na) * (cur[i][0] - cur[i - 1][0]);
              st = { m, run, peakU, thr0, iNa, iK, qNa: -q, T };
            } else {
              const curve = memo(`ref|${T}|${u0.value}`, () => { const pts = []; for (let d = 1; d <= 25; d += 0.5) pts.push([d, threshold([[0, u0.value]], d, T)]); return pts; });
              sC.setView([0, 25.5], [0, 105]); sC.setTitle('shock needed to fire again (mV)');
              sC.hline(thr0, { color: 'red', width: 1, dash: [4, 3] }); sC.text('resting threshold', 25, thr0, { align: 'right', dx: -4, dy: -9, size: 11, color: 'red' });
              sC.path(curve.map(([d, th]) => [d, isFinite(th) ? th : null]), { color: 'purple', width: 2.4 });
              const absR = curve.find(([, th]) => isFinite(th)); if (absR) sC.vband(0, absR[0], { color: 'red', alpha: 0.1 });
              const runPre = membrane([[0, u0.value]], T, tEnd), first = newSpike(runPre, null, 0), second = first && newSpike(run, runPre, dT.value);
              sC.dot(dT.value, u2.value, { r: 6, color: second ? 'green' : 'red' });
              st = { m, run, peakU, thr0, curve, absR: absR ? absR[0] : NaN, second, first, T };
            }
          } else {
            const C = memo(`cable|${T}`, () => cable(T)), xs = Array.from({ length: C.n }, (_, i) => i * C.dx);
            sV.setView([0, 5], yr); sG.setView([0, 4.2], yr); sC.setView([0, 5], [-2, 42]);
            sV.hline(0, { color: 'faint', width: 1 });
            C.snaps.forEach((sn, k) => { sV.path(xs.map((x, i) => [x, S(sn.u[i])]), { color: ['purple', 'blue', 'teal', 'accent'][k], width: 2.2 }); });
            C.snaps.forEach((sn, k) => { const i = sn.u.indexOf(Math.max(...sn.u)); sV.text(`${v.fix(sn.t, 1)} ms`, xs[i], S(sn.u[i]), { dy: flip ? 12 : -10, size: 11.5, weight: 700, color: ['purple', 'blue', 'teal', 'accent'][k], align: 'center' }); });
            sV.vline(2, { color: 'gold', width: 1.2, dash: [4, 3] }); sV.vline(4, { color: 'gold', width: 1.2, dash: [4, 3] });
            sG.setTitle('recorded at x = 2 cm and 4 cm'); sG.hline(0, { color: 'faint', width: 1 });
            sG.path(C.rec.map((p) => [p[0], S(p[1])]), { color: 'orange', width: 2.2 }); sG.path(C.rec.map((p) => [p[0], S(p[2])]), { color: 'red', width: 2.2 });
            const last = C.snaps[1]; sV.setTitle('the impulse along the axon at four times');
            sC.setTitle(`conductances along the axon at ${v.fix(last.t, 1)} ms (mS/cm²)`);
            sC.path(xs.map((x, i) => [x, last.gna[i]]), { color: 'orange', width: 2.2 }); sC.path(xs.map((x, i) => [x, last.gk[i]]), { color: 'teal', width: 2.2 });
            st = { m, C, T };
          }
        });
        v.legend([['accent', 'membrane potential'], ['orange', '$m$, $m^3h$ (dashed), $I_{\\rm Na}$, $g_{\\rm Na}$'], ['purple', '$h$'], ['teal', '$n$, $n^4$ (dashed), $I_{\\rm K}$, $g_{\\rm K}$']]);
        v.readout(() => {
          if (!st) return '';
          const T = st.T;
          if (st.m === 'mem') {
            const { peakU, thr0, iNa, iK, qNa } = st, fired = peakU > 50;
            return `${fired ? `**action potential**: peak ${v.fix(peakU, 1)} mV above rest (an overshoot of ${v.fix(peakU - 65, 0)} mV past zero if rest is −65 mV)` : `**no spike**: the depolarisation of ${v.fix(u0.value, 1)} mV decays`} · computed threshold for a brief shock at ${v.fix(T, 1)} °C: **${v.fix(thr0, 1)} mV** (HH's computation about 6 mV, their experiments about 10 mV) · peak Na⁺ current ${v.fix(iNa, 0)} µA/cm², peak K⁺ current ${v.fix(iK, 0)} µA/cm²`;
          }
          if (st.m === 'ref') {
            const { thr0, curve, absR, second, first } = st, here = curve.find(([d]) => Math.abs(d - Math.round(dT.value * 2) / 2) < 1e-9);
            if (!first) return `the first shock (${v.fix(u0.value, 1)} mV) is below threshold (${v.fix(thr0, 1)} mV): raise it to see refractoriness`;
            return `second shock of ${v.fix(u2.value, 1)} mV after ${v.fix(dT.value, 1)} ms: **${second ? 'fires' : 'fails'}** · needed at this interval: ${here && isFinite(here[1]) ? `${v.fix(here[1], 1)} mV` : 'no shock up to 100 mV'} against ${v.fix(thr0, 1)} mV at rest · absolutely refractory for about **${v.fix(absR, 1)} ms**, then relatively refractory while $h$ recovers and $n$ decays`;
          }
          const { C } = st;
          return `computed conduction velocity at ${v.fix(T, 1)} °C: **${v.fix(C.v, 1)} m/s** (from the arrival times at 2 and 4 cm; radius 238 µm, axoplasm 35.4 Ω·cm) · Hodgkin & Huxley computed **18.8 m/s** at 18.5 °C and measured **21.2 m/s**: the model is about 11% slow, a gap still not fully explained`;
        });
        sync();
      },
    },
  ],
};
