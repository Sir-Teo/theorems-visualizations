// Thermodynamics & Statistical Mechanics — Chapter 1: Temperature, heat and the first law
import { clamp, lerp, hsGas, carnahanStarling, ramp, pick, drawGas, windowed, fitLine } from './ch01.shared.js';

// ---------- helpers for this file ----------
/** Advance a gas by up to T in chunks of ch, giving up after ms of wall-clock time; each(h) runs before every chunk. */
function runBudget(G, T, ch, ms, each) {
  const t0 = performance.now(); let done = 0;
  while (done < T - 1e-9) { const h = Math.min(ch, T - done); if (each) each(h); G.advance(h); done += h; if (performance.now() - t0 > ms) break; }
  return done;
}
/** Clock for animated simulations: returns the simulated time to add this frame (catching up after a jump, e.g. a still frame). */
function simClock(rate, cap = 0.25) {
  let last = null;
  return (t, reset) => {
    if (last === null || t < last - 1e-6) { last = t; reset?.(); return Math.min(t, 8) * rate; }
    const dt = t - last; last = t;
    return (dt > 0.5 ? Math.min(dt, 8) : Math.min(dt, cap)) * rate;
  };
}
/** Temperature colour ramp (cold blue → purple → hot red). */
const tRamp = (v) => ramp(v, 'blue', 'red', 32, 'purple');
/** Deterministic scatter of n points in a rectangle (for drawing gas samples). */
function scatter(n, seed, x0, y0, x1, y1) { let a = seed; const r = () => ((a = (a * 16807) % 2147483647) / 2147483647); return Array.from({ length: n }, () => [x0 + (x1 - x0) * r(), y0 + (y1 - y0) * r()]); }

// Second virial coefficient of a Lennard-Jones gas (cm³/mol), parameters (σ in Å, ε/k in K) fitted to measured B(T).
const LJ = {
  He: { sig: 2.556, eps: 10.22, tex: '\\mathrm{He}', col: 'teal' },
  H2: { sig: 2.928, eps: 37.0, tex: '\\mathrm{H_2}', col: 'pink' },
  N2: { sig: 3.698, eps: 95.05, tex: '\\mathrm{N_2}', col: 'accent' },
  Ar: { sig: 3.405, eps: 119.8, tex: '\\mathrm{Ar}', col: 'green' },
  CO2: { sig: 4.486, eps: 189, tex: '\\mathrm{CO_2}', col: 'red' },
};
const B2cache = new Map();
function B2(g, T) {
  const key = g + '|' + Math.round(T * 4);
  if (B2cache.has(key)) return B2cache.get(key);
  const { sig, eps } = LJ[g], a = 0.4 * sig, b = 10 * sig, n = 600, h = (b - a) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) { const r = a + i * h, sr6 = (sig / r) ** 6, u = 4 * eps * (sr6 * sr6 - sr6); s += (Math.exp(-u / T) - 1) * r * r * (i === 0 || i === n ? 1 : i % 2 ? 4 : 2); }
  const B = -2 * Math.PI * (s * h / 3 - a ** 3 / 3) * 0.6022141;
  B2cache.set(key, B); return B;
}
// Material laws used by the thermometers of 1.3
const ptRatio = (t) => 1 + 3.9083e-3 * t - 5.775e-7 * t * t;                 // platinum R(t)/R(0), IEC 60751 (t ≥ 0 °C form)
const kellRho = (t) => (999.83952 + 16.945176 * t - 7.9870401e-3 * t * t - 46.170461e-6 * t ** 3 + 105.56302e-9 * t ** 4 - 280.54253e-12 * t ** 5) / (1 + 16.879850e-3 * t); // water, kg/m³ (Kell 1975)
const thermistor = (t) => Math.exp(3950 * (1 / (t + 273.15) - 1 / 273.15)); // NTC thermistor R(t)/R(0), β = 3950 K

export default {
  collection: 'thermo',
  chapter: 1,
  title: 'Temperature, heat and the first law',
  summary: String.raw`Bodies in contact settle into equilibrium, and the zeroth law turns "being in equilibrium with" into a label, temperature, that any calibrated thermometer can read — best of all a dilute gas. The ideal gas law and kinetic theory tie that label to molecular motion: pressure is the drumming of molecules on the walls, and $kT$ measures their mean kinetic energy. Energy is conserved once heat is counted alongside work — the first law, which Joule's paddle wheel made quantitative. Heat capacities and enthalpy follow, and with them isothermal and adiabatic processes, Laplace's adiabatic speed of sound, the lapse rate of the atmosphere and the free expansion of a gas. Most pictures here are exact simulations of hard-sphere gases whose pressure, temperature, work and heat are tallied collision by collision.`,
  items: [
    // ------------------------------------------------------------------ 1.1
    {
      num: '1.1', kind: 'Definition', name: 'Thermodynamic systems, states and equilibrium',
      statement: String.raw`A **thermodynamic system** is a chosen piece of the world — a gas in a cylinder, a block of copper, a star — separated from its **surroundings** by walls that say what may cross. An **isolated** system exchanges neither energy nor matter; a **closed** one exchanges energy but not matter; an **open** one exchanges both. A wall that blocks heat is **adiabatic**; one that lets it through is **diathermal**.

A **macrostate** is specified by a few macroscopic variables — volume $V$, pressure $P$, amount $N$, internal energy $U$, … — out of the astronomically many microscopic details. A system is in **thermodynamic equilibrium** when nothing macroscopic changes any more and there are no internal flows: its state variables are uniform (within each phase) and constant in time. Quantities that depend only on the equilibrium state, not on how it was reached, are **state functions**.`,
      idea: String.raw`Left alone, an isolated system runs down its gradients — of temperature, pressure, concentration — until they are gone; what remains is described by very few numbers, which is why thermodynamics works at all. The time this takes depends on the walls: a good conductor between two bodies equalizes them in seconds, an insulating wall can keep them apart indefinitely. Equilibrium is therefore always relative to the constraints the walls impose, and changing a constraint (removing an insulating wall, freeing a piston) starts the system toward a new equilibrium.`,
      caption: String.raw`Two blocks, A and B, form an isolated system: their outer ends are insulated and they touch only through the wall between them. Each block is cut into 20 slices and heat diffuses between neighbouring slices and across the wall (conductance $G$). Watch the slice colours: gradients inside each block and the jump across the wall die out, and both settle at the energy-weighted mean $T_f$ (dashed). Turn the wall **insulating** at any moment and each block equilibrates *internally* while staying at its own temperature. A large $G$ makes the blocks' own conduction the bottleneck.`,
      deps: [],
      refs: ['Schroeder §1.1', 'Callen ch. 1'],
      tags: ['equilibrium', 'state variables'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Thermodynamic_equilibrium' },
      viz(v) {
        const n = 20, CB = 400, KINT = 8, DT = 0.1, RATE = 300, TMAX = 3600;
        const wall = v.select('wall', [{ value: 'dia', label: 'conducting (diathermal)' }, { value: 'adia', label: 'insulating (adiabatic)' }], 'dia');
        const Gs = v.slider('wall conductance $G$', 0.05, 10, 0.5, { log: true, fmt: (x) => v.fix(x, 2) + ' W/K' });
        const TA0 = v.slider('start $T_A$', 0, 100, 90, { step: 1, fmt: (x) => x.toFixed(0) + ' °C', onChange: () => reset() });
        const TB0 = v.slider('start $T_B$', 0, 100, 15, { step: 1, fmt: (x) => x.toFixed(0) + ' °C', onChange: () => reset() });
        const rat = v.slider('$C_A/C_B$', 0.25, 4, 2, { log: true, fmt: (x) => v.fix(x, 2), onChange: () => reset() });
        const sb = v.stage({ x: [0, 21], y: [0.2, 4.5], height: 170, axes: false, full: true });
        const sp = v.stage({ x: [0, 20], y: [0, 100], height: 250, axes: 'box', xlabel: 'position (cm)', ylabel: 'T (°C)', title: 'temperature profile', xticks: [0, 5, 10, 15, 20] });
        const sh = v.stage({ x: [0, 60], y: [0, 100], height: 250, axes: 'box', xlabel: 'time (min)', ylabel: 'T (°C)', title: 'mean temperature of each block' });
        let TA, TB, t, hist, E0;
        const CA = () => rat.value * CB;
        const reset = () => { TA = new Float64Array(n).fill(TA0.value); TB = new Float64Array(n).fill(TB0.value); t = 0; hist = [[0, TA0.value, TB0.value]]; E0 = CA() * TA0.value + CB * TB0.value; };
        reset();
        const mean = (a) => a.reduce((s, q) => s + q, 0) / a.length;
        const flux = () => (wall.value === 'dia' ? Gs.value : 0) * (TA[n - 1] - TB[0]);
        const step = (h) => {
          const cA = CA() / n, cB = CB / n, q = flux(), dA = new Float64Array(n), dB = new Float64Array(n);
          for (let i = 0; i < n - 1; i++) { const fa = KINT * (TA[i + 1] - TA[i]), fb = KINT * (TB[i + 1] - TB[i]); dA[i] += fa; dA[i + 1] -= fa; dB[i] += fb; dB[i + 1] -= fb; }
          dA[n - 1] -= q; dB[0] += q;
          for (let i = 0; i < n; i++) { TA[i] += h * dA[i] / cA; TB[i] += h * dB[i] / cB; }
          t += h;
        };
        const clock = simClock(RATE, 0.1);
        v.animate((tt) => {
          let add = clock(tt, reset);
          while (add > 0 && t < TMAX) { const h = Math.min(DT, add); step(h); add -= h; if (t - hist[hist.length - 1][0] >= 10) hist.push([t, mean(TA), mean(TB)]); }
          const rp = tRamp(v), col = (T) => pick(rp, T / 100), Tf = (CA() * TA0.value + CB * TB0.value) / (CA() + CB);
          // blocks
          const xA = (i) => 0.6 + i * 0.48, xB = (i) => 10.8 + i * 0.48, y0 = 1.25, y1 = 3.05;
          for (let i = 0; i < n; i++) { sb.rect(xA(i), y0, xA(i) + 0.48, y1, { fill: col(TA[i]), fillAlpha: 0.9, stroke: false }); sb.rect(xB(i), y0, xB(i) + 0.48, y1, { fill: col(TB[i]), fillAlpha: 0.9, stroke: false }); }
          sb.rect(0.6, y0, 10.2, y1, { color: 'ink', width: 1.4 }); sb.rect(10.8, y0, 20.4, y1, { color: 'ink', width: 1.4 });
          if (wall.value === 'dia') sb.rect(10.2, y0 - 0.1, 10.8, y1 + 0.1, { fill: 'orange', fillAlpha: 0.75, color: 'orange', width: 1 });
          else { sb.rect(10.2, y0 - 0.1, 10.8, y1 + 0.1, { fill: 'faint', fillAlpha: 0.6, color: 'muted', width: 1 }); for (let k = 0; k < 6; k++) sb.line(10.2, y0 + k * 0.32, 10.8, y0 + k * 0.32 + 0.3, { color: 'muted', width: 1 }); }
          sb.text('insulated end', 0.6, 0.75, { size: 11, color: 'muted' }); sb.text('insulated end', 20.4, 0.75, { size: 11, color: 'muted', align: 'right' });
          sb.text(wall.value === 'dia' ? 'diathermal wall' : 'adiabatic wall', 10.5, 0.75, { size: 11, color: wall.value === 'dia' ? 'orange' : 'muted', align: 'center', weight: 600 });
          sb.text(`A   C = ${CA().toFixed(0)} J/K   T̄ = ${v.fix(mean(TA), 1)} °C`, 0.6, 3.55, { size: 12.5, weight: 600 });
          sb.text(`B   C = ${CB} J/K   T̄ = ${v.fix(mean(TB), 1)} °C`, 20.4, 3.55, { size: 12.5, weight: 600, align: 'right' });
          const q = flux();
          if (Math.abs(q) > 0.02) { const w = clamp(1.5 + Math.abs(q) / 8, 1.5, 7), dir = Math.sign(q); sb.arrow(10.5 - dir * 1.1, 3.55, 10.5 + dir * 1.1, 3.55, { color: 'red', width: w, head: 10 }); sb.text(`heat ${v.fix(Math.abs(q), 1)} W`, 10.5, 4.1, { size: 11.5, color: 'red', align: 'center', weight: 600 }); }
          sb.corner(`t = ${(t / 60).toFixed(1)} min`, 'tr', { size: 12 });
          // profile
          sp.hline(Tf, { color: 'green', dash: [6, 4], width: 1.4 });
          const prof = [];
          for (let i = 0; i < n; i++) { prof.push([i * 0.5, TA[i]], [(i + 1) * 0.5, TA[i]]); }
          sp.path(prof, { color: 'orange', width: 2.6 });
          const profB = []; for (let i = 0; i < n; i++) profB.push([10 + i * 0.5, TB[i]], [10 + (i + 1) * 0.5, TB[i]]);
          sp.path(profB, { color: 'teal', width: 2.6 });
          sp.vline(10, { color: wall.value === 'dia' ? 'orange' : 'muted', width: 2.5, alpha: 0.6 });
          sp.text('A', 5, 96, { align: 'center', color: 'orange', weight: 600 }); sp.text('B', 15, 96, { align: 'center', color: 'teal', weight: 600 });
          sp.text('Tf', 19.6, Tf, { dy: -9, align: 'right', color: 'green', math: true, size: 14 });
          // history
          sh.hline(Tf, { color: 'green', dash: [6, 4], width: 1.4 });
          sh.path(hist.map((p) => [p[0] / 60, p[1]]), { color: 'orange', width: 2.4 });
          sh.path(hist.map((p) => [p[0] / 60, p[2]]), { color: 'teal', width: 2.4 });
          sh.dot(t / 60, mean(TA), { r: 4, color: 'orange' }); sh.dot(t / 60, mean(TB), { r: 4, color: 'teal' });
        }, { still: 3 });
        v.legend([['orange', 'block A'], ['teal', 'block B'], ['green', 'equilibrium $T_f$', { dash: true }]]);
        v.readout(() => {
          const a = mean(TA), b = mean(TB), sA = Math.max(...TA) - Math.min(...TA), sB = Math.max(...TB) - Math.min(...TB), E = CA() * a + CB * b;
          const Tf = (CA() * TA0.value + CB * TB0.value) / (CA() + CB);
          const eq = Math.abs(a - b) < 0.05 && sA < 0.05 && sB < 0.05, frozen = wall.value !== 'dia' && sA < 0.05 && sB < 0.05;
          return `$\\bar T_A$ = ${v.fix(a, 2)} °C, $\\bar T_B$ = ${v.fix(b, 2)} °C · spread inside A ${v.fix(sA, 2)} K, inside B ${v.fix(sB, 2)} K · energy $C_A\\bar T_A + C_B\\bar T_B$ changed by ${v.fix(E - E0, 3)} J (isolated system) · $T_f = (C_AT_A^0 + C_BT_B^0)/(C_A + C_B)$ = ${v.fix(Tf, 2)} °C · ${eq ? '**equilibrium**: uniform and unchanging' : frozen ? '**each block in internal equilibrium, held apart by the adiabatic wall**' : 'not in equilibrium: heat is still flowing'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.2
    {
      num: '1.2', kind: 'Law', name: 'Zeroth law of thermodynamics',
      statement: String.raw`If system A is in thermal equilibrium with system C, and B is in thermal equilibrium with C, then A and B are in thermal equilibrium with each other: when they are brought into contact through a diathermal wall, no heat flows and neither state changes.

Equivalently, "being in thermal equilibrium with" is an equivalence relation on equilibrium states, and its classes can be labelled by a single number, the **empirical temperature** $\theta$: two systems are in equilibrium with each other exactly when $\theta_A = \theta_B$. Each class is a surface (for a simple fluid, a curve, the **isotherm**) in the space of state variables.`,
      idea: String.raw`The law is the reason a thermometer works: C can be carried from A to B and its reading compared, without ever putting A and B together. Transitivity is an empirical fact about heat contact, not a logical necessity — it fails for, say, "being able to exchange particles without a membrane" in suitable setups — which is why it needed stating, and it was given its name ("zeroth") by Fowler only after the first and second laws were already numbered. For a dilute gas the label can be taken to be $\theta = PV/Nk$: two gas samples sharing a diathermal wall end with equal values of $PV/N$, whatever their pressures, volumes or molecules.`,
      caption: String.raw`A and B are samples of gas (0.40 mol of a diatomic and 0.25 mol of a monatomic gas); drag their states on the $P$–$V$ plane. The small thermometer C is a third, tiny gas sample. Let C touch A, then B: its column reads each body's temperature without disturbing it. Then let **A touch B**: the arrows show where the two states go at fixed volume and how much heat flows. Press *Put B on A's isotherm* — the pressures and volumes still differ, but C reads the same and the A–B contact moves nothing.`,
      deps: ['thermo-1.1'],
      refs: ['Kardar §1.2', 'Tong ch. 4'],
      tags: ['temperature', 'equilibrium'],
      credit: 'Maxwell, 1871 (statement); named by R. H. Fowler in the 1930s',
      scope: String.raw`Holds for systems in equilibrium that interact only through heat contact (no work, no exchange of matter). Temperature defined this way is only a label, ordered once one decides which way heat flows; an absolute scale comes from the ideal gas law (1.4) or the second law.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Zeroth_law_of_thermodynamics' },
      viz(v) {
        const R = 8.314, BODY = { A: { n: 0.4, f: 5, col: 'orange' }, B: { n: 0.25, f: 3, col: 'teal' } };
        const mode = v.select('contact', [{ value: 'CA', label: 'C touches A' }, { value: 'CB', label: 'C touches B' }, { value: 'AB', label: 'A touches B' }], 'CA');
        const sch = v.stage({ x: [0, 10], y: [0, 6.6], height: 310, axes: false, weight: 1 });
        const pv = v.stage({ x: [0, 12], y: [0, 400], height: 310, axes: 'box', xlabel: 'V (L)', ylabel: 'P (kPa)', weight: 1.15, title: 'states on the $P$–$V$ plane, with their isotherms' });
        const con = { x: [0.6, 11.4], y: [15, 390] };
        const hA = pv.handle(3, 290, { color: 'orange', label: 'A', constrain: con });
        const hB = pv.handle(8.5, 130, { color: 'teal', label: 'B', constrain: con });
        v.button('Put B on A’s isotherm', () => { const th = hA.x * hA.y / (BODY.A.n * R); hB.y = clamp(th * BODY.B.n * R / hB.x, 15, 390); if (Math.abs(hB.x * hB.y / (BODY.B.n * R) - th) > 0.5) { hB.x = clamp(th * BODY.B.n * R / 200, 0.6, 11.4); hB.y = th * BODY.B.n * R / hB.x; } });
        const th = (h, b) => h.x * h.y / (b.n * R);
        const reads = { A: null, B: null };
        const molsA = scatter(26, 7, 0.75, 0.85, 3.65, 3.95), molsB = scatter(16, 11, 6.35, 0.85, 9.25, 3.95);
        v.render(() => {
          const TA = th(hA, BODY.A), TB = th(hB, BODY.B), m = mode.value;
          const CAp = BODY.A.f / 2 * BODY.A.n * R, CBp = BODY.B.f / 2 * BODY.B.n * R, Tf = (CAp * TA + CBp * TB) / (CAp + CBp);
          if (m === 'CA') reads.A = TA; if (m === 'CB') reads.B = TB;
          const reading = m === 'CA' ? TA : m === 'CB' ? TB : (reads.A ?? 293);
          // ---- schematic
          const rp = tRamp(v), tc = (T) => pick(rp, (T - 150) / 600);
          const box = (x0, b, T, mols, lab) => {
            sch.rect(x0, 0.7, x0 + 3.2, 4.1, { fill: tc(T), fillAlpha: 0.16, color: 'ink', width: 1.6 });
            sch.dots(mols, { r: 3, color: b.col, alpha: 0.85 });
            sch.text(lab, x0 + 1.6, 0.35, { align: 'center', size: 12, weight: 600, color: b.col });
            sch.text(`θ = ${T.toFixed(1)} K`, x0 + 0.05, 4.42, { align: 'left', size: 12, color: 'ink' });
          };
          box(0.6, BODY.A, TA, molsA, 'A  (0.40 mol, f = 5)');
          box(6.2, BODY.B, TB, molsB, 'B  (0.25 mol, f = 3)');
          if (m === 'AB') {
            sch.rect(3.8, 2.1, 6.2, 2.7, { fill: 'orange', fillAlpha: 0.75, color: 'orange', width: 1 });
            const Q = CAp * (TA - Tf);
            if (Math.abs(Q) > 0.5) { const d = Math.sign(Q); sch.arrow(5 - d * 0.9, 3.15, 5 + d * 0.9, 3.15, { color: 'red', width: clamp(1.5 + Math.abs(Q) / 120, 1.5, 7) }); sch.text(`Q = ${Math.abs(Q).toFixed(0)} J`, 5, 3.6, { align: 'center', color: 'red', size: 12, weight: 600 }); }
            else sch.text('no heat flows', 5, 3.4, { align: 'center', color: 'green', size: 12, weight: 600 });
            sch.text('diathermal link', 5, 1.75, { align: 'center', size: 11, color: 'orange' });
          }
          // thermometer C: bulb touching the chosen body
          const tx = m === 'CA' ? 3.35 : m === 'CB' ? 8.95 : 5, by = m === 'AB' ? 4.75 : 4.1 + 0.28;
          const yTop = 6.35, ySc = (T) => by + 0.35 + (yTop - by - 0.45) * clamp((T - 150) / 600, 0, 1);
          sch.rect(tx - 0.13, by + 0.25, tx + 0.13, yTop, { color: 'muted', width: 1.2 });
          sch.rect(tx - 0.08, by + 0.25, tx + 0.08, ySc(reading), { fill: 'red', fillAlpha: 0.8, stroke: false });
          sch.circle(tx, by, 0.28, { fill: 'red', fillAlpha: 0.85, color: 'muted', width: 1.2 });
          for (const T of [200, 400, 600]) { sch.line(tx + 0.13, ySc(T), tx + 0.3, ySc(T), { color: 'muted', width: 1 }); sch.text(`${T} K`, tx + 0.36, ySc(T), { size: 10, color: 'muted' }); }
          sch.text(`C reads ${reading.toFixed(1)} K`, tx - 0.25, yTop - 0.15, { align: 'right', size: 12, weight: 600, color: 'red' });
          // ---- P–V
          const iso = (T, b, col, dash) => pv.fn((V) => T * b.n * R / V, { color: col, width: 1.6, dash, domain: [0.3, 12] });
          iso(TA, BODY.A, 'orange', [6, 4]); iso(TB, BODY.B, 'teal', [2, 4]);
          if (m === 'AB') {
            const PA2 = Tf * BODY.A.n * R / hA.x, PB2 = Tf * BODY.B.n * R / hB.x;
            iso(Tf, BODY.A, 'green', false);
            if (Math.abs(PA2 - hA.y) > 4) pv.arrow(hA.x, hA.y, hA.x, PA2, { color: 'orange', width: 2.2 });
            if (Math.abs(PB2 - hB.y) > 4) pv.arrow(hB.x, hB.y, hB.x, PB2, { color: 'teal', width: 2.2 });
            pv.dot(hA.x, PA2, { r: 4, hollow: true, color: 'green' }); pv.dot(hB.x, PB2, { r: 4, hollow: true, color: 'green' });
          }
          let yA = pv.Y(TA * BODY.A.n * R / 11.8), yB = pv.Y(TB * BODY.B.n * R / 11.8);
          if (Math.abs(yA - yB) < 16) { const mid = (yA + yB) / 2, sg = yA <= yB ? -1 : 1; yA = mid + sg * 8; yB = mid - sg * 8; }
          pv.textPx(`${TA.toFixed(0)} K`, pv.X(11.8), yA - 9, { align: 'right', color: 'orange', size: 11.5 });
          pv.textPx(`${TB.toFixed(0)} K`, pv.X(11.8), yB - 9, { align: 'right', color: 'teal', size: 11.5 });
        });
        v.legend([['orange', 'isotherm of A', { dash: true }], ['teal', 'isotherm of B', { dash: true }], ['green', 'common isotherm after A–B contact']]);
        v.readout(() => {
          const TA = th(hA, BODY.A), TB = th(hB, BODY.B), CAp = 2.5 * BODY.A.n * R, CBp = 1.5 * BODY.B.n * R, Tf = (CAp * TA + CBp * TB) / (CAp + CBp), Q = CAp * (TA - Tf);
          const rA = reads.A == null ? '— (let C touch A)' : `${reads.A.toFixed(1)} K`, rB = reads.B == null ? '— (let C touch B)' : `${reads.B.toFixed(1)} K`;
          return `C read A: ${rA}; C read B: ${rB} · $P_AV_A$ = ${(hA.x * hA.y).toFixed(0)} J vs $P_BV_B$ = ${(hB.x * hB.y).toFixed(0)} J — different, yet only $\\theta = PV/nR$ decides · A–B contact: heat ${Math.abs(Q) < 0.5 ? '**0 J — already in equilibrium**' : `${Math.abs(Q).toFixed(0)} J from ${Q > 0 ? 'A to B' : 'B to A'}, both end at ${Tf.toFixed(1)} K`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.3
    {
      num: '1.3', kind: 'Definition', name: 'Empirical temperature and thermometers',
      statement: String.raw`A **thermometer** is a small system with one easily read property $X$ (a length of liquid, an electrical resistance, the pressure of a gas held at fixed volume) that changes monotonically with temperature. Choosing two reproducible **fixed points** — classically melting ice and boiling water at one atmosphere, called 0 and 100 — and interpolating linearly in $X$ defines an **empirical temperature scale**
$$t_X = 100\,\frac{X - X_{\text{ice}}}{X_{\text{steam}} - X_{\text{ice}}}.$$
Different thermometric properties give scales that agree at the fixed points but not in between. The **constant-volume gas thermometer**, extrapolated to zero gas density, gives the same reading for every gas; the scale it defines, $T = 273.16\ \text{K}\times \lim_{P\to 0} P/P_{\text{tp}}$ (with $P_{\text{tp}}$ the pressure at the triple point of water), is the ideal-gas temperature, which coincides with the absolute thermodynamic temperature.`,
      idea: String.raw`Linear interpolation silently assumes the thermometric property is linear in "true" temperature, which is a statement about the material: water expands non-monotonically (densest at 4 °C), a thermistor's resistance falls exponentially, platinum's resistance curves gently. A dilute gas is the exception because its equation of state, $P = nkT$, involves no material constants at all — and the corrections, set by the second virial coefficient $B(T)$, vanish in proportion to the density. That is why extrapolating gas thermometers to zero pressure removes every trace of the gas used, and why the Kelvin scale rests on gases (and, since 2019, on a fixed value of $k$).`,
      caption: String.raw`Four thermometers are calibrated at 0 °C and 100 °C and then read at other temperatures; drag the dot along the diagonal. Top: water and a thermistor (β = 3950 K) wander far from the truth — water even reads below zero at 4 °C. Bottom left, magnified: platinum (IEC 60751 curve) is off by up to 0.38 °C, the gas thermometer by almost nothing. Bottom right: the reading of a gas thermometer at the steam point, against the pressure it was filled to; every gas follows its own line, but all lines meet at 373.15 K as the pressure goes to zero. Pick a gas and filling pressure.`,
      deps: ['thermo-1.2'],
      refs: ['Schroeder §1.1', 'Kell, J. Chem. Eng. Data 20, 97 (1975)', 'IEC 60751 (platinum resistance)', 'Hirschfelder, Curtiss & Bird (Lennard-Jones B(T))'],
      tags: ['temperature', 'thermometry'],
      credit: 'Fahrenheit, 1714; Celsius, 1742; Regnault’s gas thermometry, 1840s',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Gas_thermometer' },
      viz(v) {
        const gasSel = v.select('gas thermometer', Object.keys(LJ).map((g) => ({ value: g, label: `$${LJ[g].tex}$` })), 'N2');
        const Pf = v.slider('filling pressure at 0 °C', 0.05, 2, 1, { step: 0.01, fmt: (x) => v.fix(x, 2) + ' atm' });
        const st = v.stage({ x: [-10, 110], y: [-12, 112], height: 280, axes: 'box', xlabel: 'true temperature (°C)', ylabel: 'reading (°C)', full: true, title: 'what each thermometer reads after calibration at 0 °C and 100 °C' });
        const sd = v.stage({ x: [-10, 110], y: [-0.5, 0.5], height: 240, axes: 'box', xlabel: 'true temperature (°C)', ylabel: 'reading − true (°C)', title: 'magnified: platinum and the gas thermometer' });
        const sx = v.stage({ x: [0, 2], y: [372.6, 376], height: 240, axes: 'box', xlabel: 'filling pressure (atm)', ylabel: 'steam-point reading (K)', title: 'gas thermometers extrapolated to $P \\to 0$' });
        const h = st.handle(50, 50, { color: 'ink', r: 6, constrain: (x) => { const t = clamp(x, -9, 109); return [t, t]; } });
        const RA = 82.057; // cm³·atm/(mol·K)
        const gasP = (g, P0, t) => { // constant-volume gas: density fixed by filling to P0 at the ice point
          const Ti = 273.15; let rho = P0 / (RA * Ti); for (let k = 0; k < 6; k++) rho = P0 / (RA * Ti * (1 + B2(g, Ti) * rho));
          const T = t + 273.15; return rho * RA * T * (1 + B2(g, T) * rho);
        };
        const interp = (X) => (t) => 100 * (X(t) - X(0)) / (X(100) - X(0));
        const TH = {
          water: { f: interp((t) => 1 / kellRho(t)), col: 'teal', name: 'water (expansion)' },
          therm: { f: interp((t) => thermistor(t)), col: 'purple', name: 'thermistor (resistance)' },
          pt: { f: interp(ptRatio), col: 'green', name: 'platinum (resistance)' },
        };
        const gasRead = (t) => { const g = gasSel.value, P0 = Pf.value; return interp((u) => gasP(g, P0, u))(t); };
        v.render(() => {
          const t = h.x;
          st.line(-10, -10, 110, 110, { color: 'faint', width: 1.2, dash: [5, 4] });
          for (const k of ['water', 'therm', 'pt']) st.fn(TH[k].f, { color: TH[k].col, width: 2.2, domain: [-9.5, 110] });
          st.fn(gasRead, { color: 'accent', width: 2.2, domain: [-9.5, 110], n: 120 });
          st.vline(t, { color: 'faint', width: 1 });
          for (const k of ['water', 'therm', 'pt']) st.dot(t, TH[k].f(t), { r: 4.5, color: TH[k].col });
          st.dot(0, 0, { r: 4, hollow: true, color: 'ink' }); st.dot(100, 100, { r: 4, hollow: true, color: 'ink' });
          st.text('ice point', 1.5, -5, { size: 11, color: 'muted' }); st.text('steam point', 98, 104, { size: 11, color: 'muted', align: 'right' });
          st.text('thermistor', 30, TH.therm.f(30), { dx: -6, align: 'right', color: 'purple', size: 12, weight: 600 });
          st.text('water', 62, TH.water.f(62), { dy: 12, color: 'teal', size: 12, weight: 600 });
          // magnified deviations
          sd.hline(0, { color: 'faint', width: 1, dash: [5, 4] });
          sd.fn((u) => TH.pt.f(u) - u, { color: 'green', width: 2.4, domain: [-9.5, 110] });
          sd.fn((u) => gasRead(u) - u, { color: 'accent', width: 2.4, domain: [-9.5, 110], n: 90 });
          sd.vline(t, { color: 'faint', width: 1 });
          sd.dot(t, TH.pt.f(t) - t, { r: 4, color: 'green' }); sd.dot(t, gasRead(t) - t, { r: 4, color: 'accent' });
          sd.text('platinum', 50, TH.pt.f(50) - 50, { dy: -12, align: 'center', color: 'green', size: 12, weight: 600 });
          sd.text(`gas thermometer (${gasSel.value.replace('2', '₂')})`, 50, gasRead(50) - 50, { dy: 13, align: 'center', color: 'accent', size: 12, weight: 600 });
          // extrapolation
          const steam = (g, P0) => 273.15 * gasP(g, P0, 100) / gasP(g, P0, 0);
          const sEnd = steam(gasSel.value, 2), span = Math.max(0.12, Math.abs(sEnd - 373.15));
          sx.setView([0, 2], [Math.min(373.15, sEnd) - 0.25 * span, Math.max(373.15, sEnd) + 0.3 * span]);
          sx.hline(373.15, { color: 'ink', dash: [6, 4], width: 1.2 });
          const labs = [];
          for (const g of Object.keys(LJ)) {
            const sel = g === gasSel.value;
            sx.fn((P0) => steam(g, Math.max(P0, 1e-3)), { color: LJ[g].col, width: sel ? 3 : 1.6, alpha: sel ? 1 : 0.7, domain: [0, 2], n: 30 });
            const yy = sx.Y(steam(g, 1.97)); if (yy > 6 && yy < sx.height - 6) labs.push([yy, g, sel]);
          }
          labs.sort((a, b) => a[0] - b[0]);
          for (let k = 1; k < labs.length; k++) labs[k][0] = Math.max(labs[k][0], labs[k - 1][0] + 13);
          for (const [yy, g, sel] of labs) sx.textPx(g.replace('2', '₂'), sx.X(1.97), yy - 8, { align: 'right', color: LJ[g].col, size: 11.5, weight: sel ? 700 : 500 });
          sx.dot(Pf.value, steam(gasSel.value, Pf.value), { r: 5, color: LJ[gasSel.value].col });
          sx.dot(0, 373.15, { r: 5, hollow: true, color: 'ink' });
          sx.text('373.15 K', 0.06, 373.15, { dy: span > 1 ? -10 : 12, size: 11.5, color: 'ink' });
        });
        v.legend([['accent', 'gas thermometer (chosen gas)'], ['green', 'platinum'], ['teal', 'water'], ['purple', 'thermistor']]);
        v.readout(() => {
          const t = h.x, g = gasSel.value;
          const B0 = B2(g, 273.15), B1 = B2(g, 373.15), s = 273.15 * gasP(g, Pf.value, 100) / gasP(g, Pf.value, 0);
          return `true ${v.fix(t, 1)} °C → gas ${v.fix(gasRead(t), 3)} · platinum ${v.fix(TH.pt.f(t), 2)} · water ${v.fix(TH.water.f(t), 1)} · thermistor ${v.fix(TH.therm.f(t), 1)} °C · $${LJ[g].tex}$: $B$(0 °C) = ${v.fix(B0, 1)}, $B$(100 °C) = ${v.fix(B1, 1)} cm³/mol, so at ${v.fix(Pf.value, 2)} atm the steam point reads ${v.fix(s, 3)} K (error ${v.fix(s - 373.15, 3)} K, shrinking in proportion to the pressure)`;
        });
      },
    },
  ],
};
