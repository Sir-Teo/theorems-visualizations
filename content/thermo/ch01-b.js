// Thermodynamics & Statistical Mechanics — Chapter 1 (part b): the first law and its applications
import { clamp, lerp, hsGas, ramp, pick, drawGas, LJ, B2, runBudget, simClock, tRamp, scatter, fitLine } from './ch01.shared.js';

// ---------- helpers for this part ----------
const R = 8.314462618;
/** Heat (red/blue) along a straight segment of an ideal-gas process: dQ = (f/2 + 1) P dV + (f/2) V dP. */
function segLedger(a, b, f) {
  const W = -0.5 * (a[1] + b[1]) * (b[0] - a[0]), dU = f / 2 * (b[0] * b[1] - a[0] * a[1]);
  return { W, dU, Q: dU - W };
}
/** Vibrational heat capacity (units of k) of one mode with temperature θ. */
const cvib = (th, T) => { const x = th / T; if (x > 60) return 0; const e = Math.exp(x); return x * x * e / ((e - 1) * (e - 1)); };
/** Rotational heat capacity (units of k) of a linear rotor from the level sum over J in `parity` ('all' | 'even' | 'odd'). */
function crotSum(th, T, parity = 'all') {
  if (T > 25 * th && parity === 'all') return 1;
  let z = 0, e1 = 0, e2 = 0;
  for (let J = parity === 'odd' ? 1 : 0; J < 400; J += parity === 'all' ? 1 : 2) {
    const E = J * (J + 1) * th, w = (2 * J + 1) * Math.exp(-E / T); if (w < 1e-300 && J > 5) break;
    z += w; e1 += w * E; e2 += w * E * E;
  }
  const m = e1 / z; return (e2 / z - m * m) / (T * T);
}
// Molecules for 1.15: rotational and vibrational temperatures (K), boiling (or sublimation) point at 1 atm
const GASES = {
  He: { tex: '\\mathrm{He}', rot: 0, vib: [], bp: 4.2, col: 'teal' },
  N2: { tex: '\\mathrm{N_2}', rot: 'lin', thr: 2.88, vib: [3374], bp: 77.4, col: 'accent' },
  H2: { tex: '\\mathrm{H_2}', rot: 'H2', thr: 85.3, vib: [6332], bp: 20.3, col: 'pink' },
  Cl2: { tex: '\\mathrm{Cl_2}', rot: 'lin', thr: 0.351, vib: [805], bp: 239.1, col: 'green' },
  CO2: { tex: '\\mathrm{CO_2}', rot: 'lin', thr: 0.561, vib: [960, 960, 1920, 3380], bp: 194.7, col: 'red' },
  H2O: { tex: '\\mathrm{H_2O}', rot: 'nonlin', thr: 20, vib: [2295, 5262, 5404], bp: 373.1, col: 'blue' },
};
function cvParts(g, T) {
  const G = GASES[g];
  let rot = 0;
  if (G.rot === 'lin') rot = crotSum(G.thr, T);
  else if (G.rot === 'nonlin') rot = 1.5;
  else if (G.rot === 'H2') rot = 0.25 * crotSum(G.thr, T, 'even') + 0.75 * crotSum(G.thr, T, 'odd');
  const vib = G.vib.reduce((s, th) => s + cvib(th, T), 0);
  return { tr: 1.5, rot, vib, cv: 1.5 + rot + vib };
}
// US Standard Atmosphere 1976 below 86 km (geopotential altitude in km, lapse rate K/km)
const USSA = [[0, -6.5], [11, 0], [20, 1], [32, 2.8], [47, 0], [51, -2.8], [71, -2], [84.852, 0]];
const g0 = 9.80665, Mair = 0.0289644, cpAir = 1004.7;
function ussa(z) {
  let T = 288.15, P = 101325;
  for (let k = 0; k < USSA.length - 1; k++) {
    const [h0, L] = USSA[k], h1 = USSA[k + 1][0], dz = Math.min(z, h1) - h0;
    if (dz <= 0) break;
    const T1 = T + L * dz;
    P = L === 0 ? P * Math.exp(-g0 * Mair * dz * 1000 / (R * T)) : P * (T / T1) ** (g0 * Mair / (R * L / 1000));
    T = T1;
    if (z <= h1) break;
  }
  return { T, P };
}

export default {
  collection: 'thermo',
  chapter: 1,
  items: [
    // ------------------------------------------------------------------ 1.11
    {
      num: '1.11', kind: 'Law', name: 'First law of thermodynamics',
      statement: String.raw`Every system has an **internal energy** $U$, a function of its equilibrium state alone, and in any process that takes a closed system from one equilibrium state to another
$$\Delta U = Q + W,$$
where $Q$ is the heat put into the system and $W$ the work done on it (engineers often write $\Delta U = Q - W_{\text{by}}$ with $W_{\text{by}} = -W$ the work done by the system). For an infinitesimal step, $dU = \delta Q + \delta W$; the heat and the work separately depend on the path, but their sum does not. An isolated system has constant $U$; around any cycle $\oint dU = 0$, so the net heat taken in equals the net work delivered. For an ideal gas $U$ depends only on $T$: $U = \tfrac f2 NkT$.`,
      idea: String.raw`The first law is energy conservation (mech 3.6) extended to systems whose microscopic motion we do not follow. The molecules' kinetic and potential energy is $U$; work changes it through macroscopic displacements and heat through microscopic exchanges at the boundary (1.9, 1.10). What makes it a law rather than a definition is Joule's discovery (1.12) that the *same* change of state always costs the same total energy, however it is split between work and heat — so $U$ is well defined. On a $P$–$V$ diagram this is visible: along any path the areas (work) and the heats differ, yet every path between two points crosses the same contours of $U$.`,
      caption: String.raw`An ideal gas (0.4 mol) is taken from A to B along three straight legs; drag the corners $C_1$ and $C_2$ (and A, B). The background contours are lines of constant internal energy $U = \tfrac f2 PV$. Along the path, red means heat is flowing in, blue out — the colour can switch in mid-leg, where the leg touches an adiabat. The ledger shows $Q$, $W$ and $\Delta U$ for each leg and in total: $Q$ and $W$ jump around as you reshape the path, but $Q + W$ always equals $U_B - U_A$. Close the cycle and $\Delta U = 0$, so $Q = -W$.`,
      deps: ['thermo-1.9', 'thermo-1.10', 'mech-3.6'],
      refs: ['Schroeder §1.4', 'Kardar §1.3'],
      tags: ['first law', 'energy'],
      credit: 'Mayer, 1842; Joule, 1843–50; Helmholtz, 1847; Clausius, 1850',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/First_law_of_thermodynamics' },
      viz(v) {
        const n = 0.4;
        const gas = v.select('gas', [{ value: 3, label: 'monatomic ($f$ = 3)' }, { value: 5, label: 'diatomic ($f$ = 5)' }], 3);
        const loop = v.toggle('close the cycle (B → A)', false);
        const sp = v.stage({ x: [0, 12], y: [0, 400], height: 340, axes: 'box', xlabel: 'V (L)', ylabel: 'P (kPa)', weight: 1.35, title: 'path on the $P$–$V$ plane over contours of $U$' });
        const sl = v.stage({ x: [0, 5], y: [-1, 1], height: 340, axes: 'box', ylabel: 'energy (J)', weight: 1, title: 'ledger: $Q$, $W$ and $\\Delta U$', xticks: [[0.5, 'leg 1'], [1.5, 'leg 2'], [2.5, 'leg 3'], [3.5, 'leg 4'], [4.5, 'total']] });
        const con = { x: [0.6, 11.6], y: [20, 390] };
        const hA = sp.handle(2.5, 300, { color: 'ink', label: 'A', constrain: con });
        const h1 = sp.handle(2.5, 110, { color: 'purple', label: 'C₁', constrain: con });
        const h2 = sp.handle(6.5, 330, { color: 'purple', label: 'C₂', constrain: con });
        const hB = sp.handle(10, 150, { color: 'ink', label: 'B', constrain: con });
        const legs = () => { const P = [[hA.x, hA.y], [h1.x, h1.y], [h2.x, h2.y], [hB.x, hB.y]]; if (loop.value) P.push([hA.x, hA.y]); return P; };
        let res = null;
        v.render(() => {
          const f = +gas.value, P = legs();
          const levels = []; for (let u = 500; u < 7000; u += 500) levels.push(u);
          sp.contour((V, p) => f / 2 * V * p, levels, { color: 'faint', width: 1, labels: true, fmt: (u) => `${u} J`, res: 80 });
          const segs = [];
          for (let k = 0; k + 1 < P.length; k++) {
            const a = P[k], b = P[k + 1], L = segLedger(a, b, f); segs.push(L);
            const m = 40; let run = [a], sg = null;
            for (let i = 1; i <= m; i++) {
              const s0 = (i - 0.5) / m, Vm = lerp(a[0], b[0], s0), Pm = lerp(a[1], b[1], s0), dq = (f / 2 + 1) * Pm * (b[0] - a[0]) + f / 2 * Vm * (b[1] - a[1]);
              const g = dq >= 0 ? 1 : -1, q = [lerp(a[0], b[0], i / m), lerp(a[1], b[1], i / m)];
              if (sg !== null && g !== sg) { sp.path(run, { color: sg > 0 ? 'red' : 'blue', width: 3.4 }); const last = run[run.length - 1]; run = [last]; sp.dot(last[0], last[1], { r: 3.5, color: 'ink' }); }
              sg = g; run.push(q);
            }
            sp.path(run, { color: sg > 0 ? 'red' : 'blue', width: 3.4 });
            const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            sp.text(String(k + 1), mid[0], mid[1], { dx: 9, dy: -9, size: 11.5, color: 'muted', weight: 600 });
          }
          const tot = segs.reduce((s, L) => ({ Q: s.Q + L.Q, W: s.W + L.W, dU: s.dU + L.dU }), { Q: 0, W: 0, dU: 0 });
          res = { segs, tot, UA: f / 2 * hA.x * hA.y, UB: f / 2 * hB.x * hB.y };
          // ledger bars
          const all = segs.concat([tot]), mx = Math.max(200, ...all.flatMap((L) => [Math.abs(L.Q), Math.abs(L.W), Math.abs(L.dU)])) * 1.18;
          sl.setView([0, 5], [-mx, mx]);
          sl.hline(0, { color: 'muted', width: 1 });
          all.forEach((L, k) => {
            const x = k < segs.length ? k + 0.5 : 4.5;
            [[L.Q, L.Q >= 0 ? 'red' : 'blue', -0.25], [L.W, 'orange', 0], [L.dU, 'green', 0.25]].forEach(([val, c, dx]) => sl.rect(x + dx - 0.11, 0, x + dx + 0.11, val, { fill: c, fillAlpha: 0.75, color: c, width: 1 }));
          });
          sl.vline(4, { color: 'faint', width: 1, dash: [4, 4] });
        });
        v.legend([['red', 'heat in ($Q$ > 0)'], ['blue', 'heat out'], ['orange', 'work on the gas $W$', { area: true }], ['green', '$\\Delta U$', { area: true }]]);
        v.readout(() => {
          if (!res) return '';
          const { tot, UA, UB } = res;
          return `total $Q$ = ${v.fix(tot.Q, 0)} J, total $W$ = ${v.fix(tot.W, 0)} J → $Q + W$ = ${v.fix(tot.Q + tot.W, 1)} J · $U_B - U_A = \\tfrac f2(P_BV_B - P_AV_A)$ = ${v.fix(loop.value ? 0 : UB - UA, 1)} J · ${loop.value ? 'closed cycle: net heat in = net work out' : 'reshape the path: Q and W change, their sum does not'} · $T_A$ = ${v.fix(hA.x * hA.y / (n * R), 0)} K, $T_B$ = ${v.fix(hB.x * hB.y / (n * R), 0)} K`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.12
    {
      num: '1.12', kind: 'Phenomenon', name: 'Joule’s paddle-wheel experiment',
      statement: String.raw`Mechanical work dissipated in a thermally insulated body raises its temperature exactly as heating does: a given amount of work always produces the same temperature rise, whatever the means — a paddle churning water, iron rings rubbing under mercury, an electric current in a wire. The ratio of work to the heat it is equivalent to is a universal constant, the **mechanical equivalent of heat**. Joule's 1850 value from stirring water was 772.692 foot-pounds per pound of water per degree Fahrenheit, i.e. about 4.157 J per calorie, within 0.7% of the modern 4.184 J/cal (thermochemical calorie); with heat measured in joules, as today, the constant is 1 and the experiment becomes the statement $\Delta U = W$ for an adiabatic system.`,
      idea: String.raw`If heat were a conserved fluid (caloric), stirring could not create it. Joule's apparatus let two lead weights fall about 1.6 m, twenty times in succession, unwinding cords that turned a brass paddle wheel in an insulated copper vessel of water; fixed vanes on the vessel kept the water from simply swirling along, so the work went into fluid friction. He measured the temperature rise (about half a degree Fahrenheit) with thermometers he could read to a few thousandths of a degree, and corrected for the weights' kinetic energy on landing, the stretch of the cords and heat exchanged with the room. Because the same work gives the same rise by every route, internal energy is a state function and the first law (1.11) follows.`,
      caption: String.raw`A recreation of Joule's first series (1850), with his numbers: two lead weights totalling 58.02 lb (26.3 kg) fall 63 in (1.60 m) twenty times; the water and vessel are equivalent to 13.92 lb (6.32 kg) of water. Watch the paddles churn and the thermometer climb with each fall. The right panel plots temperature rise against work: the line is today's 4.184 J/cal, the ring is Joule's measured mean (0.563 °F after 20 falls). Switch to the **electric heater** delivering the same energy: the water warms identically. Change the weights to scale the work.`,
      deps: ['thermo-1.11'],
      refs: ['Schroeder §1.4', 'Joule, Phil. Trans. R. Soc. 140, 61 (1850)', 'Young, Phil. Trans. R. Soc. A 373 (2015) commentary'],
      tags: ['first law', 'history of physics'],
      credit: 'Joule, 1845–1850',
      scope: String.raw`The equivalence holds for any adiabatic process between the same states; Joule's own uncertainty was a few tenths of a percent, and his value is about 0.6% below today's.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mechanical_equivalent_of_heat' },
      viz(v) {
        const LB = 0.45359237, IN = 0.0254, H = 63.0 * IN, NF = 20, CW = 13.924 * LB * 4184, FALL = 1.15;
        const JOULE = { W: 772.692 * 7.842299 * 1.3558179, dT: 0.563209 * 5 / 9 };   // corrected work (J) and mean rise (K), Series 1
        const mode = v.select('energy source', [{ value: 'paddle', label: 'falling weights + paddle' }, { value: 'heater', label: 'electric heater' }], 'paddle');
        const mw = v.slider('each weight', 10, 40, 29.011, { step: 0.5, fmt: (x) => `${v.fix(x, 1)} lb (${v.fix(x * LB, 2)} kg)` });
        const sa = v.stage({ x: [0, 10], y: [0, 7.4], height: 330, axes: false, equal: true, weight: 1.15 });
        const sp = v.stage({ x: [0, 9500], y: [0, 0.4], height: 330, axes: 'box', xlabel: 'work or electrical energy delivered (J)', ylabel: 'temperature rise (K)', title: 'temperature rise per joule', weight: 1 });
        let state = { n: 0, frac: 0, done: false };
        const per = () => 2 * mw.value * LB * g0 * H;  // J per fall
        v.animate((t) => {
          const tt = Math.min(t, NF * FALL), n = Math.floor(tt / FALL + 1e-9), frac = n >= NF ? 0 : (tt - n * FALL) / FALL;
          state = { n, frac, done: n >= NF };
          const W = (n + frac) * per(), dT = W / CW, heater = mode.value === 'heater';
          // --- apparatus
          sa.rect(2.7, 0.35, 7.3, 4.05, { fill: 'orange', fillAlpha: 0.08, color: 'muted', width: 1.2 });
          sa.text('insulating box', 7.25, 4.25, { size: 10.5, color: 'muted', align: 'right' });
          sa.rect(3.1, 0.6, 6.9, 3.75, { color: 'orange', width: 2.4 });
          sa.rect(3.18, 0.68, 6.82, 3.3, { fill: 'blue', fillAlpha: 0.16, stroke: false });
          sa.line(3.18, 3.3, 6.82, 3.3, { color: 'blue', width: 1.2, alpha: 0.6 });
          for (const y of [1.0, 1.75, 2.5]) { sa.rect(3.18, y, 3.55, y + 0.12, { fill: 'muted', fillAlpha: 0.8, stroke: false }); sa.rect(6.45, y, 6.82, y + 0.12, { fill: 'muted', fillAlpha: 0.8, stroke: false }); }
          const fallen = heater ? 0 : (n + frac) * H, phi = fallen / 0.05;
          sa.line(5, 0.8, 5, 5.9, { color: 'ink', width: 2.2 });
          for (const y of [1.3, 2.05, 2.8]) for (let k = 0; k < 4; k++) {
            const a = phi + k * Math.PI / 4, c = Math.cos(a), depth = Math.sin(a);
            sa.rect(5 + Math.min(0, 1.3 * c), y, 5 + Math.max(0, 1.3 * c), y + 0.22, { fill: 'gold', fillAlpha: 0.45 + 0.4 * (depth > 0 ? 1 : 0.3), color: 'gold', width: 1 });
          }
          sa.rect(4.65, 5.15, 5.35, 5.75, { fill: 'muted', fillAlpha: 0.7, color: 'ink', width: 1.2 });
          const yw = heater ? 6.0 : 6.0 - frac * 4.6 - 0;
          for (const [px, sgn] of [[1.2, -1], [8.8, 1]]) {
            sa.line(5 + 0.35 * sgn, 5.45, px, 6.75, { color: 'ink', width: 1.1 });
            sa.circle(px, 6.45, 0.3, { color: 'ink', width: 1.6, fill: 'panel', fillAlpha: 1 });
            const wx = px + 0.3 * sgn;
            sa.line(wx, 6.45, wx, yw + 0.45, { color: 'ink', width: 1.1 });
            sa.rect(wx - 0.32, yw - 0.45, wx + 0.32, yw + 0.45, { fill: 'gray', fillAlpha: 0.85, color: 'ink', width: 1.2 });
            sa.text(`${v.fix(mw.value, 0)} lb`, wx, yw, { align: 'center', size: 10, color: 'panel', halo: false, weight: 600 });
          }
          sa.line(0.2, 0.35, 2.4, 0.35, { color: 'muted', width: 2 }); sa.line(7.6, 0.35, 9.8, 0.35, { color: 'muted', width: 2 });
          if (!heater) sa.measure(0.35, 6.0 + 0.45, 0.35, 1.4 + 0.45, '63 in', { color: 'muted', math: false, size: 10.5, offset: -16 });
          if (heater) {
            const pts = []; for (let k = 0; k <= 16; k++) pts.push([4.2 + k * 0.1, 1.2 + (k % 2 ? 0.35 : 0)]);
            sa.path(pts, { color: 'red', width: 2.6, alpha: state.done ? 0.4 : 0.95 });
            sa.line(4.2, 1.2, 4.2, 4.6, { color: 'red', width: 1.4 }); sa.line(5.8, 1.2, 5.8, 4.6, { color: 'red', width: 1.4 });
            sa.text('I²R heating', 5, 4.85, { align: 'center', size: 11, color: 'red', weight: 600 });
          }
          // thermometer
          const yb = 1.4, ytop = 6.3, ys = (d) => yb + 0.3 + (ytop - yb - 0.4) * clamp(d / 0.4, 0, 1);
          sa.rect(6.05, yb, 6.25, ytop, { color: 'muted', width: 1.1, fill: 'panel', fillAlpha: 1 });
          sa.rect(6.09, yb, 6.21, ys(dT), { fill: 'red', fillAlpha: 0.85, stroke: false });
          sa.circle(6.15, yb, 0.16, { fill: 'red', fillAlpha: 0.9, stroke: false });
          for (const d of [0.1, 0.2, 0.3]) { sa.line(6.25, ys(d), 6.4, ys(d), { color: 'muted', width: 1 }); sa.text(`+${d} K`, 6.45, ys(d), { size: 9.5, color: 'muted' }); }
          sa.text(`falls: ${Math.min(n, NF)} / ${NF}`, 0.2, 7.15, { size: 12, weight: 600 });
          sa.text(`ΔT = ${v.fix(dT, 4)} K = ${v.fix(dT * 1.8, 4)} °F`, 9.8, 7.15, { size: 12, weight: 600, align: 'right', color: 'red' });
          // --- plot
          sp.fn((x) => x / CW, { color: 'green', width: 2, domain: [0, 9500] });
          sp.fn((x) => x / (CW * 4.1574 / 4.184), { color: 'muted', width: 1.2, dash: [5, 4], domain: [0, 9500] });
          sp.text('today: 4.184 J/cal', 9300, 9300 / CW, { align: 'right', dy: 14, color: 'green', size: 11.5 });
          sp.text('Joule’s 4.157 J/cal', 9300, 9300 / (CW * 4.1574 / 4.184), { align: 'right', dy: -12, color: 'muted', size: 11.5 });
          for (let k = 1; k <= Math.min(n, NF); k++) sp.dot(k * per(), k * per() / CW, { r: 3, color: heater ? 'red' : 'gold' });
          sp.dot(W, dT, { r: 5.5, color: heater ? 'red' : 'gold' });
          sp.dot(JOULE.W, JOULE.dT, { r: 6, hollow: true, color: 'ink', width: 2 });
          sp.text('Joule 1850 (mean of series 1)', JOULE.W, JOULE.dT, { align: 'right', dx: -10, dy: -2, size: 11, color: 'ink' });
        }, { still: NF * FALL + 0.5, period: NF * FALL + 2.5 });
        v.legend([['gold', 'paddle wheel (work)', { dot: true }], ['red', 'electric heater', { dot: true }], ['green', 'ΔT = W / C at 4.184 J/cal'], ['ink', 'Joule’s measurement', { dot: true }]]);
        v.readout(() => {
          const W = (state.n + state.frac) * per(), dT = W / CW, ftlb = W / 1.3558179;
          return `work so far $W$ = ${v.fix(W, 0)} J (${v.fix(ftlb, 0)} ft·lbf), water equivalent 6.32 kg → $\\Delta T$ = ${v.fix(dT, 4)} K · $W/(m c\\,\\Delta T)$ = 4.184 J/cal by construction · Joule (1850): 772.692 ft·lbf raise 1 lb of water by 1 °F, i.e. ${v.fix(772.692 * 1.3558179 / (LB * 1000 * 5 / 9), 3)} J/cal — ${v.fix(100 * (1 - 4.1574 / 4.184), 2)}% below 4.184 · his 20 falls: ${v.fix(JOULE.W, 0)} J (corrected) for ${v.fix(JOULE.dT, 4)} K`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.13
    {
      num: '1.13', kind: 'Definition', name: 'Heat capacities',
      statement: String.raw`The **heat capacity** of a system is the heat needed per unit temperature rise, $C = \delta Q/dT$; since heat depends on the path, so does $C$. At constant volume no work is done, so
$$C_V = \left(\frac{\partial U}{\partial T}\right)_V ;$$
at constant pressure the system also does work $P\,dV$ on its surroundings, so
$$C_P = \left(\frac{\partial U}{\partial T}\right)_P + P\left(\frac{\partial V}{\partial T}\right)_P = \left(\frac{\partial H}{\partial T}\right)_P .$$
Per unit mass they are **specific heats**, per mole **molar heat capacities**. For an ideal gas with $f$ quadratic degrees of freedom per molecule, $U = \tfrac f2 NkT$ gives $C_V = \tfrac f2 Nk$ (3/2 for a monatomic gas, 5/2 for a diatomic one at room temperature).`,
      idea: String.raw`By the first law (1.11) the heat put in is $dU - \delta W = dU + P\,dV$. Holding $V$ fixed sends all of it into internal energy. Letting the gas expand against a constant pressure diverts part of it into lifting the piston, so more heat is needed for the same temperature rise and $C_P > C_V$. For molecules that can rotate, collisions share the added energy between translation (which is what the temperature measures) and rotation, which is why diatomic gases need more heat per degree than monatomic ones.`,
      caption: String.raw`Two cylinders of the same simulated gas receive heat at the same steady rate: the top one has a fixed lid, the bottom one a free piston held by a constant outside pressure. The temperature is read from the molecules' translational kinetic energy only, as a thermometer would. Watch the bottom piston rise and its temperature lag behind; the plot of $T$ against heat delivered gives each heat capacity as an inverse slope. Switch to **diatomic** molecules, which carry extra (rotational) energy: both slopes flatten, from 3/2 and 5/2 to 5/2 and 7/2 (in units of $Nk$).`,
      deps: ['thermo-1.11'],
      refs: ['Schroeder §1.6'],
      tags: ['heat capacity', 'first law'],
      credit: 'Black, 1760s; Delaroche & Bérard (gases), 1813',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Heat_capacity' },
      viz(v) {
        const L = 9, A = L * L, N = 100, XV = 25, X0 = 12, T0 = 0.6, POW = 2.4, TH = 230;
        const P0 = N * T0 / (X0 * A);
        let G, tr, t0;
        const gas = v.select('molecules', [{ value: 0, label: 'monatomic' }, { value: 2, label: 'diatomic (rotating)' }], 0, { onChange: () => make() });
        v.button('Start again', () => make());
        const sc = v.stage({ x: [-1.5, 47], y: [-2.2, 22.4], equal: true, height: 300, axes: false, full: true });
        const sT = v.stage({ x: [0, 560], y: [0.4, 2.4], height: 280, axes: 'box', xlabel: 'heat delivered Q (units of kT₀)', ylabel: 'translational kT', title: 'temperature against heat delivered', weight: 1.25 });
        const sb = v.stage({ x: [0, 2], y: [0, 1], height: 280, axes: 'box', ylabel: 'energy', xticks: [[0.5, 'fixed volume'], [1.5, 'constant pressure']], title: 'where the heat went', weight: 1 });
        const make = () => {
          const dof = +gas.value, sp = [{ m: 1, d: 0.6, dof, T: T0 }];
          G = [hsGas({ species: sp, counts: [N], Ly: L, Lz: L, rng: v.rng(71 + dof), piston: { X: XV }, diffuse: [1, 0, 1, 1, 1, 1] }),
               hsGas({ species: sp, counts: [N], Ly: L, Lz: L, rng: v.rng(72 + dof), piston: { X: X0, M: 30, F: P0 * A, lo: 4, hi: 44 }, diffuse: [1, 0, 1, 1, 1, 1] })];
          tr = [[], []]; t0 = G[0].t;
          G.forEach((g) => { g.Qin = 0; g.U0 = g.stats().U; g.X0 = g.pist.X; g.W0 = g.Wp; g.Tacc = 0; g.nacc = 0; });
        };
        make();
        const clock = simClock(12, 0.05, 0);
        v.animate((t) => {
          const add = clock(t, () => make());
          const tStart = performance.now();
          let done = 0;
          while (done < add - 1e-9) {
            const h = Math.min(0.25, add - done);
            for (const g of G) {
              if (g.t < TH) { const q = POW * h; g.heat(q); g.Qin += q; }
              g.advance(h);
              const st = g.stats(); g.Tacc += st.Ttr * h; g.nacc += h;
            }
            done += h;
            if (G[0].t - (tr[0].length ? tr[0][tr[0].length - 1][2] : -9) >= 2) G.forEach((g, k) => { tr[k].push([g.Qin, g.Tacc / g.nacc, g.t]); g.Tacc = 0; g.nacc = 0; });
            if (performance.now() - tStart > clock.ms()) break;
          }
          const rp = tRamp(v), colOf = (g) => (i) => pick(rp, Math.hypot(g.vx[i], g.vy[i], g.vz[i]) / 3.4);
          drawGas(sc, G[0], { x0: 0, y0: 12.2, piston: false, len: XV, color: colOf(G[0]), leftColor: 'red', leftWidth: 2.4 });
          drawGas(sc, G[1], { x0: 0, y0: 0, rod: 0, len: 44, color: colOf(G[1]) });
          const Xp = G[1].pist.X;
          for (const yy of [2.2, 4.5, 6.8]) sc.arrow(Xp + 4.2, yy, Xp + 1.6, yy, { color: 'muted', width: 1.6, head: 7 });
          sc.text('constant outside pressure', Xp + 2, L + 0.8, { size: 11, color: 'muted' });
          sc.text('fixed volume', 0, 12.2 + L + 0.8, { size: 11.5, color: 'ink', weight: 600 });
          sc.text('constant pressure (free piston)', 0, -1.2, { size: 11.5, color: 'ink', weight: 600 });
          const heating = G[0].t < TH;
          sc.text(heating ? 'heater on' : 'heater off', XV + 1, 12.2 + L / 2, { size: 11.5, color: heating ? 'red' : 'muted', weight: 600 });
          // T vs Q
          const f = 3 + +gas.value, Qmax = POW * TH;
          sT.setView([0, Qmax * 1.04], [0.4, f === 3 ? 2.6 : 2.0]);
          sT.fn((Q) => T0 + Q / (f / 2 * N), { color: 'red', width: 1.4, dash: [6, 4], domain: [0, Qmax] });
          sT.fn((Q) => T0 + Q / ((f / 2 + 1) * N), { color: 'blue', width: 1.4, dash: [6, 4], domain: [0, Qmax] });
          sT.path(tr[0].map((p) => [p[0], p[1]]), { color: 'red', width: 2.2 });
          sT.path(tr[1].map((p) => [p[0], p[1]]), { color: 'blue', width: 2.2 });
          sT.text(`slope 1/C_V,  C_V = ${f}/2 Nk`, Qmax * 0.62, T0 + Qmax * 0.62 / (f / 2 * N), { dx: -8, dy: -12, align: 'right', color: 'red', size: 11.5 });
          sT.text(`C_P = ${f + 2}/2 Nk`, Qmax * 0.8, T0 + Qmax * 0.8 / ((f / 2 + 1) * N), { dy: 14, color: 'blue', size: 11.5 });
          // where the heat went
          const s0 = G[0].stats(), s1 = G[1].stats();
          const dU0 = s0.U - G[0].U0, dU1 = s1.U - G[1].U0, Wby = -(G[1].Wp - G[1].W0);
          const top = Math.max(50, G[0].Qin) * 1.15;
          sb.setView([0, 2], [0, top]);
          sb.rect(0.25, 0, 0.75, Math.max(0, dU0), { fill: 'green', fillAlpha: 0.7, color: 'green', width: 1 });
          sb.rect(1.25, 0, 1.75, Math.max(0, dU1), { fill: 'green', fillAlpha: 0.7, color: 'green', width: 1 });
          sb.rect(1.25, Math.max(0, dU1), 1.75, Math.max(0, dU1) + Math.max(0, Wby), { fill: 'orange', fillAlpha: 0.7, color: 'orange', width: 1 });
          sb.hline(G[0].Qin, { color: 'red', dash: [5, 4], width: 1.4 });
          sb.text(`heat in ${v.fix(G[0].Qin, 0)}`, 1.98, G[0].Qin, { align: 'right', dy: -9, size: 11, color: 'red' });
          if (dU1 > 8) sb.text('ΔU', 1.5, dU1 / 2, { align: 'center', size: 11.5, color: 'panel', halo: false, weight: 600 });
          if (Wby > 8) sb.text('work', 1.5, dU1 + Wby / 2, { align: 'center', size: 11.5, color: 'panel', halo: false, weight: 600 });
          if (dU0 > 8) sb.text('ΔU', 0.5, dU0 / 2, { align: 'center', size: 11.5, color: 'panel', halo: false, weight: 600 });
        }, { still: 8 });
        v.legend([['red', 'fixed volume'], ['blue', 'constant pressure'], ['green', 'internal energy gained', { area: true }], ['orange', 'work done lifting the piston', { area: true }]]);
        v.readout(() => {
          const fit = (k) => { const pts = tr[k].filter((p) => p[2] > 20 && p[2] <= TH); if (pts.length < 4) return NaN; return 1 / fitLine(pts.map((p) => p[0]), pts.map((p) => p[1])).b / N; };
          const cv = fit(0), cp = fit(1), f = 3 + +gas.value;
          if (!isFinite(cv) || !isFinite(cp)) return 'heating…';
          return `measured (inverse slopes): $C_V/Nk$ = ${v.fix(cv, 2)}, $C_P/Nk$ = ${v.fix(cp, 2)} · expected ${f}/2 = ${v.fix(f / 2, 1)} and ${f + 2}/2 = ${v.fix(f / 2 + 1, 1)} · difference ${v.fix(cp - cv, 2)} (theory 1, see 1.15) · ratio $\\gamma$ = ${v.fix(cp / cv, 3)} (theory ${v.fix((f + 2) / f, 3)}) · ${G[0].t < TH ? 'heater on' : 'heater off'}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.14
    {
      num: '1.14', kind: 'Definition', name: 'Enthalpy',
      statement: String.raw`The **enthalpy** of a system is
$$H = U + PV .$$
It is a state function. In a process at constant pressure in which the only work is the expansion work $-P\,\Delta V$ against the surroundings, the heat absorbed equals the change in enthalpy: $Q_P = \Delta H$ (while at constant volume $Q_V = \Delta U$). For a chemical reaction run at constant temperature and pressure, $\Delta H$ is the **heat of reaction** (negative for exothermic reactions); if the amount of gas changes by $\Delta n_g$ moles and the gases are ideal, $\Delta H = \Delta U + \Delta n_g RT$.`,
      idea: String.raw`At constant pressure the first law reads $\Delta U = Q - P\Delta V$, so $Q = \Delta U + P\Delta V = \Delta(U + PV)$: enthalpy simply pre-pays the work needed to push back the atmosphere. A reaction that produces gas must shove the air aside, so less heat comes out at constant pressure than in a sealed bomb calorimeter; one that consumes gas is helped by the atmosphere pressing in, and gives out more. Chemists tabulate $\Delta H$ because most reactions are run open to the air. (The name, from the Greek for "heat within", was coined by Kamerlingh Onnes around 1909; Gibbs had called it the heat function at constant pressure.)`,
      caption: String.raw`Pick a reaction and slide its progress from reactants to products, at 25 °C. In a cylinder under a frictionless piston loaded by the atmosphere (1 bar), the gas volume changes and the piston moves; heat flows to or from the surrounding water bath to keep the temperature fixed. The bars show the heat exchanged, the work done on the system by the atmosphere ($-P\Delta V$) and the change in internal energy: at constant pressure the heat equals $\Delta H$. Lock the piston (constant volume) and the heat becomes $\Delta U$; the difference is $\Delta n_g RT$.`,
      deps: ['thermo-1.11'],
      refs: ['Schroeder §1.6', 'Atkins, Physical Chemistry, data section (standard enthalpies of formation)'],
      tags: ['enthalpy', 'thermochemistry'],
      credit: 'Gibbs, 1875 (heat function); named by Kamerlingh Onnes, c. 1909',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Enthalpy' },
      viz(v) {
        const T = 298.15, RT = R * T / 1000; // kJ/mol
        const RX = {
          zn: { label: 'Zn + 2HCl(aq) → ZnCl₂(aq) + H₂', dH: -153.9, dn: 1, n0: 0, solid: 'zinc' },
          caco3: { label: 'CaCO₃ → CaO + CO₂', dH: 178.3, dn: 1, n0: 0, solid: 'limestone' },
          nh3: { label: 'N₂ + 3H₂ → 2NH₃', dH: -92.2, dn: -2, n0: 4 },
          ch4: { label: 'CH₄ + 2O₂ → CO₂ + 2H₂O(l)', dH: -890.4, dn: -2, n0: 3 },
        };
        const rx = v.select('reaction', Object.entries(RX).map(([value, r]) => ({ value, label: r.label })), 'ch4');
        const xi = v.slider('extent of reaction ξ', 0, 1, 1, { step: 0.01, fmt: (x) => `${v.fix(x, 2)} mol` });
        const lock = v.toggle('lock the piston (constant volume)', false);
        const sc = v.stage({ x: [0, 10], y: [-0.4, 9], height: 330, axes: false, equal: true, weight: 1 });
        const sb = v.stage({ x: [0, 4], y: [-1, 1], height: 330, axes: 'box', ylabel: 'kJ (per mol of reaction)', weight: 1.2, title: 'energy ledger at 25 °C', xticks: [[0.5, 'heat Q'], [1.5, 'work W'], [2.5, 'ΔU'], [3.5, 'ΔH']] });
        v.render(() => {
          const r = RX[rx.value], x = xi.value, ng0 = r.n0 + (r.dn < 0 ? 0 : 0.0), ng = ng0 + r.dn * x;
          const dU = x * (r.dH - r.dn * RT), W = lock.value ? 0 : -r.dn * RT * x, Q = dU - W, dH = x * r.dH;
          // vessel: height of gas ∝ moles of gas (constant P), or fixed (locked)
          const vol = (n) => 0.9 + 1.25 * n, hgt = lock.value ? vol(Math.max(ng0, ng0 + r.dn)) : vol(ng);
          sc.rect(0.3, 0.2, 9.7, 7.6, { fill: 'blue', fillAlpha: 0.08, color: 'blue', width: 1.2 });
          sc.text('water bath at 25 °C', 0.5, 7.35, { size: 11, color: 'blue' });
          sc.rect(3.2, 0.6, 6.8, 7.3, { color: 'ink', width: 2 });
          sc.rect(3.25, 0.65, 6.75, 0.65 + hgt, { fill: 'purple', fillAlpha: 0.12, stroke: false });
          sc.dots(scatter(Math.round(10 * Math.max(0.1, ng)), 5, 3.35, 0.9, 6.65, 0.65 + hgt - 0.1), { r: 2.4, color: 'purple', alpha: 0.8 });
          if (r.solid) sc.rect(4.2, 0.65, 5.8, 0.65 + 0.5 * (1 - x) + 0.05, { fill: 'gray', fillAlpha: 0.8, color: 'muted', width: 1 });
          const yp = 0.65 + hgt;
          sc.rect(3.15, yp, 6.85, yp + 0.3, { fill: 'orange', fillAlpha: 0.75, color: 'orange', width: 1.2 });
          if (lock.value) { sc.line(2.8, yp + 0.15, 3.25, yp + 0.15, { color: 'ink', width: 4 }); sc.line(6.75, yp + 0.15, 7.2, yp + 0.15, { color: 'ink', width: 4 }); sc.text('locked', 7.3, yp + 0.15, { size: 11, color: 'ink' }); }
          else for (const xx of [4, 5, 6]) sc.arrow(xx, yp + 1.2, xx, yp + 0.4, { color: 'muted', width: 1.6, head: 7 });
          if (!lock.value) sc.text('atmosphere, 1 bar', 5, yp + 1.5, { align: 'center', size: 11, color: 'muted' });
          sc.text(`gas: ${v.fix(ng, 2)} mol`, 5, 0.3, { align: 'center', size: 11.5, color: 'purple' });
          if (Math.abs(Q) > 0.5) {
            const d = Q < 0 ? 1 : -1, w = clamp(1.5 + Math.abs(Q) / 120, 1.5, 8);
            sc.arrow(d > 0 ? 7.0 : 9.2, 3.2, d > 0 ? 9.2 : 7.0, 3.2, { color: 'red', width: w });
            sc.text(Q < 0 ? `heat out ${v.fix(-Q, 1)} kJ` : `heat in ${v.fix(Q, 1)} kJ`, 8.1, 3.75, { align: 'center', size: 11, color: 'red', weight: 600 });
          }
          // ledger
          const mx = Math.max(10, Math.abs(Q), Math.abs(W), Math.abs(dU), Math.abs(dH)) * 1.2;
          sb.setView([0, 4], [-mx, mx]);
          sb.hline(0, { color: 'muted', width: 1 });
          [[0.5, Q, Q >= 0 ? 'red' : 'blue'], [1.5, W, 'orange'], [2.5, dU, 'green'], [3.5, dH, 'purple']].forEach(([xx, val, c]) => {
            sb.rect(xx - 0.3, 0, xx + 0.3, val, { fill: c, fillAlpha: 0.72, color: c, width: 1 });
            sb.text(v.fix(val, 1), xx, val, { align: 'center', dy: val >= 0 ? -10 : 11, size: 11.5, weight: 600 });
          });
          sb.text(lock.value ? 'Q_V = ΔU' : 'Q_P = ΔH', 3.95, mx * 0.88, { align: 'right', size: 12, weight: 600, color: 'ink' });
        });
        v.legend([['red', 'heat into the system', { area: true }], ['blue', 'heat out', { area: true }], ['orange', 'work on the system $-P\\Delta V$', { area: true }], ['green', '$\\Delta U$', { area: true }], ['purple', '$\\Delta H = \\Delta U + \\Delta(PV)$', { area: true }]]);
        v.readout(() => {
          const r = RX[rx.value], x = xi.value, dU = x * (r.dH - r.dn * RT);
          return `${r.label}: $\\Delta H^\\circ$ = ${v.fix(r.dH, 1)} kJ/mol, $\\Delta n_g$ = ${r.dn} → $\\Delta U = \\Delta H - \\Delta n_g RT$ = ${v.fix(r.dH - r.dn * RT, 1)} kJ/mol ($RT$ = ${v.fix(RT, 3)} kJ/mol) · at ξ = ${v.fix(x, 2)}: heat exchanged at constant pressure ${v.fix(x * r.dH, 1)} kJ, at constant volume ${v.fix(dU, 1)} kJ — they differ by the work on the atmosphere, ${v.fix(-r.dn * RT * x, 2)} kJ`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.15
    {
      num: '1.15', kind: 'Theorem', name: 'C_P − C_V = Nk for an ideal gas',
      statement: String.raw`For an ideal gas the two heat capacities differ by exactly the gas constant per molecule:
$$C_P - C_V = Nk = nR,$$
at every temperature and for every kind of molecule (Mayer's relation). Their ratio $\gamma = C_P/C_V = 1 + Nk/C_V$ depends on the molecule: $5/3$ for a monatomic gas, $7/5$ for a diatomic one whose vibrations are frozen, and closer to 1 for molecules with many active degrees of freedom.`,
      idea: String.raw`For an ideal gas $U$ depends on $T$ only (1.11), so $(\partial U/\partial T)_P = (\partial U/\partial T)_V = C_V$, and $PV = NkT$ (1.4) gives $P(\partial V/\partial T)_P = Nk$. Inserting both into $C_P = (\partial U/\partial T)_P + P(\partial V/\partial T)_P$ from 1.13 leaves $C_P = C_V + Nk$: the extra heat at constant pressure is exactly the work $P\,dV = Nk\,dT$ of pushing the piston back, and that work knows nothing about the molecules' insides. Mayer used this relation in 1842, with measured $C_P$ and $\gamma$ for air, to compute the mechanical equivalent of heat before Joule's paddle wheel.`,
      caption: String.raw`The molar heat capacities of real gases at low pressure (in units of $R$), computed from their molecular constants: translation gives 3/2, rotation switches on at a few times the rotational temperature (around 100 K for hydrogen, mixed ortho and para), each vibration at a fraction of its vibrational temperature. Drag the temperature marker and pick a gas: $C_V$ climbs in steps, but the band between $C_P$ and $C_V$ stays exactly one unit wide everywhere, while $\gamma$ (bottom right) slides from 5/3 toward 1. Shaded: below the boiling point at 1 atm.`,
      deps: ['thermo-1.13', 'thermo-1.4'],
      see: ['pchem-2.5'],
      refs: ['Schroeder §1.6', 'McQuarrie, Statistical Mechanics (molecular constants)'],
      tags: ['heat capacity', 'ideal gas'],
      credit: 'J. R. Mayer, 1842',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Mayer%27s_relation' },
      viz(v) {
        const gas = v.select('gas', Object.keys(GASES).map((g) => ({ value: g, label: `$${GASES[g].tex}$` })), 'N2');
        const sc = v.stage({ x: [10, 5000], y: [0, 7.6], xlog: true, height: 300, axes: 'box', xlabel: 'temperature (K)', ylabel: 'molar heat capacity / R', title: '$C_V$ and $C_P$ of an ideal gas', full: true });
        const sg = v.stage({ x: [10, 5000], y: [1, 1.72], xlog: true, height: 220, axes: 'box', xlabel: 'temperature (K)', ylabel: 'γ = C_P/C_V', title: 'heat-capacity ratio', weight: 1.4 });
        const sb = v.stage({ x: [0, 2], y: [0, 7.6], height: 220, axes: 'box', ylabel: 'per R', xticks: [[0.5, 'C_V'], [1.5, 'C_P']], title: 'where the heat goes', weight: 1 });
        const h = sc.handle(300, 0.4, { color: 'ink', r: 6, constrain: (x) => [clamp(x, 11, 4900), 0.4] });
        v.render(() => {
          const g = gas.value, G = GASES[g], T = h.x, p = cvParts(g, T);
          if (G.bp > 10) { sc.rect(10, 0, G.bp, 7.6, { fill: 'faint', fillAlpha: 0.25, stroke: false }); sg.rect(10, 1, G.bp, 1.72, { fill: 'faint', fillAlpha: 0.25, stroke: false }); sc.text('condensed at 1 atm', Math.sqrt(10 * G.bp), 7.1, { align: 'center', size: 10.5, color: 'muted' }); }
          const cvF = (x) => cvParts(g, x).cv;
          sc.between((x) => cvF(x) + 1, cvF, 10, 5000, { fill: 'gold', fillAlpha: 0.3, n: 220 });
          sc.fn(cvF, { color: 'accent', width: 2.6, n: 300 });
          sc.fn((x) => cvF(x) + 1, { color: 'red', width: 2.6, n: 300 });
          for (const y of [1.5, 2.5, 3.5]) sc.hline(y, { color: 'faint', width: 1, dash: [3, 4] });
          sc.vline(T, { color: 'ink', width: 1, alpha: 0.5 });
          sc.dot(T, p.cv, { r: 4.5, color: 'accent' }); sc.dot(T, p.cv + 1, { r: 4.5, color: 'red' });
          sc.measure(T * 1.12, p.cv, T * 1.12, p.cv + 1, '1', { color: 'ink', math: false, size: 12, offset: 10 });
          sc.text('C_P', 4800, cvF(4800) + 1, { align: 'right', dy: -10, color: 'red', size: 12, weight: 600 });
          sc.text('C_V', 4800, cvF(4800), { align: 'right', dy: 12, color: 'accent', size: 12, weight: 600 });
          // gamma
          for (const k of Object.keys(GASES)) if (k !== g) sg.fn((x) => 1 + 1 / cvParts(k, x).cv, { color: GASES[k].col, width: 1, alpha: 0.45, n: 160 });
          sg.fn((x) => 1 + 1 / cvF(x), { color: G.col, width: 2.6, n: 260 });
          sg.hline(5 / 3, { color: 'faint', dash: [3, 4], width: 1 }); sg.hline(7 / 5, { color: 'faint', dash: [3, 4], width: 1 });
          sg.text('5/3', 4900, 5 / 3, { align: 'right', dy: -8, size: 10.5, color: 'muted' }); sg.text('7/5', 4900, 7 / 5, { align: 'right', dy: -8, size: 10.5, color: 'muted' });
          sg.vline(T, { color: 'ink', width: 1, alpha: 0.5 });
          sg.dot(T, 1 + 1 / p.cv, { r: 4.5, color: G.col });
          // stacked bars
          const seg = (x, y0, hgt, c, lab) => { if (hgt <= 0.004) return y0; sb.rect(x - 0.32, y0, x + 0.32, y0 + hgt, { fill: c, fillAlpha: 0.7, color: c, width: 1 }); if (hgt > 0.35) sb.text(lab, x, y0 + hgt / 2, { align: 'center', size: 10.5, color: 'ink' }); return y0 + hgt; };
          for (const [x, extra] of [[0.5, false], [1.5, true]]) {
            let y = seg(x, 0, p.tr, 'accent', 'translation');
            y = seg(x, y, p.rot, 'teal', 'rotation');
            y = seg(x, y, p.vib, 'purple', 'vibration');
            if (extra) seg(x, y, 1, 'orange', 'P dV work');
          }
        });
        v.legend([['accent', '$C_V$'], ['red', '$C_P$'], ['gold', '$C_P - C_V$', { area: true }], ['orange', 'work $P\\,dV = R\\,dT$ per mole', { area: true }]]);
        v.readout(() => {
          const g = gas.value, T = h.x, p = cvParts(g, T);
          return `$${GASES[g].tex}$ at ${v.fix(T, 0)} K: $C_V$ = ${v.fix(p.cv, 3)}R (translation 1.5 + rotation ${v.fix(p.rot, 3)} + vibration ${v.fix(p.vib, 3)}), $C_P$ = ${v.fix(p.cv + 1, 3)}R · $C_P - C_V$ = 1.000 R exactly · $\\gamma$ = ${v.fix(1 + 1 / p.cv, 4)}${T < GASES[g].bp ? ' · (below the boiling point: the real substance is a liquid or solid here)' : ''}`;
        });
      },
    },
    // ------------------------------------------------------------------ 1.16
    {
      num: '1.16', kind: 'Model', name: 'Isothermal and adiabatic processes',
      statement: String.raw`A quasistatic process of an ideal gas is **isothermal** when the gas stays in contact with a heat bath at fixed $T$; then $U$ is constant, the heat absorbed equals the work done by the gas, and
$$PV = \text{const}, \qquad W = -NkT\ln\frac{V_2}{V_1}.$$
It is **adiabatic** when no heat flows ($Q = 0$, an insulated cylinder or a process too fast for heat to cross the walls); then $dU = -P\,dV$, which with $U = \tfrac f2 NkT$ integrates to
$$PV^{\gamma} = \text{const},\qquad TV^{\gamma-1} = \text{const},\qquad \gamma = \frac{f+2}{f} = \frac{C_P}{C_V},$$
so the gas heats when compressed and cools when it expands. On a $P$–$V$ diagram adiabats are steeper than isotherms; on log–log axes they are straight lines of slope $-\gamma$ and $-1$.`,
      idea: String.raw`Insulated, every bit of work done on the gas stays in it: $\tfrac f2 Nk\,dT = -P\,dV = -NkT\,dV/V$, so $\tfrac f2\,d\ln T = -d\ln V$, i.e. $TV^{2/f}$ is constant — and $PV = NkT$ turns that into $PV^{(f+2)/f}$ = const. In contact with a bath the same work flows straight out as heat, and $T$ stays put. Molecularly, each molecule bouncing off an advancing piston comes back a little faster; an insulated gas keeps that energy, a conducting one hands it to the walls. Molecules with rotational energy share the gain over more degrees of freedom, so their temperature rises less: $\gamma$ falls from 5/3 to 7/5.`,
      caption: String.raw`The piston slowly compresses the simulated gas to a third of its volume and lets it back out, again and again. Each point is the pressure measured on the walls over a short stretch of the stroke, plotted on **log–log** axes, where an isotherm is a line of slope −1 and an adiabat a line of slope −γ. With **insulating** walls the points climb the adiabat and the molecules redden as they heat; with **conducting** walls (a heat bath at the starting temperature) they follow the isotherm. Switch to diatomic molecules and the adiabat flattens from slope −5/3 to −7/5.`,
      deps: ['thermo-1.11', 'thermo-1.13'],
      see: ['pchem-2.7'],
      refs: ['Schroeder §1.5'],
      tags: ['adiabatic', 'isothermal'],
      credit: 'Poisson, 1823 (adiabatic law)',
      scope: String.raw`Holds for an ideal gas undergoing quasistatic processes: the piston must move slowly compared with the speed of sound (1.8), and for the isothermal case slowly compared with the time heat needs to reach the walls. Real compressions in engines and sound waves are close to adiabatic.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Adiabatic_process' },
      viz(v) {
        const L = 12, A = L * L, N = 200, X1 = 36, X2 = 12, U = 0.07, DX = 1.0;
        let G, dir, pts, last, cyc, T0;
        const walls = v.select('walls', [{ value: 'ins', label: 'insulating (adiabatic)' }, { value: 'con', label: 'conducting (heat bath)' }], 'ins', { onChange: () => make() });
        const gas = v.select('molecules', [{ value: 0, label: 'monatomic' }, { value: 2, label: 'diatomic' }], 0, { onChange: () => make() });
        const sc = v.stage({ x: [-1, X1 + 5], y: [-1.6, L + 1.2], equal: true, height: 200, axes: false, full: true });
        const sp = v.stage({ x: [1500, 5600], y: [0.025, 0.4], xlog: true, ylog: true, height: 300, axes: 'box', xlabel: 'V (σ³), log scale', ylabel: 'P, log scale', title: 'measured $P$ against $V$ on log–log axes', weight: 1.3 });
        const st = v.stage({ x: [1500, 5600], y: [0.5, 2.4], xlog: true, height: 300, axes: 'box', xlabel: 'V (σ³)', ylabel: 'kT', title: 'temperature of the gas', weight: 1 });
        const make = () => {
          const ins = walls.value === 'ins', dof = +gas.value;
          G = hsGas({ species: [{ m: 1, d: 0.6, dof }], counts: [N], Ly: L, Lz: L, T: 1, rng: v.rng(81 + dof), piston: { X: X1 }, diffuse: ins ? [1, 0, 1, 1, 1, 1] : [0, 0, 0, 0, 0, 0], thermal: ins ? [0, 0, 0, 0, 0, 0] : [1, 0, 1, 1, 1, 1], Tb: 1 });
          dir = -1; pts = []; last = G.snap(); last.T = 0; last.n = 0; cyc = 0; T0 = 1;
          G.setU(-U);
        };
        make();
        const clock = simClock(40, 0.05, 0);
        let Tacc = 0, nacc = 0;
        v.animate((t) => {
          const add = clock(t, () => make());
          runBudget(G, add, 0.25, clock.ms(), (h) => {
            const X = G.pist.X;
            if (dir < 0 && X <= X2 + 1e-9) { dir = 1; G.setU(U); }
            else if (dir > 0 && X >= X1 - 1e-9) { dir = -1; G.setU(-U); cyc++; }
            Tacc += G.stats().T * h; nacc += h;
            if ((G.t - last.t) * U >= DX) { const b = G.snap(), r = G.meas(last, b); pts.push({ V: r.V, P: r.pAll, T: Tacc / nacc, c: cyc, d: dir }); if (pts.length > 600) pts.shift(); last = b; Tacc = 0; nacc = 0; }
          });
          const rp = tRamp(v);
          drawGas(sc, G, { rod: 4, color: (i) => pick(rp, Math.hypot(G.vx[i], G.vy[i], G.vz[i]) / 3.6), len: X1 + 1.3, wallColor: walls.value === 'con' ? 'red' : 'ink', leftColor: walls.value === 'con' ? 'red' : 'ink' });
          sc.text(walls.value === 'con' ? 'conducting walls: heat bath at kT = 1' : 'insulating walls', 0, -1, { size: 11.5, color: walls.value === 'con' ? 'red' : 'muted' });
          const gam = (5 + +gas.value) / (3 + +gas.value), P0 = N / (X1 * A), V0 = X1 * A;
          sp.fn((V) => P0 * V0 / V, { color: 'blue', width: 1.8, dash: [6, 4] });
          sp.fn((V) => P0 * (V0 / V) ** gam, { color: 'red', width: 1.8, dash: [6, 4] });
          sp.text('isotherm, slope −1', 1650, P0 * V0 / 1650, { dy: 14, dx: 4, color: 'blue', size: 11.5 });
          sp.text(`adiabat, slope −${gas.value === 0 || gas.value === '0' ? '5/3' : '7/5'}`, 1650, P0 * (V0 / 1650) ** gam, { dy: -12, dx: 4, color: 'red', size: 11.5 });
          for (const p of pts) sp.dot(p.V, p.P, { r: 3, color: p.d < 0 ? 'purple' : 'gold', alpha: p.c === cyc ? 0.95 : 0.35, ring: false });
          st.fn((V) => (V0 / V) ** (gam - 1), { color: 'red', width: 1.6, dash: [6, 4] });
          st.hline(1, { color: 'blue', width: 1.6, dash: [6, 4] });
          for (const p of pts) st.dot(p.V, p.T, { r: 3, color: p.d < 0 ? 'purple' : 'gold', alpha: p.c === cyc ? 0.95 : 0.35, ring: false });
          sp.vline(G.volume(), { color: 'faint', width: 1 }); st.vline(G.volume(), { color: 'faint', width: 1 });
        }, { still: 8 });
        v.legend([['purple', 'compression', { dot: true }], ['gold', 'expansion', { dot: true }], ['blue', 'isotherm $PV$ = const', { dash: true }], ['red', 'adiabat $PV^\\gamma$ = const', { dash: true }]]);
        v.readout(() => {
          const cur = pts.filter((p) => p.c === cyc && p.d === dir), use = cur.length >= 5 ? cur : pts.slice(-12);
          const gam = (5 + +gas.value) / (3 + +gas.value);
          const s = use.length >= 4 ? fitLine(use.map((p) => Math.log(p.V)), use.map((p) => Math.log(p.P))).b : NaN;
          const T = G.stats().T, V = G.volume();
          return `fitted slope of $\\ln P$ against $\\ln V$ over the current stroke: ${isFinite(s) ? v.fix(s, 2) : '…'} (isotherm −1, adiabat −${v.fix(gam, 3)}) · now $V$ = ${v.fix(V, 0)} σ³, $kT$ = ${v.fix(T, 3)} · $TV^{\\gamma-1}/T_0V_0^{\\gamma-1}$ = ${v.fix(T * V ** (gam - 1) / (X1 * A) ** (gam - 1), 3)} · energy received as work so far ${v.fix(G.Wp, 1)}, as heat ${v.fix(G.Qb, 1)}`;
        });
      },
    },
  ],
};
