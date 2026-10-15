// Thermodynamics & Statistical Mechanics — Chapter 1: Temperature, heat and the first law
import { clamp, lerp, hsGas, carnahanStarling, ramp, pick, drawGas, LJ, B2, runBudget, simClock, tRamp, scatter } from './ch01.shared.js';

// ---------- helpers for this file ----------
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
          sx.text('373.15 K', 0.06, 373.15, { dy: sEnd >= 373.15 ? 12 : -10, size: 11.5, color: 'ink' });
        });
        v.legend([['accent', 'gas thermometer (chosen gas)'], ['green', 'platinum'], ['teal', 'water'], ['purple', 'thermistor']]);
        v.readout(() => {
          const t = h.x, g = gasSel.value;
          const B0 = B2(g, 273.15), B1 = B2(g, 373.15), s = 273.15 * gasP(g, Pf.value, 100) / gasP(g, Pf.value, 0);
          return `true ${v.fix(t, 1)} °C → gas ${v.fix(gasRead(t), 3)} · platinum ${v.fix(TH.pt.f(t), 2)} · water ${v.fix(TH.water.f(t), 1)} · thermistor ${v.fix(TH.therm.f(t), 1)} °C · $${LJ[g].tex}$: $B$(0 °C) = ${v.fix(B0, 1)}, $B$(100 °C) = ${v.fix(B1, 1)} cm³/mol, so at ${v.fix(Pf.value, 2)} atm the steam point reads ${v.fix(s, 3)} K (error ${v.fix(s - 373.15, 3)} K, shrinking in proportion to the pressure)`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.4
    {
      num: '1.4', kind: 'Law', name: 'Ideal gas law',
      statement: String.raw`For a dilute gas of $N$ molecules in a volume $V$ at absolute temperature $T$, the pressure is
$$PV = NkT = nRT,$$
where $k = 1.380649\times10^{-23}$ J/K is Boltzmann's constant, $n = N/N_A$ the amount in moles and $R = N_Ak = 8.314$ J/(mol·K) the gas constant. The pressure depends only on the number density $N/V$ and the temperature — not on the kind of molecule. It is a **limiting law**: every real gas obeys it better and better as its density goes to zero, and departs from it when the molecules' own size and their attractions start to matter.`,
      idea: String.raw`The law gathers Boyle's ($PV$ fixed at fixed $T$), Charles's and Gay-Lussac's ($V$ or $P$ proportional to $T$) and Avogadro's (equal volumes hold equal numbers) observations into one equation; with the gas-thermometer scale of 1.3 it is, in fact, the *definition* of $T$. Kinetic theory (1.6–1.7) explains it: each molecule hits a wall at a rate proportional to its speed and delivers momentum proportional to its speed, so $P = (N/V)\,m\langle v_x^2\rangle$, and $m\langle v_x^2\rangle = kT$. The derivation assumes point molecules that do not interact; finite size crowds the molecules and raises the pressure (for hard spheres, the Carnahan–Starling formula), while attractions lower it.`,
      caption: String.raw`An exact simulation of hard spheres (diameter $\sigma$) between an end wall and a piston; the slab repeats periodically up and down (dashed lines), so only the end wall and the piston are walls. The pressure is **measured**: the momentum delivered by every impact, summed over 10 time units while the piston is still; the end wall is kept at temperature $T$. Each window adds a point (purple: averages of nearby points). Left: measured $P$ against $NkT/V$ — the law is the diagonal, whatever $N$, $V$ and $T$ you choose. Right: $P/\rho kT$ against the packing fraction measured in the middle of the cylinder (molecules pile up against the walls); at liquid-like densities the points climb onto the hard-sphere curve, far above the ideal value 1. Drag the piston, or let it sweep.`,
      deps: ['thermo-1.3'],
      see: ['pchem-1.4', 'pchem-1.1'],
      refs: ['Schroeder §1.2', 'Carnahan & Starling, J. Chem. Phys. 51, 635 (1969)'],
      tags: ['gas laws', 'equation of state'],
      credit: 'Clapeyron, 1834 (combining Boyle, Charles, Gay-Lussac and Avogadro)',
      scope: String.raw`Holds for any gas in the limit of low density; for air at room temperature the error is below 0.1% at 1 atm. It fails at high density (molecular size), near condensation (attractions) and for quantum gases at very low temperature (chapter 8).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Ideal_gas_law' },
      viz(v) {
        const L = 9, XMIN = 6.5, XMAX = 40, WIN = 10, A = L * L;
        let G = null, win, pts = [], acc, tSim = 0;
        const Ns = v.slider('molecules $N$', 40, 250, 170, { int: true, onChange: () => make() });
        const Ts = v.slider('temperature $kT$', 0.4, 3, 1, { step: 0.01, onChange: (x) => { G.Tb = x; G.setT(x); fresh(); } });
        const auto = v.toggle('automatic sweep, volume by volume', true);
        v.button('Clear points', () => { pts = []; });
        const sc = v.stage({ x: [-1.5, XMAX + 7.5], y: [-2.4, L + 1.4], equal: true, height: 200, axes: false, full: true });
        const ph = sc.handle(XMAX + 0.55, L / 2, { color: 'orange', r: 8, constrain: (x) => [clamp(x, XMIN + 0.55, XMAX + 0.55), L / 2] });
        ph.onDrag = () => { if (auto.value) auto.set(false); };
        const sp = v.stage({ x: [0, 1], y: [0, 1], height: 290, axes: 'box', xlabel: 'NkT/V', ylabel: 'measured P', title: 'measured pressure against $NkT/V$' });
        const sz = v.stage({ x: [0, 0.32], y: [0.5, 4.6], height: 290, axes: 'box', xlabel: 'packing fraction η (middle)', ylabel: 'P/ρkT', title: 'departure from the ideal gas' });
        const fresh = () => { win = G.snap(); win.moved = false; acc = { T: 0, n: 0, c: 0 }; };
        const make = () => {
          clock.kick(30);
          G = hsGas({ species: [{ m: 1, d: 1 }], counts: [Ns.value], Ly: L, Lz: L, T: Ts.value, rng: v.rng(5 + Ns.value), piston: { X: G ? G.pist.X : 30 }, periodic: true, thermal: [1, 0, 0, 0, 0, 0], Tb: Ts.value }); G.setT(Ts.value); fresh(); };
        const clock = simClock(12, 0.06, 40);
        // the automatic sweep visits 14 volumes, holding each one still for long enough to measure two windows
        const sweep = (t) => { const k = Math.floor(t / 34) % 26, idx = k < 14 ? k : 26 - k; return XMAX * (XMIN / XMAX) ** (idx / 13); };
        make();
        const rp = ramp(v, 'teal', 'red', 24, 'purple');
        v.animate((t) => {
          const add = clock(t, () => { tSim = 0; pts = []; G = null; make(); });
          runBudget(G, add, 0.1, clock.ms(), (h) => {
            tSim += h;
            const target = auto.value ? sweep(tSim) : ph.x - 0.55, X = G.pist.X;
            let U = Math.abs(target - X) < 0.02 ? 0 : clamp((target - X) / 1.5, -0.5, 0.5);
            if (U !== G.pist.U) G.setU(U);
            if (U !== 0) win.moved = true;
            let c = 0; for (let i = 0; i < G.N; i++) if (G.x[i] > 2 && G.x[i] < X - 2) c++;
            acc.T += G.stats().T; acc.c += c / ((X - 4) * A); acc.n++;
            if (G.t - win.t >= WIN) {
              const b = G.snap(), r = G.meas(win, b), T = acc.T / acc.n, rho = acc.c / acc.n, eta = rho * Math.PI / 6;
              if (!win.moved) pts.push({ id: G.N * T / r.V, P: r.pAll, eta, Z: r.pAll / (rho * T), err: r.pAll * Math.sqrt(1.273 / Math.max(1, r.hits)), V: r.V, T });
              if (pts.length > 500) pts.shift();
              win = b; win.moved = false; acc = { T: 0, n: 0, c: 0 };
            }
          });
          if (auto.value) ph.x = G.pist.X + 0.55;
          drawGas(sc, G, { periodic: true, rod: 6, color: () => 'accent', fill: 'accent', fillAlpha: 0.05 });
          const V = G.volume(), T = G.stats().T;
          sc.text(`V = ${V.toFixed(0)} σ³   N = ${G.N}   kT = ${v.fix(T, 2)}`, 0, -1.3, { size: 12, color: 'muted' });
          sc.text('end wall', 0, L + 0.8, { size: 11, color: 'muted' }); sc.text('piston: drag', G.pist.X + 0.6, L + 0.8, { size: 11, color: 'orange' });
          // measured P vs NkT/V
          const last = pts.slice(-160), mx = Math.max(0.12, ...last.map((p) => Math.max(p.P, p.id))) * 1.12;
          sp.setView([0, mx], [0, mx]);
          sp.line(0, 0, mx, mx, { color: 'ink', dash: [6, 4], width: 1.4 });
          sp.text('P = NkT/V', mx * 0.6, mx * 0.6, { dy: 12, dx: 8, size: 12, color: 'ink' });
          for (const p of last) sp.dot(p.id, p.P, { r: 3, color: pick(rp, p.eta / 0.3), alpha: 0.5, ring: false });
          const binned = (arr, fx, fy, w) => { const m = new Map(); for (const p of arr) { const k = Math.floor(fx(p) / w); const e = m.get(k) || [0, 0, 0]; e[0] += fx(p); e[1] += fy(p); e[2]++; m.set(k, e); } return [...m.entries()].sort((a, b) => a[0] - b[0]).filter((e) => e[1][2] >= 2).map((e) => [e[1][0] / e[1][2], e[1][1] / e[1][2]]); };
          const bl = binned(pts, (p) => p.id, (p) => p.P, mx / 14);
          sp.path(bl, { color: 'purple', width: 2.4 }); sp.dots(bl, { r: 3.5, color: 'purple' });
          // Z vs eta
          sz.hline(1, { color: 'ink', dash: [6, 4], width: 1.4 });
          sz.fn(carnahanStarling, { color: 'red', width: 2.2, domain: [0, 0.32] });
          sz.text('hard spheres (Carnahan–Starling)', 0.315, carnahanStarling(0.3), { align: 'right', dy: -16, color: 'red', size: 11.5 });
          sz.text('ideal gas: P = ρkT', 0.01, 1, { align: 'left', dy: -10, color: 'ink', size: 11.5 });
          for (const p of pts) sz.dot(p.eta, p.Z, { r: 3, color: pick(rp, p.eta / 0.3), alpha: 0.5, ring: false });
          const bz = binned(pts, (p) => p.eta, (p) => p.Z, 0.02);
          sz.path(bz, { color: 'purple', width: 2.4 }); sz.dots(bz, { r: 3.5, color: 'purple' });
          const q = pts[pts.length - 1];
          if (q) { sp.dot(q.id, q.P, { r: 6, hollow: true, color: 'ink' }); sz.dot(q.eta, q.Z, { r: 6, hollow: true, color: 'ink' }); }
        }, { still: 8 });
        v.legend([['teal', 'one window, dilute'], ['red', 'one window, dense (η ≈ 0.3)'], ['purple', 'average of nearby windows'], ['ink', 'ideal gas law', { dash: true }]]);
        v.readout(() => {
          const q = pts[pts.length - 1]; if (!q) return 'measuring…';
          return `last window: $NkT/V$ = ${v.fix(q.id, 4)}, measured $P$ = ${v.fix(q.P, 4)} ± ${v.fix(q.err, 4)} $kT_0/\\sigma^3$ → $PV/NkT$ = ${v.fix(q.P / q.id, 3)} · density in the middle: η = ${v.fix(q.eta, 3)}, $P/\\rho kT$ = ${v.fix(q.Z, 3)} vs Carnahan–Starling ${v.fix(carnahanStarling(q.eta), 3)} · ${pts.length} windows measured`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.5
    {
      num: '1.5', kind: 'Law', name: 'Dalton’s law of partial pressures',
      statement: String.raw`In a mixture of ideal gases occupying a volume $V$ at temperature $T$, the total pressure is the sum of the **partial pressures**, each being the pressure that component would exert if it filled the volume alone:
$$P = \sum_i P_i,\qquad P_i = \frac{N_ikT}{V} = x_iP,$$
with $x_i = N_i/N$ the mole fraction. Equivalently, each gas behaves as if the others were absent. The law holds exactly for ideal gases and approximately for real gases at low density.`,
      idea: String.raw`In the kinetic picture the wall cannot tell the molecules apart: the momentum it receives per second is a sum over molecules, so it splits into one sum per species. Each species' share is $N_i m_i\langle v_x^2\rangle_i/V$, and since every species has $m_i\langle v_x^2\rangle_i = kT$ (1.7), the share is $N_ikT/V$ — independent of the other species and of the molecular masses. Once the molecules occupy a noticeable fraction of the volume (or attract each other), each species feels the others and the shares are no longer what it would exert alone.`,
      caption: String.raw`Three kinds of hard spheres (light, medium, heavy — different masses and sizes) share a cylinder; switch kinds on and off. The impacts on the walls are tallied **by species**, giving measured partial pressures (left bar). Middle bar: what each kind would exert alone in the same volume (computed from its own density); right bar: $N_ikT/V$. In the large volume all three bars agree — Dalton's law. Shrink the volume: the measured total climbs far above the sum of the "alone" pressures, because each kind now has to dodge the others.`,
      deps: ['thermo-1.4'],
      refs: ['Schroeder §1.2', 'Mansoori, Carnahan, Starling & Leland, J. Chem. Phys. 54, 1523 (1971)'],
      tags: ['gas laws', 'mixtures'],
      credit: 'Dalton, 1801',
      scope: String.raw`Exact for ideal gases; for real gases it holds to the extent that the second virial coefficients are negligible, i.e. at low density. In the crowded box here the departure comes from the molecules' size (the attractions of real molecules give departures of the opposite sign).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Dalton%27s_law' },
      viz(v) {
        const L = 8, A = L * L, SPC = [{ m: 1, d: 0.9, col: 'teal', name: 'light' }, { m: 4, d: 1.15, col: 'purple', name: 'medium' }, { m: 16, d: 1.4, col: 'orange', name: 'heavy' }], NUM = [70, 50, 34];
        let G, a0, acc, res = null;
        const tg = SPC.map((sp, k) => v.toggle(`${sp.name} ($m$ = ${sp.m}, $d$ = ${sp.d}σ)`, true, { onChange: () => make() }));
        const box = v.select('volume', [{ value: 'dilute', label: 'large (dilute)' }, { value: 'crowded', label: 'small (crowded)' }], 'dilute', { onChange: () => make() });
        const sc = v.stage({ x: [-1, 37.5], y: [-1.6, L + 1.2], equal: true, height: 190, axes: false, full: true });
        const sb = v.stage({ x: [0, 3.6], y: [0, 1], height: 300, axes: 'box', ylabel: 'pressure (kT/σ³)', xticks: [[0.7, 'measured, by species'], [1.8, 'each kind alone'], [2.9, 'Nᵢ kT / V']], title: 'partial pressures, stacked by species', weight: 1.3 });
        const make = () => {
          clock.kick(80);
          const counts = NUM.map((n, k) => (tg[k].value ? n : 0));
          if (counts.every((c) => c === 0)) counts[0] = NUM[0];
          G = hsGas({ species: SPC.map((q) => ({ m: q.m, d: q.d })), counts, Ly: L, Lz: L, T: 1, rng: v.rng(21), piston: { X: box.value === 'dilute' ? 36 : 8 }, periodic: true });
          a0 = null; acc = { n: 0, T: 0, c: [0, 0, 0] }; res = null;
        };
        const clock = simClock(5, 0.06, 30);
        make();
        const alone = (rho, d, T) => { const eta = rho * Math.PI / 6 * d ** 3; return rho * T * carnahanStarling(eta); };
        const bmcsl = (rhos, T) => { const xi = [0, 1, 2, 3].map((k) => Math.PI / 6 * rhos.reduce((s, r, i) => s + r * SPC[i].d ** k, 0)); const o = 1 - xi[3]; return T * 6 / Math.PI * (xi[0] / o + 3 * xi[1] * xi[2] / (o * o) + (3 - xi[3]) * xi[2] ** 3 / (o ** 3)); };
        v.animate((t) => {
          const add = clock(t, () => make());
          runBudget(G, add, 0.1, clock.ms(), () => {
            if (G.t > 8) {
              if (!a0) a0 = G.snap();
              const X = G.pist.X, c = [0, 0, 0]; for (let i = 0; i < G.N; i++) if (G.x[i] > 2 && G.x[i] < X - 2) c[G.S[i]]++;
              for (let k = 0; k < 3; k++) acc.c[k] += c[k] / ((X - 4) * A);
              acc.T += G.stats().T; acc.n++;
            }
          });
          const cols = SPC.map((q) => q.col);
          drawGas(sc, G, { periodic: true, piston: true, rod: 0, color: (i) => cols[G.S[i]], rScale: 1 });
          sc.text(box.value === 'dilute' ? 'large volume' : 'small volume: molecules crowd each other', 0, -1, { size: 12, color: 'muted' });
          const rr = a0 ? G.meas(a0, G.snap()) : null;
          if (rr && rr.hits >= 150) {
            const r = rr, T = acc.T / acc.n, V = G.volume(), rho = acc.c.map((c) => c / acc.n);
            const counts = [0, 0, 0]; for (let i = 0; i < G.N; i++) counts[G.S[i]]++;
            const meas = r.impS.map((q) => q / r.Aint), al = rho.map((rr, k) => alone(rr, SPC[k].d, T)), id = counts.map((c) => c * T / V);
            res = { meas, al, id, T, rho, tot: meas.reduce((s, q) => s + q, 0), mix: bmcsl(rho, T), hits: r.hits, dt: r.dt };
            const top = Math.max(res.tot, al.reduce((s, q) => s + q, 0), id.reduce((s, q) => s + q, 0)) * 1.18;
            sb.setView([0, 3.6], [0, top]);
            [[0.7, meas], [1.8, al], [2.9, id]].forEach(([x, vals]) => {
              let y = 0;
              vals.forEach((q, k) => { if (q <= 0) return; sb.rect(x - 0.35, y, x + 0.35, y + q, { fill: SPC[k].col, fillAlpha: 0.7, color: SPC[k].col, width: 1 }); y += q; });
              sb.text(v.fix(y, 4), x, y, { dy: -9, align: 'center', size: 11.5, weight: 600 });
            });
            sb.hline(res.mix, { color: 'red', dash: [5, 4], width: 1.4 });
            sb.text('mixture theory (BMCSL)', 3.55, res.mix, { align: 'right', dy: -9, size: 11, color: 'red' });
          } else { res = null; sb.corner(`collecting impacts… (${rr ? rr.hits : 0} so far)`, 'tr'); }
        }, { still: 8 });
        v.legend(SPC.map((q) => [q.col, `${q.name} molecules`]).concat([['red', 'hard-sphere mixture theory', { dash: true }]]));
        v.readout(() => {
          if (!res) return 'collecting impacts…';
          const sumA = res.al.reduce((s, q) => s + q, 0), sumI = res.id.reduce((s, q) => s + q, 0);
          return `measured total ${v.fix(res.tot, 4)} ± ${v.fix(res.tot * Math.sqrt(1.27 / res.hits), 4)} (${res.hits} impacts in ${v.fix(res.dt, 0)} time units) = ${res.meas.map((q) => v.fix(q, 4)).join(' + ')} · sum of "alone" pressures ${v.fix(sumA, 4)} · $\\sum N_ikT/V$ = ${v.fix(sumI, 4)} · measured / Dalton = ${v.fix(res.tot / sumA, 3)} · hard-sphere mixture theory ${v.fix(res.mix, 4)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.6
    {
      num: '1.6', kind: 'Model', name: 'Kinetic theory of pressure',
      statement: String.raw`Model a gas as $N$ molecules of mass $m$ moving in straight lines between elastic collisions with the walls, their own size negligible. A molecule with velocity component $v_x$ hits the wall at $x = L$ every $2L/|v_x|$ and delivers momentum $2m|v_x|$ each time, an average force $mv_x^2/L$. Summing over molecules, the pressure on a wall of area $A$ ($V = AL$) is
$$P = \frac{Nm\langle v_x^2\rangle}{V} = \frac{1}{3}\,\frac{Nm\langle v^2\rangle}{V} = \frac{2}{3}\,\frac{N}{V}\,\langle \tfrac12 mv^2\rangle .$$
Collisions between molecules do not change the result: they conserve momentum and kinetic energy and only reshuffle the velocities.`,
      idea: String.raw`Pressure is a momentum flux. The rate at which molecules with velocity $v_x > 0$ reach a unit area of wall is $n v_x$, and each reverses its momentum, so $P = \int 2mv_x\cdot n v_x\,f(v_x)\,dv_x = nm\langle v_x^2\rangle$ — the fast molecules count twice, once because they arrive more often and once because they hit harder. Isotropy gives $\langle v_x^2\rangle = \langle v^2\rangle/3$. Comparing with $PV = NkT$ (1.4) identifies $kT$ with $m\langle v_x^2\rangle$ (1.7). The picture rests on Newton's laws for the impacts (momentum and impulse, mech 2.1); it was first sketched by Daniel Bernoulli in 1738 and made quantitative by Krönig and Clausius in the 1850s.`,
      caption: String.raw`The piston (right) is fixed and every impact on it is recorded. The middle panel plots the momentum the piston has received over the last 60 time units — a staircase, one step per impact — against the straight line predicted by $Nm\langle v_x^2\rangle/L$, computed from the molecules' velocities. With **one molecule** the steps are regular, every $2L/|v_x|$; with many they blur into the line. Turn collisions off: nothing changes. Bottom: the $v_x$ of all molecules (Gaussian) and of those striking the piston, weighted by $v_x$ because fast molecules arrive more often.`,
      deps: ['mech-2.1', 'thermo-1.4'],
      see: ['pchem-1.6'],
      refs: ['Schroeder §1.2'],
      tags: ['kinetic theory', 'pressure'],
      credit: 'D. Bernoulli, 1738; Krönig, 1856; Clausius, 1857',
      scope: String.raw`Assumes molecules much smaller than their spacing and forces only during brief collisions (a dilute gas), elastic walls, and classical motion. Molecular size and attractions add corrections (1.4, chapter 4).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kinetic_theory_of_gases' },
      viz(v) {
        const L = 8, X = 16, TW = 60;
        let G, hits, t0, mv2, nmv;
        const mode = v.select('gas', [{ value: 'one', label: 'one molecule' }, { value: 'many', label: 'many molecules' }], 'many', { onChange: () => make() });
        const Ns = v.slider('molecules $N$', 10, 150, 80, { int: true, onChange: () => make() });
        const col = v.toggle('molecules collide with each other', true, { onChange: () => make() });
        const sc = v.stage({ x: [-1, X + 4], y: [-1.6, L + 1.4], equal: true, height: 260, axes: false, weight: 0.9 });
        const st = v.stage({ x: [-TW, 0], y: [0, 1], height: 260, axes: 'box', xlabel: 'time (relative to now)', ylabel: 'momentum received', title: 'momentum delivered to the piston', weight: 1.2 });
        const sh = v.stage({ x: [-4.2, 4.2], y: [0, 0.75], height: 220, axes: 'box', xlabel: 'v_x (units of √(kT/m))', ylabel: 'probability density', title: 'velocity of all molecules and of those hitting the piston', full: true });
        const binsAll = new Float64Array(42), binsHit = new Float64Array(42), bw = 0.2;
        const make = () => {
          clock.kick(50);
          const one = mode.value === 'one';
          Ns.el.hidden = one;
          G = hsGas({ species: [{ m: 1, d: col.value && !one ? 0.5 : 0.02 }], counts: [one ? 1 : Ns.value], Ly: L, Lz: L, T: 1, rng: v.rng(31), piston: { X } });
          if (one) { G.vx[0] = 1.45; G.vy[0] = 0.62; G.vz[0] = 0.35; G.repredict(); }
          hits = []; t0 = G.t; mv2 = 0; nmv = 0; binsAll.fill(0); binsHit.fill(0);
          G.onWall = (i, w, J) => { if (w === 1) { hits.push([G.t, J]); const b = Math.floor((J / (2 * G.m[i]) + 4.2) / bw); if (b >= 0 && b < 42) binsHit[b]++; } };
        };
        const clock = simClock(8, 0.05, 70);
        make();
        v.animate((t) => {
          const add = clock(t, () => make());
          runBudget(G, add, 0.1, clock.ms(), (h) => {
            let s = 0; for (let i = 0; i < G.N; i++) { s += G.m[i] * G.vx[i] * G.vx[i]; const b = Math.floor((G.vx[i] + 4.2) / bw); if (b >= 0 && b < 42) binsAll[b] += h; }
            mv2 += s * h; nmv += h;
          });
          while (hits.length && hits[0][0] < G.t - TW - 5) hits.shift();
          // cylinder
          const one = mode.value === 'one';
          drawGas(sc, G, { color: () => 'accent', rScale: one ? 25 : 1, pistonColor: 'orange' });
          if (one) { const i = 0; sc.arrow(G.x[i], G.y[i], G.x[i] + 1.6 * G.vx[i], G.y[i], { color: 'red', width: 2, head: 7 }); sc.text('vₓ', G.x[i] + 1.6 * G.vx[i], G.y[i], { dy: -10, color: 'red', size: 12 }); }
          const lastHit = hits.length ? hits[hits.length - 1][0] : -1e9;
          if (G.t - lastHit < 0.6) sc.rect(X, -0.2, X + 1.1, L + 0.2, { fill: 'red', fillAlpha: 0.35, stroke: false });
          sc.text('fixed piston: impacts recorded', X + 1.4, L + 0.75, { size: 11, color: 'orange', align: 'right' });
          sc.text(`L = ${X} σ, ${G.N} molecule${G.N > 1 ? 's' : ''}`, 0, -1, { size: 11.5, color: 'muted' });
          // staircase over the last TW
          const tStart = Math.max(t0, G.t - TW), F = nmv > 0 ? mv2 / nmv / X : 0, x0 = tStart - G.t;
          let cum = 0; const stair = [[x0, 0]];
          for (const [th, J] of hits) { if (th < tStart) continue; stair.push([th - G.t, cum]); cum += J; stair.push([th - G.t, cum]); }
          stair.push([0, cum]);
          const top = Math.max(cum, -F * x0, 1) * 1.15;
          st.setView([-TW, 0], [0, top]);
          st.line(x0, 0, 0, -F * x0, { color: 'green', width: 2, dash: [7, 4] });
          st.path(stair, { color: 'accent', width: 2.2 });
          for (const [th, J] of hits) if (th >= tStart) st.line(th - G.t, 0, th - G.t, J * top / (G.N > 20 ? 90 : 25), { color: 'orange', width: 1.2, alpha: 0.7 });
          st.text('slope = N m⟨vₓ²⟩ / L', -TW + 2, top * 0.9, { size: 11.5, color: 'green' });
          // histograms
          const totA = binsAll.reduce((s, q) => s + q, 0), totH = binsHit.reduce((s, q) => s + q, 0);
          if (totA > 0) sh.path(Array.from(binsAll).flatMap((q, k) => [[-4.2 + k * bw, q / totA / bw], [-4.2 + (k + 1) * bw, q / totA / bw]]), { color: 'accent', width: 1.6, fill: 'accent', fillAlpha: 0.12 });
          if (totH > 0) sh.path(Array.from(binsHit).flatMap((q, k) => [[-4.2 + k * bw, q / totH / bw], [-4.2 + (k + 1) * bw, q / totH / bw]]), { color: 'orange', width: 1.8, fill: 'orange', fillAlpha: 0.16 });
          sh.fn((u) => Math.exp(-u * u / 2) / Math.sqrt(2 * Math.PI), { color: 'accent', width: 1.6, dash: [5, 4] });
          sh.fn((u) => (u > 0 ? u * Math.exp(-u * u / 2) : 0), { color: 'orange', width: 1.6, dash: [5, 4] });
          sh.text('all molecules: e^(−vₓ²/2)', -1.3, 0.42, { align: 'right', color: 'accent', size: 11.5 });
          sh.text('hitting the piston: vₓ e^(−vₓ²/2)', 1.7, 0.63, { align: 'left', color: 'orange', size: 11.5 });
        }, { still: 7 });
        v.legend([['accent', 'momentum received (staircase)'], ['green', 'prediction $Nm\\langle v_x^2\\rangle/L$', { dash: true }], ['orange', 'single impacts']]);
        v.readout(() => {
          const dt = G.t - t0, Fm = dt > 0 ? G.imp[1] / dt : 0, Fp = nmv > 0 ? mv2 / nmv / X : 0;
          return `since the start (${v.fix(dt, 0)} time units, ${G.hits[1]} impacts): measured force on the piston $\\sum 2mv_x/\\Delta t$ = ${v.fix(Fm, 4)} · predicted $Nm\\langle v_x^2\\rangle/L$ = ${v.fix(Fp, 4)} · ratio ${v.fix(Fp > 0 ? Fm / Fp : 0, 3)} · pressure $F/A$ = ${v.fix(Fm / (L * L), 5)} vs $NkT/V$ = ${v.fix(G.N * G.stats().Ttr / G.volume(), 5)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.7
    {
      num: '1.7', kind: 'Theorem', name: 'Temperature measures mean kinetic energy',
      statement: String.raw`In a dilute gas in equilibrium at temperature $T$, the mean translational kinetic energy per molecule is
$$\left\langle \tfrac12 mv^2\right\rangle = \tfrac32 kT,\qquad\text{equivalently}\qquad m\langle v_x^2\rangle = kT,$$
the same for every kind of molecule, whatever its mass. In a mixture at a common temperature, heavier molecules therefore move more slowly: $v_{\text{rms}} = \sqrt{3kT/m}$, so $v_{\text{rms},1}/v_{\text{rms},2} = \sqrt{m_2/m_1}$.`,
      idea: String.raw`Combine kinetic theory, $PV = \tfrac23 N\langle \tfrac12mv^2\rangle$ (1.6), with the ideal gas law $PV = NkT$ (1.4): the two agree only if $\langle\tfrac12mv^2\rangle = \tfrac32kT$. That it holds for each species separately is the content of equilibrium: collisions between unequal molecules transfer energy, on average, from the one with more kinetic energy to the one with less, until the averages agree — whereupon thermal contact with any other gas exchanges no net energy either, which is the zeroth law at the molecular level. So temperature, defined operationally by thermometers, measures the average energy of random molecular motion.`,
      caption: String.raw`A light and a heavy kind of molecule share the cylinder, the light ones starting hot and the heavy ones cold. Watch their mean kinetic energies (middle) meet at the common value $\tfrac32kT$ set by the total energy, while the speed distributions (right) stay different: the heavy molecules are slower by $\sqrt{m_2/m_1}$. Make the end wall a **heat bath** and both kinds settle at $\tfrac32kT_b$, whatever their masses. Change the mass ratio to see that only the speeds care about mass.`,
      deps: ['thermo-1.6'],
      refs: ['Schroeder §1.2'],
      tags: ['kinetic theory', 'temperature'],
      credit: 'Clausius, 1857; Maxwell, 1860',
      scope: String.raw`Holds for the translational motion of any classical gas or liquid in equilibrium (it is the equipartition theorem, 6.12, for the three translational degrees of freedom); quantum effects modify it only at very low temperature or high density.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Kinetic_theory_of_gases#Temperature_and_kinetic_energy' },
      viz(v) {
        const L = 9, X = 22, NS = [60, 60], COL = ['teal', 'purple'];
        let G, series, sp, tLast;
        const mh = v.slider('mass ratio $m_2/m_1$', 2, 25, 9, { step: 1, onChange: () => make() });
        const bath = v.toggle('end wall is a heat bath', false, { onChange: (on) => { G.thermal[0] = on ? 1 : 0; } });
        const Tb = v.slider('bath temperature $kT_b$', 0.3, 3, 1.6, { step: 0.05, onChange: (x) => { G.Tb = x; } });
        const sc = v.stage({ x: [-1.6, X + 1.6], y: [-1.6, L + 1.2], equal: true, height: 230, axes: false, full: true });
        const sk = v.stage({ x: [0, 160], y: [0, 4.5], height: 260, axes: 'box', xlabel: 'time', ylabel: '⟨½mv²⟩', title: 'mean kinetic energy of each kind', weight: 1.1 });
        const sv = v.stage({ x: [0, 4.5], y: [0, 1.6], height: 260, axes: 'box', xlabel: 'speed v', ylabel: 'probability density', title: 'speed distributions', weight: 1 });
        const make = () => {
          clock.kick(30);
          G = hsGas({ species: [{ m: 1, d: 1, T: 2.6 }, { m: mh.value, d: 1, T: 0.4 }], counts: NS, Ly: L, Lz: L, rng: v.rng(41), piston: { X }, thermal: [bath.value ? 1 : 0, 0, 0, 0, 0, 0], Tb: Tb.value });
          series = []; sp = [[], []]; tLast = -1;
        };
        const clock = simClock(10, 0.05, 0);
        make();
        const kin = () => { const K = [0, 0], n = [0, 0]; for (let i = 0; i < G.N; i++) { const s = G.S[i]; K[s] += 0.5 * G.m[i] * (G.vx[i] ** 2 + G.vy[i] ** 2 + G.vz[i] ** 2); n[s]++; } return [K[0] / n[0], K[1] / n[1]]; };
        v.animate((t) => {
          const add = clock(t, () => make());
          runBudget(G, add, 0.25, clock.ms(), () => {
            if (G.t - tLast >= 0.5) {
              tLast = G.t; const k = kin(); series.push([G.t, k[0], k[1]]); if (series.length > 2000) series.shift();
              if (G.t > 25) for (let i = 0; i < G.N; i++) { const s = G.S[i]; sp[s].push(Math.hypot(G.vx[i], G.vy[i], G.vz[i])); if (sp[s].length > 9000) sp[s].splice(0, 600); }
            }
          });
          drawGas(sc, G, { color: (i) => COL[G.S[i]], rScale: 1, piston: false, len: X, leftColor: bath.value ? 'red' : 'ink', leftWidth: bath.value ? 5 : 2.4 });
          if (bath.value) sc.text(`heat bath kT = ${v.fix(Tb.value, 2)}`, 0, -1, { size: 11.5, color: 'red' });
          // energy plot
          const st = G.stats(), Tc = bath.value ? G.Tb : null;
          const tmax = Math.max(160, G.t);
          sk.setView([Math.max(0, tmax - 160), tmax], [0, 4.5]);
          const Eq = bath.value ? 1.5 * G.Tb : 1.5 * st.Ttr;
          sk.hline(Eq, { color: 'green', dash: [6, 4], width: 1.4 });
          sk.text(bath.value ? '3/2 kT_b' : '3/2 kT (shared)', tmax - 2, Eq, { align: 'right', dy: -10, color: 'green', size: 12 });
          sk.path(series.map((p) => [p[0], p[1]]), { color: COL[0], width: 2 });
          sk.path(series.map((p) => [p[0], p[2]]), { color: COL[1], width: 2 });
          // speed histograms
          const T = Tc ?? st.Ttr;
          for (let s = 0; s < 2; s++) {
            const m = G.SP[s].m;
            if (sp[s].length > 200) sv.hist(sp[s], { bins: 30, range: [0, 4.5], density: true, color: COL[s], fillAlpha: 0.18 });
            sv.fn((u) => 4 * Math.PI * u * u * (m / (2 * Math.PI * T)) ** 1.5 * Math.exp(-m * u * u / (2 * T)), { color: COL[s], width: 1.8, dash: [5, 4], domain: [0, 4.5] });
          }
        }, { still: 9 });
        v.legend([['teal', 'light molecules ($m_1$ = 1)'], ['purple', 'heavy molecules ($m_2$)'], ['green', 'equilibrium value', { dash: true }]]);
        v.readout(() => {
          const k = kin(); let v2 = [0, 0], n = [0, 0];
          for (let i = 0; i < G.N; i++) { const s = G.S[i]; v2[s] += G.vx[i] ** 2 + G.vy[i] ** 2 + G.vz[i] ** 2; n[s]++; }
          const r = Math.sqrt(v2[0] / n[0]) / Math.sqrt(v2[1] / n[1]);
          return `now: $\\langle\\tfrac12mv^2\\rangle$ light ${v.fix(k[0], 3)}, heavy ${v.fix(k[1], 3)} (equilibrium ${v.fix(bath.value ? 1.5 * G.Tb : 1.5 * G.stats().Ttr, 3)}) · $v_{\\rm rms}$ ratio light/heavy ${v.fix(r, 2)} vs $\\sqrt{m_2/m_1}$ = ${v.fix(Math.sqrt(mh.value), 2)} · energy is shared by kind, speed is not`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.8
    {
      num: '1.8', kind: 'Definition', name: 'Quasistatic, reversible and irreversible processes',
      statement: String.raw`A process is **quasistatic** if it runs so slowly that the system passes through a continuous sequence of equilibrium states; only then does it trace a curve in the space of state variables (a path on the $P$–$V$ diagram), with the pressure on the piston equal to the gas's equilibrium pressure at every instant. A process is **reversible** if it can be retraced exactly, returning both system and surroundings to their initial states; reversible processes are quasistatic and free of friction and of heat flow across finite temperature differences. All real processes are **irreversible** to some degree: fast compression, free expansion, friction, mixing and heat conduction cannot be undone without leaving a change somewhere else.`,
      idea: String.raw`A gas relaxes by molecular motion, so "slow" means slow compared with the time for pressure disturbances to cross it — the piston speed must be much smaller than the speed of sound. A piston pushed faster piles molecules up against its face, so it meets *more* than the equilibrium pressure on the way in and *less* on the way out; the work done on the gas over a closed cycle, $-\oint P_{\text{piston}}\,dV$, is then positive and ends up as internal energy. In the quasistatic limit the two curves merge into one equilibrium path and the net work vanishes: the cycle can be run backwards.`,
      caption: String.raw`An insulated cylinder of hard spheres; the piston compresses the gas to a third of its volume and draws back, over and over, at the speed you choose (in units of the thermal speed; sound travels at about 1.3). The $P$–$V$ panel shows the pressure **measured on the piston face** — red going in, blue coming out — against the quasistatic adiabat of this hard-sphere gas (dashed, $d\ln T = -\tfrac23 Z\,d\ln V$ with the Carnahan–Starling $Z$). Slowly, red and blue lie on the adiabat and the gas returns to its starting temperature after each cycle. Fast, the curves split into a loop whose area is work turned into heat, and the density profile (right) shows molecules crowding the piston.`,
      deps: ['thermo-1.1'],
      refs: ['Callen ch. 4', 'Schroeder §1.5'],
      tags: ['processes', 'reversibility'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Quasistatic_process' },
      viz(v) {
        const L = 12, A = L * L, N = 220, X1 = 33, X2 = 11, DX = 0.9;
        let G, dir, cyc, pts, Tstart, Wstart, rec, lastSnap, prof, tCyc;
        const us = v.slider('piston speed $u$', 0.03, 3, 0.1, { log: true, fmt: (x) => v.fix(x, 2) + ' √(kT₀/m)', onChange: () => make() });
        const sc = v.stage({ x: [-1, X1 + 6], y: [-1.8, L + 1.2], equal: true, height: 200, axes: false, full: true });
        const pv = v.stage({ x: [1200, 5200], y: [0, 0.5], height: 290, axes: 'box', xlabel: 'V (σ³)', ylabel: 'P on the piston', title: 'pressure on the piston during each stroke', weight: 1.2 });
        const sd = v.stage({ x: [0, X1], y: [0, 3], height: 290, axes: 'box', xlabel: 'x (σ)', ylabel: 'density / mean', title: 'density along the cylinder', weight: 1 });
        const make = () => {
          clock.kick(1.2);
          G = hsGas({ species: [{ m: 1, d: 1 }], counts: [N], Ly: L, Lz: L, T: 1, rng: v.rng(51), piston: { X: X1 } });
          G.setT(1);
          dir = -1; cyc = 0; pts = []; Tstart = G.stats().T; Wstart = 0; rec = [{ cyc: 0, T: Tstart, W: 0 }]; lastSnap = G.snap(); prof = new Float64Array(22).fill(1); tCyc = 0;
          G.setU(-us.value);
        };
        const clock = simClock(1, 0.05);
        // the quasistatic adiabat of this hard-sphere gas: d ln T = −(2/3) Z(η) d ln V (Carnahan–Starling Z), P = NkT Z/V
        const V0 = X1 * A, adiTab = [];
        { let lnT = 0; const n = 400, l0 = Math.log(V0), l1 = Math.log(X2 * A * 0.85); for (let i = 0; i <= n; i++) { const lv = l0 + (l1 - l0) * i / n, V = Math.exp(lv), Z = carnahanStarling(N * Math.PI / 6 / V); adiTab.push([V, N * Math.exp(lnT) * Z / V]); lnT -= (2 / 3) * Z * (l1 - l0) / n; } }
        const adi = (V) => { if (V >= V0) return adiTab[0][1] * (V0 / V) ** (5 / 3); for (let i = 1; i < adiTab.length; i++) if (adiTab[i][0] <= V) { const [Va, Pa] = adiTab[i - 1], [Vb, Pb] = adiTab[i]; return Pa + (Pb - Pa) * (V - Va) / (Vb - Va); } return adiTab[adiTab.length - 1][1]; };
        make();
        v.animate((t) => {
          const u = us.value, rate = clamp(2 * (X1 - X2) / u / 7, 6, 400);
          const add = clock(t, () => make()) * rate;
          runBudget(G, add, Math.min(0.25, 0.3 / u), clock.ms(), (h) => {
            const X = G.pist.X;
            if (dir < 0 && X <= X2 + 1e-9) { dir = 1; G.setU(u); lastSnap = G.snap(); }
            else if (dir > 0 && X >= X1 - 1e-9) {
              dir = -1; G.setU(-u); cyc++; lastSnap = G.snap();
              rec.push({ cyc, T: G.stats().T, W: G.Wp });
            }
            if ((G.t - lastSnap.t) * u >= DX) {
              const b = G.snap(), r = G.meas(lastSnap, b);
              pts.push({ V: r.V, P: r.pPist, d: dir, c: cyc }); if (pts.length > 900) pts.shift(); lastSnap = b;
            }
            // density profile in the piston's frame, averaged over the last ~2 time units
            const Xn = G.pist.X, nb = prof.length, cnt = new Float64Array(nb), a = Math.min(1, h / 2);
            for (let i = 0; i < G.N; i++) cnt[Math.min(nb - 1, Math.floor(G.x[i] / Xn * nb))]++;
            for (let k = 0; k < nb; k++) prof[k] = prof[k] * (1 - a) + a * cnt[k] / (G.N / nb);
          });
          const X = G.pist.X, nb = prof.length;
          drawGas(sc, G, { color: (i) => 'accent', rod: 5, pistonColor: dir < 0 ? 'red' : 'blue', fill: 'accent', fillAlpha: 0.04, len: X1 + 1.2 });
          sc.arrow(X + 2.4, L + 0.6, X + 2.4 + 2.2 * dir, L + 0.6, { color: dir < 0 ? 'red' : 'blue', width: 2.2 });
          sc.text(`stroke ${2 * cyc + (dir < 0 ? 1 : 2)} · insulated walls`, 0, -1.1, { size: 11.5, color: 'muted' });
          // P–V
          const pmax = adi(X2 * A) * (u > 0.6 ? 1.9 : 1.3);
          pv.setView([X2 * A * 0.92, X1 * A * 1.03], [0, pmax]);
          pv.fn(adi, { color: 'ink', dash: [6, 4], width: 1.6 });
          pv.text('quasistatic adiabat of this gas', X2 * A * 1.05 + 400, adi(X2 * A * 1.05 + 400), { dx: 10, size: 11.5, color: 'ink' });
          for (const p of pts) pv.dot(p.V, p.P, { r: 2.6, color: p.d < 0 ? 'red' : 'blue', alpha: p.c === cyc ? 0.95 : 0.3, ring: false });
          pv.vline(X * A, { color: 'faint', width: 1 });
          // density profile
          sd.setView([0, X1], [0, 3]);
          sd.hline(1, { color: 'ink', dash: [6, 4], width: 1.2 });
          const step = Array.from(prof).flatMap((q, k) => [[k * X / nb, q], [(k + 1) * X / nb, q]]);
          sd.poly([[0, 0], ...step, [X, 0]], { fill: 'accent', fillAlpha: 0.12, stroke: false });
          sd.path(step, { color: 'accent', width: 2.2 });
          sd.vline(X, { color: dir < 0 ? 'red' : 'blue', width: 3, alpha: 0.7 });
          sd.text('piston', X, 2.8, { dx: -5, align: 'right', size: 11, color: dir < 0 ? 'red' : 'blue' });
        }, { still: 8 });
        v.legend([['red', 'compression stroke'], ['blue', 'expansion stroke'], ['ink', 'quasistatic adiabat', { dash: true }]]);
        v.readout(() => {
          const r = rec[rec.length - 1], prev = rec.length > 1 ? rec[rec.length - 2] : null;
          const T = G.stats().T;
          const last = prev ? `last full cycle: work done on the gas $W$ = ${v.fix(r.W - prev.W, 2)} (= gain in internal energy ${v.fix(1.5 * N * (r.T - prev.T), 2)}), temperature ${v.fix(prev.T, 3)} → ${v.fix(r.T, 3)}` : 'first cycle running';
          return `${cyc} cycle${cyc === 1 ? '' : 's'} completed · now $kT$ = ${v.fix(T, 3)} (started at ${v.fix(Tstart, 3)}) · ${last} · piston speed / sound speed = ${v.fix(us.value / Math.sqrt(5 / 3 * T), 2)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.9
    {
      num: '1.9', kind: 'Definition', name: 'Work done on a gas',
      statement: String.raw`When a piston of area $A$ moves a distance $dx$ against the pressure $P$ of the gas, the work done **on** the gas is $-P\,A\,dx = -P\,dV$. Along a quasistatic process from state 1 to state 2,
$$W = -\int_{V_1}^{V_2} P\,dV,$$
positive when the gas is compressed ($dV < 0$) and negative when it expands and pushes on its surroundings. On the $P$–$V$ diagram $|W|$ is the area under the path. Work is **not** a state function: it depends on the path, not only on the endpoints, so one writes $\delta W$ (an inexact differential) for a small amount of it. Around a closed cycle the net work is minus the enclosed area (counted positive for a clockwise cycle, which delivers work to the surroundings).`,
      idea: String.raw`Work is force times displacement (mech 3.1): the gas pushes on the piston with force $PA$, so moving the piston by $dx$ transfers $PA\,dx = P\,dV$ from the gas to whatever holds the piston. Only for quasistatic processes is $P$ the gas's own equilibrium pressure; otherwise one must use the pressure actually acting on the piston (1.8). Because $P$ can be anything along the way — high while the gas expands, low while it is cooled — two paths between the same endpoints sweep different areas. This path dependence is what makes the first law (1.11) more than energy conservation in mechanics: work and heat are separately path dependent, and only their sum is not.`,
      caption: String.raw`Drag the end states A and B, choose a path between them — or bend the curved path by dragging C — and slide the state along it. The orange area under the path is the work done by the gas (here $W = -\int P\,dV$ is the work done *on* it, kPa·L = J). The cylinder shows the same state: piston height ∝ volume, the gauge ∝ pressure. The readout compares the four paths between the same endpoints. Switch on the return leg to close a cycle: only the enclosed area survives.`,
      deps: ['thermo-1.8', 'mech-3.1'],
      refs: ['Schroeder §1.5'],
      tags: ['work', 'PV diagram'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Work_(thermodynamics)' },
      viz(v) {
        const path = v.select('path', [{ value: 'PV', label: 'expand, then cool' }, { value: 'VP', label: 'cool, then expand' }, { value: 'line', label: 'straight' }, { value: 'curve', label: 'curved (drag C)' }], 'curve');
        const sS = v.slider('state along the path', 0, 1, 0.65, { step: 0.005 });
        const loop = v.toggle('return to A along the straight line', false);
        const sp = v.stage({ x: [0, 12], y: [0, 420], height: 340, axes: 'box', xlabel: 'V (L)', ylabel: 'P (kPa)', weight: 1.5, title: 'the work is the area under the path' });
        const sc = v.stage({ x: [0, 6], y: [-0.6, 9], height: 340, axes: false, weight: 0.75, equal: true });
        const con = { x: [0.6, 11.6], y: [20, 410] };
        const hA = sp.handle(2.5, 330, { color: 'accent', label: 'A', constrain: con });
        const hB = sp.handle(10, 90, { color: 'accent', label: 'B', constrain: con });
        const hC = sp.handle(3.2, 110, { color: 'purple', label: 'C', constrain: con });
        const pts = (kind) => {
          const A = [hA.x, hA.y], B = [hB.x, hB.y], n = 240, out = [];
          for (let i = 0; i <= n; i++) {
            const s = i / n;
            if (kind === 'line') out.push([lerp(A[0], B[0], s), lerp(A[1], B[1], s)]);
            else if (kind === 'curve') { const u = 1 - s; out.push([u * u * A[0] + 2 * u * s * hC.x + s * s * B[0], u * u * A[1] + 2 * u * s * hC.y + s * s * B[1]]); }
            else { const K = kind === 'PV' ? [B[0], A[1]] : [A[0], B[1]]; out.push(s < 0.5 ? [lerp(A[0], K[0], 2 * s), lerp(A[1], K[1], 2 * s)] : [lerp(K[0], B[0], 2 * s - 1), lerp(K[1], B[1], 2 * s - 1)]); }
          }
          return out;
        };
        const work = (P, upto = 1) => { let W = 0; const m = Math.round(upto * (P.length - 1)); for (let i = 1; i <= m; i++) W -= 0.5 * (P[i][1] + P[i - 1][1]) * (P[i][0] - P[i - 1][0]); return W; };
        v.render(() => {
          hC.visible = path.value === 'curve';
          const P = pts(path.value), m = Math.round(sS.value * (P.length - 1)), cur = P[m];
          // area under the traversed part
          for (let i = 1; i <= m; i++) { const a = P[i - 1], b = P[i]; if (Math.abs(b[0] - a[0]) < 1e-9) continue; sp.poly([[a[0], 0], a, b, [b[0], 0]], { fill: b[0] > a[0] ? 'orange' : 'red', fillAlpha: 0.3, stroke: false }); }
          if (loop.value) { const back = pts('line').slice().reverse(); sp.poly(P.concat(back), { fill: 'purple', fillAlpha: 0.22, stroke: false }); sp.path(back, { color: 'purple', width: 2, dash: [6, 4] }); }
          for (const k of ['PV', 'VP', 'line', 'curve']) if (k !== path.value) sp.path(pts(k), { color: 'faint', width: 1.2, dash: [3, 4] });
          sp.path(P, { color: 'accent', width: 3 });
          if (path.value === 'curve') { sp.line(hA.x, hA.y, hC.x, hC.y, { color: 'purple', width: 1, dash: [3, 3], alpha: 0.6 }); sp.line(hC.x, hC.y, hB.x, hB.y, { color: 'purple', width: 1, dash: [3, 3], alpha: 0.6 }); }
          sp.dot(cur[0], cur[1], { r: 6, color: 'gold' });
          const W = work(P, sS.value);
          sp.text(`W so far = ${v.fix(W, 0)} J`, cur[0], cur[1], { dx: 10, dy: -14, size: 12, weight: 600, color: 'ink' });
          // cylinder: piston height ∝ V, gauge ∝ P
          const hgt = 0.7 * cur[0];
          sc.rect(1, 0, 3.6, 8.6, { color: 'ink', width: 2 });
          sc.rect(1.05, 0.05, 3.55, hgt, { fill: 'accent', fillAlpha: 0.18, stroke: false });
          sc.dots(scatter(36, 3, 1.15, 0.15, 3.45, Math.max(0.3, hgt - 0.15)), { r: 2.4, color: 'accent', alpha: 0.75 });
          sc.rect(0.95, hgt, 3.65, hgt + 0.35, { fill: 'orange', fillAlpha: 0.7, color: 'orange', width: 1.2 });
          sc.line(2.3, hgt + 0.35, 2.3, hgt + 1.1, { color: 'orange', width: 3 });
          sc.arrow(2.3, hgt + 2.2, 2.3, hgt + 1.2, { color: 'red', width: 2.5 });
          sc.text('F = PA', 2.6, hgt + 1.75, { size: 11.5, color: 'red' });
          const gx = 4.9, gy = 2, gr = 0.75, ang = Math.PI * (1.25 - 1.5 * clamp(cur[1] / 420, 0, 1));
          sc.circle(gx, gy, gr, { color: 'ink', width: 1.6, fill: 'panel', fillAlpha: 1 });
          sc.line(gx, gy, gx + 0.65 * gr * Math.cos(ang), gy + 0.65 * gr * Math.sin(ang), { color: 'red', width: 2.2 });
          sc.line(3.6, 1.4, gx - gr, 1.6, { color: 'muted', width: 1.4 });
          sc.text(`${cur[1].toFixed(0)} kPa`, gx, gy - gr - 0.35, { align: 'center', size: 11.5 });
          sc.text(`${cur[0].toFixed(2)} L`, 2.3, -0.35, { align: 'center', size: 11.5, color: 'accent' });
        });
        v.legend([['accent', 'chosen path'], ['orange', 'area under the path = work done by the gas', { area: true }], ['purple', 'net work of the closed cycle', { area: true }]]);
        v.readout(() => {
          const ws = { PV: work(pts('PV')), VP: work(pts('VP')), line: work(pts('line')), curve: work(pts('curve')) };
          const cyc = loop.value ? ` · closed cycle: net work on the gas ${v.fix(ws[path.value] - ws.line, 0)} J (minus the purple area)` : '';
          return `work done on the gas from A to B, $W = -\\int P\\,dV$: expand-then-cool ${v.fix(ws.PV, 0)} J · cool-then-expand ${v.fix(ws.VP, 0)} J · straight ${v.fix(ws.line, 0)} J · curved ${v.fix(ws.curve, 0)} J — same endpoints, different work${cyc}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.10
    {
      num: '1.10', kind: 'Definition', name: 'Heat',
      statement: String.raw`**Heat** $Q$ is energy that crosses the boundary of a system because of a temperature difference, by microscopic means — molecular collisions at a wall (conduction), radiation, or the mixing of hot and cold fluid — without any macroscopic displacement of the boundary or other generalized coordinate. Energy transferred through a macroscopic displacement (a moving piston, a turning shaft) is **work**. Heat flows spontaneously from higher to lower temperature, and like work it is not a state function: a system *contains* internal energy, not heat, and one writes $\delta Q$ for a small amount of it. The SI unit is the joule; the old calorie (heat to warm 1 g of water by 1 K) is 4.184 J.`,
      idea: String.raw`At a wall between a hot and a cold gas every molecular impact is a tiny mechanical event — a push that moves the wall's atoms a little — but the pushes from the two sides average out to no net motion of the wall. Fast molecules from the hot side leave energy in the wall's jiggling, slow molecules on the cold side pick it up. Classifying this as heat rather than work is a matter of bookkeeping that the macroscopic observer can make: nothing she can see moves, yet energy passes, and it passes only from hot to cold. Historically heat was thought to be a fluid ("caloric") until Rumford's cannon boring (1798) and Joule's experiments (1.12) showed it to be a form of energy.`,
      caption: String.raw`A hot gas (left) and a cold gas (right) are separated by a loose plate that can rattle only within a slot one-third of a molecular diameter wide (colour = molecular speed). Every impact gives the plate a kick; the plate passes the energy across, but its average position never moves — so the energy that crosses is **heat**. The counter adds up the energy delivered to each side, impact by impact; watch it track the temperature changes. Make the plate heavier to slow the transfer, or fix it (insulating) to stop it.`,
      deps: ['thermo-1.1'],
      refs: ['Schroeder §1.4'],
      tags: ['heat', 'energy transfer'],
      credit: 'Black, 1760s (heat vs temperature); Rumford, 1798; Joule, 1840s',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat' },
      viz(v) {
        const L = 9, XP = 14, SLOT = 0.3, XR = XP + SLOT + 14;
        let G, hist, Ul0, Ur0, xmin, xmax;
        const Ms = v.slider('plate mass $M/m$', 1, 200, 6, { log: true, fmt: (x) => v.fix(x, 1), onChange: () => setMass() });
        const ins = v.toggle('insulating wall (plate fixed)', false, { onChange: () => setMass() });
        v.button('Start again', () => make());
        const sc = v.stage({ x: [-1, XR + 1], y: [-1.8, L + 1.4], equal: true, height: 230, axes: false, full: true });
        const sT = v.stage({ x: [0, 200], y: [0, 2.6], height: 260, axes: 'box', xlabel: 'time', ylabel: 'kT', title: 'temperatures of the two gases', weight: 1 });
        const sQ = v.stage({ x: [0, 200], y: [-60, 60], height: 260, axes: 'box', xlabel: 'time', ylabel: 'energy', title: 'energy that crossed the plate vs energy change of each side', weight: 1 });
        const setMass = () => { const P = G.plate; if (ins.value) { P.M = Infinity; P.U = 0; } else { P.M = Ms.value; } G.repredict(); };
        const make = () => {
          clock.kick(30);
          G = hsGas({ species: [{ m: 1, d: 1, T: 2.2 }, { m: 1, d: 1, T: 0.35 }], counts: [70, 70], side: [0, 1], Ly: L, Lz: L, rng: v.rng(61), piston: { X: XR }, plate: { X: XP + SLOT / 2, U: 0.02, M: ins.value ? Infinity : Ms.value, lo: XP, hi: XP + SLOT } });
          if (ins.value) G.plate.U = 0;
          G.repredict();
          hist = []; Ul0 = G.stats(0).U; Ur0 = G.stats(1).U; xmin = Infinity; xmax = -Infinity;
        };
        const clock = simClock(10, 0.05, 0);
        make();
        let tl = -1;
        v.animate((t) => {
          const add = clock(t, () => make());
          runBudget(G, add, 0.25, clock.ms(), () => {
            xmin = Math.min(xmin, G.plate.X); xmax = Math.max(xmax, G.plate.X);
            if (G.t - tl >= 1) { tl = G.t; const a = G.stats(0), b = G.stats(1); hist.push([G.t, a.T, b.T, G.Ep[1], b.U - Ur0, -(a.U - Ul0)]); if (hist.length > 1500) hist.shift(); }
          });
          const rp = tRamp(v);
          drawGas(sc, G, { color: (i) => pick(rp, Math.hypot(G.vx[i], G.vy[i], G.vz[i]) / 3.6), piston: false, len: XR, plateColor: ins.value ? 'muted' : 'orange' });
          sc.rect(XP, -0.35, XP + SLOT, -0.1, { fill: 'muted', fillAlpha: 0.6, stroke: false }); sc.rect(XP, L + 0.1, XP + SLOT, L + 0.35, { fill: 'muted', fillAlpha: 0.6, stroke: false });
          const a = G.stats(0), b = G.stats(1);
          sc.text(`hot side  kT = ${v.fix(a.T, 2)}`, 0.2, -1.05, { size: 12, color: 'red', weight: 600 });
          sc.text(`cold side  kT = ${v.fix(b.T, 2)}`, XR - 0.2, -1.05, { size: 12, color: 'blue', weight: 600, align: 'right' });
          sc.text(ins.value ? 'fixed plate' : 'rattling plate', XP + SLOT / 2, L + 0.85, { size: 11, color: ins.value ? 'muted' : 'orange', align: 'center' });
          const tmax = Math.max(200, G.t);
          sT.setView([Math.max(0, tmax - 200), tmax], [0, 2.6]);
          sT.path(hist.map((p) => [p[0], p[1]]), { color: 'red', width: 2.2 });
          sT.path(hist.map((p) => [p[0], p[2]]), { color: 'blue', width: 2.2 });
          const Tm = (a.U + b.U) / (a.f / 2 + b.f / 2);
          sT.hline(Tm, { color: 'green', dash: [6, 4], width: 1.2 });
          sT.text('common final T', tmax - 3, Tm, { align: 'right', dy: -9, color: 'green', size: 11.5 });
          const qm = Math.max(30, ...hist.map((p) => Math.abs(p[3]))) * 1.15;
          sQ.setView([Math.max(0, tmax - 200), tmax], [-0.12 * qm, qm]);
          sQ.hline(0, { color: 'faint', width: 1 });
          sQ.path(hist.map((p) => [p[0], p[4]]), { color: 'blue', width: 4, alpha: 0.35 });
          sQ.path(hist.map((p) => [p[0], p[5]]), { color: 'red', width: 2, dash: [5, 3] });
          sQ.path(hist.map((p) => [p[0], p[3]]), { color: 'ink', width: 1.6 });
        }, { still: 9 });
        v.legend([['ink', 'Q: energy handed over by the plate, impact by impact'], ['blue', 'gain of the cold gas'], ['red', 'loss of the hot gas', { dash: true }]]);
        v.readout(() => {
          const a = G.stats(0), b = G.stats(1), Q = G.Ep[1];
          const ke = G.plate.M < Infinity ? 0.5 * G.plate.M * G.plate.U ** 2 : 0;
          return `heat delivered to the cold side $Q$ = ${v.fix(Q, 2)} · its energy rose by ${v.fix(b.U - Ur0, 2)}; the hot side lost ${v.fix(Ul0 - a.U, 2)} (difference = plate's own kinetic energy ${v.fix(ke, 2)}) · plate stayed within ${isFinite(xmin) ? v.fix(xmax - xmin, 2) : '0'} σ of its slot — no macroscopic displacement, so no work · ${ins.value ? 'insulating: nothing crosses' : 'heat flows from hot to cold only'}`;
        });
      },
    },
  ],
};
