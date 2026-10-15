// Thermodynamics & Statistical Mechanics — Chapter 2 (part b): entropy at work, real cycles and the founding papers
import { clamp, lerp, hsGas, pick, drawGas, simClock, tRamp, R, carnot, band, packets, reservoir, device, cylinder, along, PLANTS } from './ch02.shared.js';

// ---------- helpers for this part ----------
const bar = (s, x, val, hw, color, o = {}) => s.rect(x - hw, 0, x + hw, val, { fill: color, fillAlpha: o.alpha ?? 0.78, color, width: 1 });
/** Coarse-grained entropy (units of k, up to a constant) of one species: Σ over slabs n ln(V_slab / n) + (3/2) N ln T. */
function slabEntropy(G, sp, K, X, T) {
  const cnt = new Float64Array(K), w = X / K, A = G.Ly * G.Lz; let N = 0;
  for (let i = 0; i < G.N; i++) if (G.S[i] === sp) { cnt[Math.min(K - 1, Math.max(0, Math.floor(G.x[i] / w)))]++; N++; }
  let s = 0; for (let c = 0; c < K; c++) if (cnt[c] > 0) s += cnt[c] * Math.log(w * A / cnt[c]);
  return s + 1.5 * N * Math.log(T);
}
/** Kinetic temperature of one species. */
function spT(G, sp) { let K = 0, n = 0; for (let i = 0; i < G.N; i++) if (G.S[i] === sp) { K += 0.5 * G.m[i] * (G.vx[i] ** 2 + G.vy[i] ** 2 + G.vz[i] ** 2); n++; } return n ? 2 * K / (3 * n) : 0; }
const smooth = (h, key, k = 6) => h.map((p, i) => { const a = Math.max(0, i - k + 1); let s = 0; for (let j = a; j <= i; j++) s += h[j][key]; return s / (i - a + 1); });
// Water: Kell (1975) density and isothermal compressibility, 0–100 °C
const kellRho = (t) => (999.83952 + 16.945176 * t - 7.9870401e-3 * t * t - 46.170461e-6 * t ** 3 + 105.56302e-9 * t ** 4 - 280.54253e-12 * t ** 5) / (1 + 16.879850e-3 * t);
const kellKappa = (t) => 1e-11 * (50.88496 + 0.6163813 * t + 1.459187e-3 * t * t + 20.08438e-6 * t ** 3 - 58.47727e-9 * t ** 4 + 410.4110e-12 * t ** 5) / (1 + 19.67348e-3 * t); // 1/Pa
const kellAlpha = (t) => -(kellRho(t + 0.01) - kellRho(t - 0.01)) / 0.02 / kellRho(t);
// Liquid water at 1 atm, IAPWS-95 via the NIST Chemistry WebBook: t (°C), c_p, c_v (kJ/(kg K))
const WATER = [[0.01, 4.2194, 4.2170], [10.01, 4.1951, 4.1905], [20.01, 4.1840, 4.1566], [30.01, 4.1798, 4.1172], [40.01, 4.1794, 4.0734], [50.01, 4.1813, 4.0261], [60.01, 4.1850, 3.9764], [70.01, 4.1901, 3.9250], [80.01, 4.1968, 3.8728], [90.01, 4.2052, 3.8203], [99.974, 4.2156, 3.7683]];
const waterAt = (t, k) => { for (let i = 1; i < WATER.length; i++) if (t <= WATER[i][0]) { const a = WATER[i - 1], b = WATER[i], u = (t - a[0]) / (b[0] - a[0]); return a[k] + (b[k] - a[k]) * u; } return WATER[WATER.length - 1][k]; };

export default {
  collection: 'thermo',
  chapter: 2,
  items: [
    // ------------------------------------------------------------------ 2.10
    {
      num: '2.10', kind: 'Theorem', name: 'Entropy of an isolated system never decreases',
      statement: String.raw`For any process taking an isolated system (no heat and no work exchanged with the surroundings) from one equilibrium state to another,
$$\Delta S \ge 0,$$
with equality only if the process is reversible. Consequently, when an internal constraint of an isolated system is removed (a wall made conducting, movable or permeable), the system evolves to the equilibrium state of **maximum entropy** compatible with the remaining constraints (fixed total $U$, $V$, $N$). The entropy of a *part* of the system can decrease, provided the rest gains at least as much.`,
      idea: String.raw`Let the isolated system go irreversibly from A to B, then bring it back from B to A along some reversible path, during which it may exchange heat with auxiliary reservoirs. The Clausius inequality (2.8) for this cycle reads $0 + \int_B^A \delta Q_{\text{rev}}/T \le 0$ (no heat crossed during the isolated leg), and the second integral is $S(A) - S(B)$ by the definition of entropy (2.9). Hence $S(B) \ge S(A)$. Since every spontaneous change raises $S$, the process stops only where $S$ cannot rise any further — at its constrained maximum, which is how equilibrium conditions such as equal temperatures and pressures follow (3.4).`,
      caption: String.raw`An isolated box of simulated hard spheres: gas A (100 light molecules, orange) starts hot and dense, gas B (60 molecules of twice the mass, teal) cool and dilute. Choose what the partition lets through: **heat** only (a light wall jiggling in place), **heat and volume** (a free piston) or also **particles** (the partition is lifted at $t = 10$). The curves are each gas's entropy, measured from the simulation as $N[\ln(V/N) + \tfrac32\ln T]$ (per slab for mixing gases, in units of $k$), and their sum. The total climbs to the dashed line — the maximum entropy allowed by the constraints, computed from the conserved energy — while gas A's entropy can fall as it gives up heat. Small wiggles are the fluctuations of a few hundred molecules.`,
      deps: ['thermo-2.9'],
      see: ['thermo-5.7', 'thermo-3.4'],
      refs: ['Kardar §1.6'],
      tags: ['entropy', 'second law'],
      credit: 'Clausius, 1865',
      scope: String.raw`For macroscopic isolated systems between equilibrium states. In a system of a few hundred molecules the measured entropy fluctuates by a few $k$ around its trend; the decreases become vanishingly rare as $N$ grows (5.7).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Second_law_of_thermodynamics' },
      viz(v) {
        const L = 10, X = 32, XP = 16, A = L * L, NA = 100, NB = 60, TA0 = 2, TB0 = 0.6, LIFT = 10;
        const mode = v.select('the partition lets through', [{ value: 'heat', label: 'heat' }, { value: 'vol', label: 'heat and volume' }, { value: 'part', label: 'heat, volume and particles' }], 'vol', { onChange: () => make() });
        v.button('Restart', () => make());
        const sc = v.stage({ x: [-1, X + 1], y: [-1.9, L + 1.4], equal: true, height: 210, axes: false, full: true });
        const sp = v.stage({ x: [0, 300], y: [-40, 160], height: 290, axes: 'box', xlabel: 'time', ylabel: 'ΔS  (units of k)', full: true, title: 'entropy of each gas and of the whole isolated box' });
        let G, hist, lifted, S0, pred, U0;
        const entr = () => {
          const TA = spT(G, 0), TB = spT(G, 1);
          if (mode.value === 'part') return [slabEntropy(G, 0, 8, X, TA), slabEntropy(G, 1, 8, X, TB), TA, TB];
          const VA = G.plate.X * A, VB = (X - G.plate.X) * A;
          return [NA * (Math.log(VA / NA) + 1.5 * Math.log(TA)), NB * (Math.log(VB / NB) + 1.5 * Math.log(TB)), TA, TB];
        };
        const make = () => {
          const m = mode.value;
          const plate = m === 'heat' ? { X: XP, M: 3, lo: XP - 0.4, hi: XP + 0.4 } : m === 'vol' ? { X: XP, M: 12, lo: 2.5, hi: X - 2.5 } : { X: XP };
          G = hsGas({ species: [{ m: 1, d: 0.6 }, { m: 2, d: 0.6 }], counts: [NA, NB], side: [0, 1], Ly: L, Lz: L, T: 1, rng: v.rng(23), piston: { X }, plate, diffuse: [1, 0, 1, 1, 1, 1] });
          G.setT(TA0, 0); G.setT(TB0, 1);
          lifted = false; const e = entr(); S0 = [e[0], e[1]]; hist = [{ t: 0, a: 0, b: 0, s: 0 }];
          // maximum-entropy prediction from the conserved energy
          const Tf = (NA * e[2] + NB * e[3]) / (NA + NB), Sx = (N, V, T) => N * (Math.log(V / N) + 1.5 * Math.log(T));
          const VA = XP * A, VB = (X - XP) * A;
          const Sfin = m === 'heat' ? Sx(NA, VA, Tf) + Sx(NB, VB, Tf) : m === 'vol' ? Sx(NA, X * A * NA / (NA + NB), Tf) + Sx(NB, X * A * NB / (NA + NB), Tf) : Sx(NA, X * A, Tf) + Sx(NB, X * A, Tf);
          const Sini = Sx(NA, VA, e[2]) + Sx(NB, VB, e[3]);
          pred = Sfin - Sini; U0 = G.stats().U;
          clock.kick(m === 'part' ? 40 : 90);
        };
        const clock = simClock(22, 0.05, 0);
        make();
        v.animate((t) => {
          const add = clock(t, () => make()), t0 = performance.now(); let done = 0;
          while (done < add - 1e-9 && performance.now() - t0 < clock.ms()) {
            const h = Math.min(0.5, add - done);
            if (mode.value === 'part' && !lifted && G.t + h >= LIFT) { G.advance(Math.max(0, LIFT - G.t)); G.removePlate(); lifted = true; done += Math.max(0, LIFT - G.t); continue; }
            G.advance(h); done += h;
            if (G.t - hist[hist.length - 1].t >= 1) { const e = entr(); hist.push({ t: G.t, a: e[0] - S0[0], b: e[1] - S0[1], s: e[0] + e[1] - S0[0] - S0[1] }); if (hist.length > 1200) hist.splice(1, 1); }
          }
          drawGas(sc, G, { piston: false, len: X, color: (i) => (G.S[i] === 0 ? 'orange' : 'teal'), plateColor: 'ink' });
          const e = entr();
          sc.text(`gas A: kT = ${v.fix(e[2], 2)}`, 0, L + 0.8, { size: 12, weight: 650, color: 'orange' });
          sc.text(`gas B: kT = ${v.fix(e[3], 2)}`, X, L + 0.8, { size: 12, weight: 650, color: 'teal', align: 'right' });
          sc.text(mode.value === 'part' ? (lifted ? `partition lifted at t = ${LIFT}: the gases mix` : `partition lifts at t = ${LIFT}`) : mode.value === 'vol' ? 'free piston: moves and jiggles' : 'light wall jiggling in place: heat only', X / 2, -1.05, { size: 11.5, align: 'center', color: 'muted' });
          const tm = Math.max(300, G.t), aa = smooth(hist, 'a'), bb = smooth(hist, 'b'), ss = smooth(hist, 's');
          const all = [...aa, ...bb, ...ss, pred, 0];
          sp.setView([0, tm], [Math.min(...all) - 10, Math.max(...all) + 15]);
          sp.hline(0, { color: 'muted', width: 1 });
          sp.hline(pred, { color: 'green', width: 1.6, dash: [7, 5] });
          sp.text(`maximum allowed: ΔS = ${v.fix(pred, 1)} k`, tm * 0.99, pred, { dy: -10, align: 'right', size: 11.5, color: 'green', weight: 650 });
          sp.path(hist.map((p, i) => [p.t, aa[i]]), { color: 'orange', width: 2.2 });
          sp.path(hist.map((p, i) => [p.t, bb[i]]), { color: 'teal', width: 2.2 });
          sp.path(hist.map((p, i) => [p.t, ss[i]]), { color: 'ink', width: 2.8 });
          if (mode.value === 'part') sp.vline(LIFT, { color: 'faint', dash: [3, 3] });
        }, { still: 16 });
        v.legend([['orange', 'gas A'], ['teal', 'gas B'], ['ink', 'total (isolated box)'], ['green', 'maximum-entropy equilibrium', { dash: true }]]);
        v.readout(() => {
          const h = hist[hist.length - 1], ss = smooth(hist, 's'), aa = smooth(hist, 'a'), dU = G.stats().U + (G.plate && G.plate.M < Infinity ? 0.5 * G.plate.M * G.plate.U ** 2 : 0) - U0;
          const amax = Math.max(...aa);
          return `t = ${v.fix(G.t, 0)} · $\\Delta S_{\\text{total}}$ = **${v.fix(ss[ss.length - 1], 1)} k** (equilibrium maximum ${v.fix(pred, 1)} k) · gas A ${v.fix(h.a, 1)} k${amax - aa[aa.length - 1] > 5 ? ` (it peaked at ${v.fix(amax, 1)} and is now losing entropy)` : ''}, gas B ${v.fix(h.b, 1)} k · total energy changed by ${v.fix(dU, 3)} kT (isolated)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.11
    {
      num: '2.11', kind: 'Model', name: 'Entropy of an ideal gas',
      statement: String.raw`For $n$ moles of an ideal gas with constant molar heat capacity $C_V = \tfrac f2 R$,
$$S(T, V) = nC_V\ln T + nR\ln V + \text{const} = nC_V\ln P + nC_P\ln V + \text{const}',$$
from integrating $dS = (nC_V\,dT + P\,dV)/T$ with $PV = nRT$. The curves of constant $S$ on the $P$–$V$ plane are exactly the reversible adiabats $PV^\gamma = $ const of 1.16. Classical thermodynamics leaves the constant undetermined; quantum statistical mechanics fixes it (Sackur–Tetrode, 5.11): for a monatomic gas
$$\frac{S}{nR} = \ln\!\left[\frac{V}{nN_A}\left(\frac{2\pi m k T}{h^2}\right)^{3/2}\right] + \frac52,$$
plus rotational terms for molecules.`,
      idea: String.raw`Along a reversible path the first law gives $\delta Q_{\text{rev}} = dU + P\,dV = nC_V\,dT + nRT\,dV/V$; dividing by $T$ leaves an exact differential (2.9) that integrates at once. Constant $S$ means $C_V\ln T + R\ln V$ fixed, i.e. $TV^{R/C_V} = TV^{\gamma - 1}$ fixed: reversible adiabats are isentropes, which is why "adiabatic" and "isentropic" are used interchangeably for quasistatic processes. Raising $T$ or $V$ raises $S$ — more energy to share, more room to share it in.`,
      caption: String.raw`The background colour is the entropy of 1 mol of the chosen gas over the $P$–$V$ plane, with contours every 5 J/K. **Drag the state**: the dots are an adiabat computed independently, by integrating the first law with $\delta Q = 0$ step by step from the state — they fall exactly on the entropy contour through it, while the dashed isotherm cuts across contours. The gold path (an example until you drag) is copied onto the $T$–$S$ plane on the right: isochores and isobars become curves there, and the path closes because $S$ is a state function. The readout gives the absolute entropy from the Sackur–Tetrode formula (with the rigid-rotor term for N₂) and compares it at 298.15 K and 1 bar with the tabulated standard entropy.`,
      deps: ['thermo-2.9', 'thermo-1.15'],
      see: ['thermo-5.11', 'thermo-1.16'],
      refs: ['Schroeder §3.2', 'CODATA Key Values for Thermodynamics (Cox, Wagman & Medvedev, 1989)'],
      tags: ['entropy', 'ideal gas'],
      scope: String.raw`Ideal gases with constant heat capacity: dilute enough for $PV = nRT$, hot enough that rotations are classical (well above a few kelvin) and cool enough that vibrations stay frozen (below several hundred kelvin for N₂). Near absolute zero the formula fails ($S \to -\infty$), as it must by the third law.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Sackur%E2%80%93Tetrode_equation' },
      viz(v) {
        const GAS = { He: { f: 3, M: 4.002602, std: 126.153, tex: '\\mathrm{He}' }, Ar: { f: 3, M: 39.948, std: 154.846, tex: '\\mathrm{Ar}' }, N2: { f: 5, M: 28.0134, std: 191.609, rot: 2.88, sig: 2, tex: '\\mathrm{N_2}' } };
        const gas = v.select('gas (1 mol)', [{ value: 'He', label: 'helium' }, { value: 'Ar', label: 'argon' }, { value: 'N2', label: 'nitrogen' }], 'Ar');
        v.button('Clear path', () => { trail = []; demo = false; });
        const sp = v.stage({ x: [0, 60], y: [0, 500], height: 340, axes: 'box', xlabel: 'V (L)', ylabel: 'P (kPa)', weight: 1.3, title: 'entropy over the $P$–$V$ plane' });
        const st = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: 'box', xlabel: 'S (J/K)', ylabel: 'T (K)', weight: 1, title: 'the same states on the $T$–$S$ plane' });
        const C = v.M.CONST;
        // an example path until the reader drags: isochoric heating, isobaric expansion, isochoric cooling, isobaric compression
        const example = () => { const V0 = 24.8, P0 = 100, out = []; const seg = (a, b) => { for (let i = 0; i <= 30; i++) out.push([lerp(a[0], b[0], i / 30), lerp(a[1], b[1], i / 30)]); }; seg([V0, P0], [V0, 220]); seg([V0, 220], [42, 220]); seg([42, 220], [42, P0]); seg([42, P0], [V0, P0]); return out; };
        let trail = example(), demo = true;
        const h = sp.handle(24.8, 100, { color: 'gold', r: 8, constrain: { x: [3, 58], y: [15, 490] }, onDrag: (q) => { if (demo) { trail = []; demo = false; } trail.push([q.x, q.y]); if (trail.length > 600) trail.shift(); } });
        const Sabs = (g, V, T) => { const G = GAS[g], m = G.M * C.u, Vm = V * 1e-3 / C.NA; let s = R * (Math.log(Vm * (2 * Math.PI * m * C.kB * T / C.h ** 2) ** 1.5) + 2.5); if (G.rot) s += R * (Math.log(T / (G.sig * G.rot)) + 1); return s; };
        let last = null;
        v.render(() => {
          const g = gas.value, f = GAS[g].f, cv = f / 2 * R;
          const S = (V, P) => Sabs(g, V, P * V / R);
          const S0 = S(h.x, h.y);
          sp.heat((V, P) => S(V, P), { range: [S0 - 60, S0 + 60], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 4, key: 'S-' + g + Math.round(S0) });
          const lv = []; for (let k = -7; k <= 9; k++) lv.push(S0 + 5 * k);
          sp.contour((V, P) => S(V, P), lv, { color: 'ink', width: 0.8, alpha: 0.35, res: 90 });
          sp.axes();
          // adiabat by integrating dT/dV = −R T/(C_V V) with RK4, both directions
          const ad = [];
          for (const dir of [1, -1]) { let V = h.x, T = h.x * h.y / R; const dV = dir * 0.6; for (let k = 0; k < 120; k++) { const F = (V_, T_) => -R * T_ / (cv * V_); const k1 = F(V, T), k2 = F(V + dV / 2, T + dV / 2 * k1), k3 = F(V + dV / 2, T + dV / 2 * k2), k4 = F(V + dV, T + dV * k3); T += dV / 6 * (k1 + 2 * k2 + 2 * k3 + k4); V += dV; if (V < 1 || V > 62) break; if (k % 3 === 2) ad.push([V, R * T / V]); } }
          sp.dots(ad, { r: 3.2, color: 'ink' });
          sp.fn((V) => h.x * h.y / V, { color: 'ink', width: 1.4, dash: [6, 4] });
          if (trail.length > 1) sp.path(trail, { color: 'gold', width: 2.6 });
          if (demo) sp.text('example path — drag the dot to draw your own', 57, 470, { align: 'right', size: 11, color: 'gold', weight: 650, plate: true });
          const T0 = h.x * h.y / R;
          sp.text(`T = ${T0.toFixed(0)} K`, h.x, h.y, { dx: 12, dy: -14, size: 11.5, weight: 650, plate: true });
          // T–S
          const tsTrail = trail.map(([V, P]) => [S(V, P), P * V / R]);
          const xs = [S0, ...tsTrail.map((p) => p[0])], ys = [T0, ...tsTrail.map((p) => p[1])];
          const x0 = Math.min(...xs) - 12, x1 = Math.max(...xs) + 12, y1 = Math.max(...ys) * 1.3 + 50;
          st.setView([x0, x1], [0, y1]);
          st.vline(S0, { color: 'ink', width: 1.2, dash: [6, 4] });
          st.text('adiabat = isentrope', S0, y1 * 0.94, { dx: 6, size: 11, color: 'ink' });
          st.hline(T0, { color: 'muted', width: 1, dash: [3, 4] });
          if (tsTrail.length > 1) st.path(tsTrail, { color: 'gold', width: 2.4 });
          st.dot(S0, T0, { r: 6, color: 'gold' });
          last = { g, S0, T0, V: h.x, P: h.y };
        });
        v.legend([['ink', 'adiabat by step-by-step integration', { dot: true }], ['ink', 'isotherm', { dash: true }], ['gold', 'your path']]);
        v.readout(() => {
          if (!last) return '';
          const { g, S0, T0, V, P } = last, std = Sabs(g, R * 298.15 / 100, 298.15);
          return `$${GAS[g].tex}$ at $V$ = ${v.fix(V, 1)} L, $P$ = ${v.fix(P, 0)} kPa, $T$ = ${v.fix(T0, 1)} K: $S$ = **${v.fix(S0, 2)} J/K** (Sackur–Tetrode${GAS[g].rot ? ' + rotation' : ''}) · at 298.15 K and 1 bar the formula gives ${v.fix(std, 2)} J/(mol K); tabulated standard entropy ${GAS[g].std} J/(mol K)`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.12
    {
      num: '2.12', kind: 'Phenomenon', name: 'Entropy production in irreversible processes',
      statement: String.raw`Every real (irreversible) process creates entropy: the entropy of the system plus its surroundings increases, $\Delta S_{\text{univ}} = S_{\text{gen}} > 0$. Because $S$ is a state function, $\Delta S$ of each part is computed along *any* reversible path between the same end states, even though the actual process followed none. Standard cases:

- heat $Q$ leaking from a body at $T_1$ to one at $T_2 < T_1$: $S_{\text{gen}} = Q(1/T_2 - 1/T_1) > 0$ (integrated as the temperatures change);
- free expansion of $n$ mol of ideal gas from $V_1$ to $V_2$: $S_{\text{gen}} = nR\ln(V_2/V_1)$ with no heat at all;
- mixing two different ideal gases at equal $T$ and $P$: $S_{\text{gen}} = -nR\sum_i x_i\ln x_i$;
- stirring (friction) that dissipates work $W$ into a body of heat capacity $C$ at $T_0$: $S_{\text{gen}} = C\ln(1 + W/CT_0)$.`,
      idea: String.raw`Each recipe replaces the irreversible process by a reversible one with the same end states: let heat flow through a sequence of reservoirs at gradually changing temperatures, expand the gas isothermally against a slowly yielding piston while feeding it heat, separate the gases with semipermeable pistons, or heat the stirred body from reservoirs. The entropy change of the body comes out of $\int\delta Q_{\text{rev}}/T$ (2.9); in the actual process the surroundings received the heat (if any) at their own temperature, and the difference is positive by 2.10. In the heat-leak case the picture says it all: every joule leaves the hot body where $1/T$ is small and arrives in the cold body where $1/T$ is large.`,
      caption: String.raw`Pick an irreversible process. **Heat leak**: two equal blocks (1 kJ/K each) exchange heat; drag the progress. On the right $1/T$ is plotted against the heat transferred: the area under the blue curve is the entropy the cold block gains, the area under the red curve what the hot block loses, and the green area between them is the entropy created. **Free expansion**: the gas jumps from $V_1$ to $V_2$ with no path; its entropy change is measured along the reversible isotherm (shaded area $= T\Delta S$). **Mixing** and **stirring** work the same way. In every case the bars show $\Delta S$ of the system, of the surroundings and of the universe; the last is never negative.`,
      deps: ['thermo-2.10', 'thermo-1.19'],
      see: ['pchem-3.5', 'thermo-5.12', 'mech-1.15'],
      refs: ['Schroeder §2.6'],
      tags: ['entropy', 'irreversibility'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Entropy_production' },
      viz(v) {
        const proc = v.select('process', [{ value: 'leak', label: 'heat leak' }, { value: 'free', label: 'free expansion' }, { value: 'mix', label: 'mixing' }, { value: 'stir', label: 'stirring' }], 'leak');
        const prog = v.slider('progress / amount', 0, 1, 0.65, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const T1s = v.slider('hot block $T_1$', 300, 600, 450, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const T2s = v.slider('cold block $T_2$', 150, 300, 250, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const sa = v.stage({ x: [0, 10], y: [0, 7], equal: true, height: 320, axes: false, weight: 1 });
        const sb = v.stage({ x: [0, 1], y: [0, 1], height: 320, axes: 'box', weight: 1.15 });
        const C = 1000, n = 1, T0 = 300;
        let res = null;
        const bars = (dSys, dSur, x0, y0, w, hgt, mx) => {
          const items = [[dSys, 'system', 'accent'], [dSur, 'surroundings', 'purple'], [dSys + dSur, 'universe', 'green']];
          sa.line(x0, y0, x0 + w, y0, { color: 'muted', width: 1 });
          items.forEach(([val, lab, col], k) => { const x = x0 + w * (k + 0.5) / 3, hh = hgt * val / mx; sa.rect(x - 0.35, y0, x + 0.35, y0 + hh, { fill: col, fillAlpha: 0.75, color: col, width: 1 }); sa.text(lab, x, y0 - 0.3, { align: 'center', size: 10.5, color: col }); sa.text(`${v.fix(val, 2)}`, x, y0 + hh, { dy: val >= 0 ? -9 : 9, align: 'center', size: 10.5, weight: 650, color: col }); });
          sa.text('ΔS (J/K)', x0, y0 + hgt + 0.25, { size: 10.5, color: 'muted' });
        };
        v.render(() => {
          const p = proc.value, u = prog.value, rp = tRamp(v);
          T1s.el.hidden = p !== 'leak'; T2s.el.hidden = p !== 'leak';
          if (p === 'leak') {
            const T1 = T1s.value, T2 = T2s.value, Tf = (T1 + T2) / 2, Qf = C * (T1 - Tf), Q = u * Qf, Th = T1 - Q / C, Tc = T2 + Q / C;
            const dS1 = C * Math.log(Th / T1), dS2 = C * Math.log(Tc / T2);
            const col = (T) => pick(rp, (T - 150) / 450);
            sa.rect(0.6, 4, 4.4, 6.4, { fill: col(Th), fillAlpha: 0.85, color: 'ink', width: 1.4, radius: 6 }); sa.rect(5.6, 4, 9.4, 6.4, { fill: col(Tc), fillAlpha: 0.85, color: 'ink', width: 1.4, radius: 6 });
            sa.text(`${Th.toFixed(1)} K`, 2.5, 5.2, { align: 'center', size: 13, weight: 700, plate: true }); sa.text(`${Tc.toFixed(1)} K`, 7.5, 5.2, { align: 'center', size: 13, weight: 700, plate: true });
            if (u < 0.999) band(v, sa, [[4.45, 5.2], [5.55, 5.2]], 4 + 14 * (Th - Tc) / (T1 - T2), 'red');
            sa.text(`heat so far ${Q.toFixed(0)} J`, 5, 6.75, { align: 'center', size: 11.5, color: 'red', weight: 650 });
            bars(dS1 + dS2, 0, 0.8, 1.0, 8.4, 2.2, Math.max(1, Math.abs(dS1 + dS2)) * 1.1);
            sa.text(`hot block ${v.fix(dS1, 2)} J/K, cold block +${v.fix(dS2, 2)} J/K`, 5, 3.55, { align: 'center', size: 11, color: 'muted' });
            // 1/T against Q
            sb.setTitle('replacement path: $\\Delta S = \\int dQ/T$ as areas'); sb.setLabels('heat transferred Q (J)', '1/T  (1/K)');
            sb.setView([0, Qf * 1.05], [0, 1.15 / T2]);
            sb.between((q) => 1 / (T2 + q / C), (q) => 1 / (T1 - q / C), 0, Q, { fill: 'green', fillAlpha: 0.35 });
            sb.between((q) => 1 / (T1 - q / C), () => 0, 0, Q, { fill: 'red', fillAlpha: 0.12 });
            sb.fn((q) => 1 / (T2 + q / C), { color: 'blue', width: 2.4, domain: [0, Qf] }); sb.fn((q) => 1 / (T1 - q / C), { color: 'red', width: 2.4, domain: [0, Qf] });
            sb.vline(Q, { color: 'ink', width: 1.2, dash: [4, 4] });
            sb.text('cold block: 1/T₂(Q)', Qf * 0.6, 1 / (T2 + 0.6 * Qf / C), { dy: -12, size: 11, color: 'blue', weight: 650, plate: true });
            sb.text('hot block: 1/T₁(Q)', Qf * 0.6, 1 / (T1 - 0.6 * Qf / C), { dy: 13, size: 11, color: 'red', weight: 650, plate: true });
            sb.text('S created', Q / 2, (1 / (T2 + Q / 2 / C) + 1 / (T1 - Q / 2 / C)) / 2, { align: 'center', size: 11.5, weight: 700, color: 'green', plate: true });
            res = { gen: dS1 + dS2, txt: `$\\Delta S_{\\text{hot}} = C\\ln(T_1'/T_1)$ = ${v.fix(dS1, 3)} J/K, $\\Delta S_{\\text{cold}}$ = +${v.fix(dS2, 3)} J/K` };
            v.legend([['blue', '1/T of the cold block'], ['red', '1/T of the hot block'], ['green', 'entropy created', { area: true }]]);
          } else if (p === 'free') {
            const r = 1 + 3 * u, V1 = 10, V2 = V1 * r, dS = n * R * Math.log(r);
            const dots = []; let a = 7; const rnd = () => ((a = (a * 16807) % 2147483647) / 2147483647);
            for (let i = 0; i < 70; i++) dots.push([0.8 + rnd() * 8.4 * (u > 0 ? 1 : 0.25), 4.1 + rnd() * 2.2]);
            sa.rect(0.7, 4, 9.3, 6.4, { color: 'ink', width: 1.6 }); sa.rect(0.7, 4, 0.7 + 8.6 * V1 / 40, 6.4, { fill: 'accent', fillAlpha: 0.08, stroke: false });
            sa.dots(dots.map(([x, y]) => [0.7 + (x - 0.8) / 8.4 * 8.6 * V2 / 40, y]), { r: 2.6, color: 'accent' });
            sa.line(0.7 + 8.6 * V1 / 40, 4, 0.7 + 8.6 * V1 / 40, 6.4, { color: 'muted', width: 1.4, dash: [4, 3] });
            sa.text(`vacuum opened up to V₂ = ${V2.toFixed(0)} L`, 5, 6.75, { align: 'center', size: 11.5, color: 'muted' });
            bars(dS, 0, 0.8, 1.0, 8.4, 2.2, Math.max(1, dS) * 1.1);
            sa.text('no work, no heat: surroundings unchanged', 5, 3.55, { align: 'center', size: 11, color: 'muted' });
            sb.setTitle('replacement path: reversible isotherm at 300 K'); sb.setLabels('V (L)', 'P (kPa)');
            sb.setView([0, 45], [0, 280]);
            sb.fn((V) => n * R * T0 / V, { color: 'faint', width: 1.2, domain: [5, 45] });
            sb.fn((V) => n * R * T0 / V, { color: 'red', width: 2.6, domain: [V1, V2], fill: 'red', fillAlpha: 0.15 });
            sb.dot(V1, n * R * T0 / V1, { r: 5, label: 'before', labelPos: 'ne' }); sb.dot(V2, n * R * T0 / V2, { r: 5, label: 'after', labelPos: 'ne' });
            if (r > 1.05) sb.arrow(V1 + 0.5, n * R * T0 / V1 - 5, V2 - 0.5, n * R * T0 / V2 + 25, { color: 'muted', width: 1.4, dash: [5, 4] });
            sb.text('actual process: no path', (V1 + V2) / 2, (n * R * T0 / V1 + n * R * T0 / V2) / 2 + 30, { align: 'center', size: 11, color: 'muted', plate: true });
            sb.text(`shaded = Q_rev = ${(n * R * T0 * Math.log(r)).toFixed(0)} J`, (V1 + V2) / 2, 30, { align: 'center', size: 11, color: 'red', weight: 650, plate: true });
            res = { gen: dS, txt: `$\\Delta S_{\\text{gas}} = Q_{\\text{rev}}/T = nR\\ln(V_2/V_1)$ = ${v.fix(dS, 3)} J/K, though no heat flowed` };
            v.legend([['red', 'reversible isotherm used to compute ΔS'], ['red', '$Q_{\\text{rev}} = T\\Delta S$', { area: true }]]);
          } else if (p === 'mix') {
            const x = clamp(u, 0.01, 0.99), dS = -n * R * (x * Math.log(x) + (1 - x) * Math.log(1 - x));
            let a = 11; const rnd = () => ((a = (a * 16807) % 2147483647) / 2147483647);
            sa.rect(0.7, 4, 9.3, 6.4, { color: 'ink', width: 1.6 });
            for (let i = 0; i < 90; i++) { const isA = i < 90 * x; sa.dot(0.8 + rnd() * 8.4, 4.1 + rnd() * 2.2, { r: 2.8, color: isA ? 'orange' : 'teal', ring: false }); }
            sa.text(`1 mol in total: ${v.fix(x, 2)} mol of A, ${v.fix(1 - x, 2)} mol of B, mixed`, 5, 6.75, { align: 'center', size: 11.5, color: 'muted' });
            bars(dS, 0, 0.8, 1.0, 8.4, 2.2, Math.max(1, R * Math.log(2)) * 1.15);
            sa.text('equal T and P before and after: no heat, no work', 5, 3.55, { align: 'center', size: 11, color: 'muted' });
            sb.setTitle('replacement path: semipermeable pistons, each gas expanding isothermally'); sb.setLabels('mole fraction of A', 'ΔS_mix (J/K)');
            sb.setView([0, 1], [0, 6.5]);
            sb.fn((z) => -R * (z * Math.log(z) + (1 - z) * Math.log(1 - z)), { color: 'green', width: 2.6, domain: [0.001, 0.999] });
            sb.hline(R * Math.log(2), { color: 'faint', dash: [4, 4] }); sb.text('R ln 2 = 5.76 J/K', 0.02, R * Math.log(2), { dy: -9, size: 11, color: 'muted' });
            sb.dot(x, dS, { r: 6, color: 'green' });
            res = { gen: dS, txt: `$-nR[x\\ln x + (1-x)\\ln(1-x)]$ = ${v.fix(dS, 3)} J/K (largest, $R\\ln 2$, at $x = 1/2$)` };
            v.legend([['green', 'entropy of mixing'], ['orange', 'gas A', { dot: true }], ['teal', 'gas B', { dot: true }]]);
          } else {
            const Cw = 4184, W = u * 100000, Tf = T0 + W / Cw, dS = Cw * Math.log(Tf / T0);
            sa.rect(3, 3.9, 7, 6.5, { fill: pick(rp, (Tf - 150) / 450), fillAlpha: 0.55, color: 'ink', width: 1.6, radius: 4 });
            sa.line(5, 6.9, 5, 4.6, { color: 'muted', width: 3 }); for (const s of [-1, 1]) sa.rect(5 + s * 0.15, 4.3, 5 + s * 1.1, 4.9, { fill: 'muted', fillAlpha: 0.8, stroke: false });
            sa.text(`1 kg of water, ${T0} K → ${Tf.toFixed(2)} K`, 5, 3.55, { align: 'center', size: 11, color: 'muted' });
            sa.text(`paddle work W = ${(W / 1000).toFixed(1)} kJ`, 5, 6.75, { dx: 0, align: 'center', size: 11.5, color: 'orange', weight: 650 });
            bars(dS, 0, 0.8, 0.6, 8.4, 2.0, Math.max(1, Cw * Math.log((T0 + 100000 / Cw) / T0)) * 1.1);
            sb.setTitle('replacement path: heat the water reversibly from reservoirs'); sb.setLabels('heat added reversibly Q (J)', '1/T  (1/K)');
            sb.setView([0, 100000], [0, 1.2 / T0]);
            sb.fn((q) => 1 / (T0 + q / Cw), { color: 'red', width: 2.4, domain: [0, 100000] });
            sb.between((q) => 1 / (T0 + q / Cw), () => 0, 0, W, { fill: 'red', fillAlpha: 0.2 });
            sb.text(`area = C ln(T_f/T₀) = ${v.fix(dS, 1)} J/K`, Math.max(W / 2, 22000), 0.45 / T0, { align: 'center', size: 11.5, weight: 650, color: 'red', plate: true });
            res = { gen: dS, txt: `$C\\ln(T_f/T_0)$ = ${v.fix(dS, 2)} J/K for $W$ = ${v.fix(W / 1000, 1)} kJ of work that could have lifted a weight` };
            v.legend([['red', '1/T of the water'], ['red', 'ΔS of the water', { area: true }]]);
          }
        });
        v.readout(() => res ? `${res.txt} · entropy created $S_{\\text{gen}} = \\Delta S_{\\text{univ}}$ = **${v.fix(res.gen, 3)} J/K** ${res.gen > 1e-9 ? '> 0' : '(nothing has happened yet)'}` : '');
      },
    },
    // ------------------------------------------------------------------ 2.13
    {
      num: '2.13', kind: 'Model', name: 'Refrigerators and heat pumps',
      statement: String.raw`A **refrigerator** or **heat pump** is a heat engine run backwards: work $W$ moves heat $Q_c$ out of a cold space and delivers $Q_h = Q_c + W$ to a warm one. Its performance is measured by a **coefficient of performance**: $K = Q_c/W$ for cooling, $K_{hp} = Q_h/W = K + 1$ for heating. By Carnot's theorem (2.5, 2.7), between temperatures $T_c$ and $T_h$
$$K \le \frac{T_c}{T_h - T_c}, \qquad K_{hp} \le \frac{T_h}{T_h - T_c},$$
with equality for the reversed Carnot cycle. Both grow without bound as $T_h - T_c \to 0$: pumping heat across a small temperature difference is cheap.`,
      idea: String.raw`Run a Carnot cycle (2.4) counter-clockwise: it absorbs $Q_c = T_c\Delta S$ along the cold isotherm and rejects $Q_h = T_h\Delta S$ along the hot one, and $W = Q_h - Q_c$. The ratios follow at once. Any refrigerator beating them could be combined with a Carnot engine to move heat uphill for free, violating the Clausius statement (2.1). Because $K_{hp} > 1$, a heat pump always beats burning electricity in a resistor (COP exactly 1): it uses the work to *move* heat that is already outdoors rather than to make it.`,
      caption: String.raw`Choose a job — heating a house, a fridge or a freezer — and set the two temperatures. Left: the reversed Carnot cycle on the $T$–$S$ plane, traversed counter-clockwise; blue is the heat lifted out of the cold side, orange the work, together the heat delivered. Middle: the ideal COP against the temperature lift (black) and a real machine reaching the chosen fraction of it (dashed); the electric heater sits at COP = 1. Right: the electricity needed per kilowatt-hour of heating or cooling. Narrow the gap between the temperatures and the COP soars.`,
      deps: ['thermo-2.7'],
      see: ['energy-2.11', 'tech-10.14'],
      refs: ['Schroeder §4.2'],
      tags: ['refrigerators', 'heat pumps'],
      credit: 'W. Thomson (Kelvin), 1852 (the heat pump idea)',
      scope: String.raw`The bounds are exact; real machines reach a fraction (typically a third to a half) of them, because of finite heat-exchanger temperature differences, compressor losses and throttling. For a house the relevant $T_h$ is the temperature of the radiator water, not of the room.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Coefficient_of_performance' },
      viz(v) {
        const job = v.select('job', [{ value: 'house', label: 'heat a house' }, { value: 'fridge', label: 'refrigerator' }, { value: 'freezer', label: 'freezer' }], 'house', { onChange: () => setDefaults() });
        const tOut = v.slider('outside (°C)', -25, 35, 0, { step: 1, fmt: (x) => x.toFixed(0) + ' °C' });
        const tIn = v.slider('inside (°C)', -30, 60, 35, { step: 1, fmt: (x) => x.toFixed(0) + ' °C' });
        const frac = v.slider('real machine reaches', 0.25, 0.8, 0.5, { step: 0.01, fmt: (x) => `${Math.round(x * 100)}% of ideal` });
        const setDefaults = () => { if (job.value === 'house') { tOut.set(0); tIn.set(35); } else if (job.value === 'fridge') { tOut.set(22); tIn.set(4); } else { tOut.set(22); tIn.set(-18); } };
        const st = v.stage({ x: [0, 10], y: [0, 400], height: 300, axes: 'box', xlabel: 'S (J/K)', ylabel: 'T (K)', weight: 1, minWidth: 230, title: 'reversed Carnot cycle' });
        const sc = v.stage({ x: [0, 80], y: [0, 20], height: 300, axes: 'box', xlabel: 'temperature lift Th − Tc (K)', ylabel: 'COP', weight: 1.1, minWidth: 250, title: 'coefficient of performance' });
        const sb = v.stage({ x: [0, 3], y: [0, 1.15], height: 300, axes: 'box', ylabel: 'kWh of electricity', weight: 0.8, minWidth: 210, xticks: [], title: 'per kWh of heat (or cooling)' });
        let res = null;
        v.render(() => {
          const heat = job.value === 'house';
          let Th, Tc;
          if (heat) { Th = Math.max(tIn.value, tOut.value + 1) + 273.15; Tc = tOut.value + 273.15; } else { Th = tOut.value + 273.15; Tc = Math.min(tIn.value, tOut.value - 1) + 273.15; }
          const lift = Th - Tc, Kc = Tc / lift, Kh = Th / lift, K = heat ? Kh : Kc, Kr = frac.value * K;
          // T–S
          const S1 = 3, S2 = 7, top = Math.max(400, Th * 1.15);
          st.setView([0, 10], [0, top]);
          st.rect(S1, 0, S2, Tc, { fill: 'blue', fillAlpha: 0.2, stroke: false }); st.rect(S1, Tc, S2, Th, { fill: 'orange', fillAlpha: 0.32, stroke: false });
          st.rect(S1, Tc, S2, Th, { color: 'ink', width: 2 });
          for (const [a, b] of [[[S2, Tc], [S1, Tc]], [[S1, Tc], [S1, Th]], [[S1, Th], [S2, Th]], [[S2, Th], [S2, Tc]]]) st.arrow(lerp(a[0], b[0], 0.4), lerp(a[1], b[1], 0.4), lerp(a[0], b[0], 0.6), lerp(a[1], b[1], 0.6), { color: 'ink', width: 2, head: 9 });
          st.text(`Qc = Tc ΔS`, 5, Tc / 2, { align: 'center', size: 11.5, weight: 650, color: 'blue', plate: true });
          if (lift > 18) st.text('W', 5, (Th + Tc) / 2, { align: 'center', size: 13, weight: 700, color: 'orange' });
          st.text(`Th = ${Th.toFixed(0)} K`, S2 + 0.15, Th, { dy: -9, size: 11, color: 'red' }); st.text(`Tc = ${Tc.toFixed(0)} K`, S2 + 0.15, Tc, { dy: 11, size: 11, color: 'blue' });
          // COP curves (at the current temperature on the job's fixed side)
          const fixedT = heat ? Tc : Th;
          const curve = (d) => (heat ? (fixedT + d) / d : (fixedT - d) / d);
          sc.setView([0, 80], [0, 20]);
          sc.hline(1, { color: 'red', width: 1.6, dash: [5, 4] }); sc.text('electric heater: COP = 1', 3, 1, { dy: -10, size: 11, color: 'red', plate: true });
          sc.fn((d) => curve(d), { color: 'ink', width: 2.4, domain: [2, 80] });
          sc.fn((d) => frac.value * curve(d), { color: 'accent', width: 2, dash: [6, 4], domain: [2, 80] });
          sc.dot(lift, Math.min(K, 19.6), { r: 6, color: 'ink' }); sc.dot(lift, Math.min(Kr, 19.6), { r: 6, color: 'accent' });
          sc.text(`ideal ${v.fix(K, 2)}`, lift, Math.min(K, 19.6), { dx: 9, dy: -10, size: 11.5, weight: 650, plate: true });
          sc.text(`real ${v.fix(Kr, 2)}`, lift, Math.min(Kr, 19.6), { dx: 9, dy: 12, size: 11.5, weight: 650, color: 'accent', plate: true });
          // electricity per kWh
          const vals = heat ? [[1, 'resistor', 'red'], [1 / Kr, 'real heat pump', 'accent'], [1 / K, 'ideal', 'ink']] : [[1 / Kr, 'real', 'accent'], [1 / K, 'ideal', 'ink']];
          sb.setView([0, vals.length], [-0.12, 1.18]);
          sb.hline(0, { color: 'muted', width: 1 });
          vals.forEach(([e, lab, col], k) => { bar(sb, k + 0.5, Math.min(e, 1.1), 0.3, col); sb.text(`${v.fix(e, 2)} kWh`, k + 0.5, Math.min(e, 1.1), { dy: -10, align: 'center', size: 11, weight: 650, color: col }); sb.text(lab, k + 0.5, -0.06, { align: 'center', size: 10.5, color: col, weight: 600 }); });
          res = { heat, Th, Tc, K, Kr, Kc, Kh };
        });
        v.legend([['ink', 'ideal (reversed Carnot) COP'], ['accent', 'real machine', { dash: true }], ['red', 'resistive heater', { dash: true }]]);
        v.readout(() => {
          if (!res) return '';
          const { heat, Th, Tc, K, Kr, Kc, Kh } = res;
          return `$T_c$ = ${v.fix(Tc, 1)} K, $T_h$ = ${v.fix(Th, 1)} K · ideal cooling COP $T_c/(T_h - T_c)$ = ${v.fix(Kc, 2)}, ideal heating COP $T_h/(T_h - T_c)$ = ${v.fix(Kh, 2)} (always one more) · ${heat ? `a real heat pump at ${Math.round(frac.value * 100)}% of ideal delivers ${v.fix(Kr, 2)} kWh of heat per kWh of electricity — **${v.fix(Kr, 1)}× better than a resistor**` : `a real machine at ${Math.round(frac.value * 100)}% of ideal removes ${v.fix(Kr, 2)} kWh of heat per kWh of electricity`}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.14
    {
      num: '2.14', kind: 'Model', name: 'Otto and Diesel cycles',
      statement: String.raw`In the air-standard idealization of internal-combustion engines, a fixed charge of air ($\gamma = 1.4$) is compressed adiabatically by the **compression ratio** $r = V_{\max}/V_{\min}$, receives the fuel's heat, expands adiabatically, and rejects heat at constant volume. In the **Otto cycle** (spark ignition) heat is added at constant volume, giving
$$\eta_{\text{Otto}} = 1 - r^{1-\gamma}.$$
In the **Diesel cycle** (compression ignition) heat is added at constant pressure while the volume grows by the cut-off ratio $\rho$:
$$\eta_{\text{Diesel}} = 1 - r^{1-\gamma}\,\frac{\rho^\gamma - 1}{\gamma(\rho - 1)},$$
lower than Otto at the same $r$, but diesels run at much higher $r$ because the fuel is injected only after compression. Both stay below the Carnot efficiency for the highest and lowest temperatures they reach.`,
      idea: String.raw`Along the adiabats $TV^{\gamma-1}$ is constant (1.16), so in the Otto cycle the temperatures at the four corners satisfy $T_2/T_1 = T_3/T_4 = r^{\gamma-1}$. Heat comes in as $C_V(T_3 - T_2)$ and goes out as $C_V(T_4 - T_1)$; their ratio is $r^{1-\gamma}$, which gives $\eta$ without knowing how much fuel burns. The heat enters at temperatures between $T_2$ and $T_3$, not all at $T_3$, so by 2.7 the efficiency falls short of $1 - T_1/T_3$. Petrol engines are limited to $r \approx 10$–12 by knock (self-ignition of the compressed mixture); diesels use $r \approx 15$–22.`,
      caption: String.raw`Watch the engine run: four strokes (intake, compression, power, exhaust) of a piston driven by a crank, with the state tracing its loop on the $P$–$V$ diagram (orange: Otto, teal: Diesel, both for a 500 cm³ cylinder and the same heat per charge). Switch which engine is animated, and drag the compression ratios. Right: efficiency against compression ratio; the dots are the two engines, the open circles above them the Carnot limit for each one's hottest and coldest temperatures. The shaded band marks where petrol engines knock.`,
      deps: ['thermo-2.3', 'thermo-1.16'],
      see: ['energy-2.6', 'energy-2.7'],
      refs: ['Schroeder §4.3'],
      tags: ['engines', 'internal combustion'],
      credit: 'N. Otto, 1876 (four-stroke engine; cycle proposed by Beau de Rochas, 1862); R. Diesel, 1893',
      scope: String.raw`Air-standard model: ideal gas with constant $\gamma$, no friction, instantaneous valve events and combustion. Real engines reach roughly 25–40% (petrol) and 35–50% (diesel), well below these figures, because of heat losses, pumping work, incomplete expansion and the drop of $\gamma$ at high temperature.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Otto_cycle' },
      viz(v) {
        const g = 1.4, cv = 0.718, cp = 1.005, T1 = 300, P1 = 100, Vs = 500; // kJ/(kg K), K, kPa, cm³
        const anim = v.select('animate', [{ value: 'otto', label: 'Otto (petrol)' }, { value: 'diesel', label: 'Diesel' }], 'otto');
        const rO = v.slider('Otto compression ratio', 4, 14, 9.5, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const rD = v.slider('Diesel compression ratio', 12, 24, 18, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const q = v.slider('heat per charge', 800, 2500, 1800, { step: 10, fmt: (x) => x.toFixed(0) + ' kJ/kg' });
        const se = v.stage({ x: [0, 6], y: [0, 9.6], equal: true, height: 330, axes: false, weight: 0.6, minWidth: 170 });
        const sp = v.stage({ x: [0, 620], y: [0, 120], height: 330, axes: 'box', xlabel: 'V (cm³)', ylabel: 'P (bar)', weight: 1.1, minWidth: 260, title: '$P$–$V$ loops' });
        const sn = v.stage({ x: [2, 26], y: [0, 1], height: 330, axes: 'box', xlabel: 'compression ratio r', ylabel: 'efficiency', weight: 1, minWidth: 240, title: 'efficiency against compression' });
        const otto = (r) => { const T2 = T1 * r ** (g - 1), T3 = T2 + q.value / cv, T4 = T3 * r ** (1 - g); return { r, T2, T3, T4, eta: 1 - r ** (1 - g), Tmax: T3, rho: 1 }; };
        const diesel = (r) => { const T2 = T1 * r ** (g - 1), T3 = T2 + q.value / cp, rho = T3 / T2, T4 = T3 * (rho / r) ** (g - 1); return { r, T2, T3, T4, rho, eta: 1 - r ** (1 - g) * (rho ** g - 1) / (g * (rho - 1)), Tmax: T3 }; };
        // the cycle as a function of crank angle θ ∈ [0, 4π): V (cm³) and P (bar)
        const RC = 1, LR = 3.6;
        const disp = (th) => RC * (1 - Math.cos(th)) + LR - Math.sqrt(LR * LR - RC * RC * Math.sin(th) ** 2); // 0 at TDC, 2 at BDC
        const state = (c, kind, th) => {
          const Vmin = Vs / (c.r - 1), V = Vmin + Vs * disp(th) / 2, Vmax = Vmin + Vs, P2 = P1 * c.r ** g;
          const a = ((th % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
          let P, phase;
          if (a < Math.PI) { P = P1; phase = 'intake'; }
          else if (a < 2 * Math.PI) { P = P1 * (Vmax / V) ** g; phase = 'compression'; }
          else if (a < 3 * Math.PI) {
            phase = 'power';
            if (kind === 'otto') P = P2 * (c.T3 / c.T2) * (Vmin / V) ** g;
            else { const Vc = Vmin * c.rho; P = V <= Vc ? P2 : P2 * (Vc / V) ** g; if (V <= Vc) phase = 'injection and burning'; }
          } else { P = P1; phase = 'exhaust'; }
          return { V, P: P / 100, phase, Vmin, Vmax };
        };
        const loop = (c, kind) => {
          const Vmin = Vs / (c.r - 1), Vmax = Vmin + Vs, P2 = P1 * c.r ** g, pts = [];
          for (let i = 0; i <= 60; i++) { const V = Vmax + (Vmin - Vmax) * i / 60; pts.push([V, P1 * (Vmax / V) ** g / 100]); }
          if (kind === 'otto') { const P3 = P2 * c.T3 / c.T2; for (let i = 0; i <= 80; i++) { const V = Vmin + (Vmax - Vmin) * i / 80; pts.push([V, P3 * (Vmin / V) ** g / 100]); } }
          else { const Vc = Vmin * c.rho; pts.push([Vc, P2 / 100]); for (let i = 0; i <= 80; i++) { const V = Vc + (Vmax - Vc) * i / 80; pts.push([V, P2 * (Vc / V) ** g / 100]); } }
          pts.push([Vmax, P1 / 100]); return pts;
        };
        let cur = null;
        v.animate((t) => {
          const O = otto(rO.value), D = diesel(rD.value), kind = anim.value, c = kind === 'otto' ? O : D;
          const th = (t * 2 * Math.PI / 1.6) % (4 * Math.PI), s = state(c, kind, th);
          // P–V
          const LO = loop(O, 'otto'), LD = loop(D, 'diesel'), pmax = Math.max(...LO.map((p) => p[1]), ...LD.map((p) => p[1]));
          sp.setView([0, 620], [0, pmax * 1.12]);
          sp.poly(LO, { fill: 'orange', fillAlpha: kind === 'otto' ? 0.16 : 0.05, color: 'orange', width: kind === 'otto' ? 2.6 : 1.4 });
          sp.poly(LD, { fill: 'teal', fillAlpha: kind === 'diesel' ? 0.16 : 0.05, color: 'teal', width: kind === 'diesel' ? 2.6 : 1.4 });
          sp.line(s.Vmin, P1 / 100, s.Vmax, P1 / 100, { color: 'muted', width: 1.4, dash: [4, 3] });
          sp.dot(s.V, s.P, { r: 7, color: 'gold' });
          v.legend([['orange', `Otto cycle, r = ${v.fix(O.r, 1)}`], ['teal', `Diesel cycle, r = ${v.fix(D.r, 1)}`], ['gold', 'state now', { dot: true }]]);
          // engine
          // drawn to scale: crank radius 1, rod 3.6, stroke 2, clearance stroke/(r − 1)
          const cx = 3, cyC = 1.25, ang = th, pin = cyC + Math.cos(ang) + Math.sqrt(LR * LR - Math.sin(ang) ** 2), pistonY = pin + 0.55;
          const yT = cyC + 1 + LR + 0.55 + 2 / (c.r - 1), yB = cyC + LR - 1 - 0.3, dY = pin - (cyC + LR - 1);
          const fill = s.phase === 'exhaust' ? 'muted' : s.phase.startsWith('inj') || (s.phase === 'power' && dY > 1.6) ? 'red' : s.phase === 'power' ? 'orange' : s.phase === 'compression' ? 'purple' : 'teal';
          se.rect(1.85, pistonY, 4.15, yT, { fill, fillAlpha: 0.45, stroke: false });
          se.line(1.75, yT, 1.75, yB, { color: 'ink', width: 2.6 }); se.line(4.25, yT, 4.25, yB, { color: 'ink', width: 2.6 }); se.line(1.75, yT, 4.25, yT, { color: 'ink', width: 2.6 });
          se.rect(1.85, pin - 0.3, 4.15, pistonY, { fill: 'muted', fillAlpha: 0.9, color: 'ink', width: 1.2 });
          const crank = [cx + Math.sin(ang), cyC + Math.cos(ang)];
          se.circle(cx, cyC, 1.0, { color: 'muted', width: 1.2, dash: [3, 3] });
          se.line(cx, pin, crank[0], crank[1], { color: 'ink', width: 3 }); se.line(cx, cyC, crank[0], crank[1], { color: 'ink', width: 4 }); se.dot(cx, pin, { r: 3.5, color: 'ink' });
          se.dot(crank[0], crank[1], { r: 4, color: 'ink' }); se.dot(cx, cyC, { r: 4, color: 'ink' });
          const a = ((th % (4 * Math.PI)) + 4 * Math.PI) % (4 * Math.PI);
          const vIn = a < Math.PI, vEx = a > 3 * Math.PI;
          se.line(2.25, yT + (vIn ? -0.18 : 0.02), 2.25, yT + 0.8, { color: vIn ? 'teal' : 'muted', width: 4 }); se.text('in', 2.25, yT + 1.05, { align: 'center', size: 10, color: vIn ? 'teal' : 'muted' });
          se.line(3.75, yT + (vEx ? -0.18 : 0.02), 3.75, yT + 0.8, { color: vEx ? 'ink' : 'muted', width: 4 }); se.text('out', 3.75, yT + 1.05, { align: 'center', size: 10, color: vEx ? 'ink' : 'muted' });
          if (kind === 'otto' && a > 1.97 * Math.PI && a < 2.2 * Math.PI) se.dot(3, yT - 0.05, { r: 7, color: 'gold' });
          if (kind === 'diesel' && s.phase.startsWith('inj')) for (let k = -1; k <= 1; k++) se.line(3, yT, 3 + 0.35 * k, yT - 0.55, { color: 'gold', width: 2.4 });
          se.text(s.phase, 3, yT + 1.6, { align: 'center', size: 11.5, weight: 700, color: fill === 'muted' ? 'ink' : fill });
          // efficiency plot
          sn.vband(11, 26, { color: 'red', alpha: 0.07 }); sn.text('petrol engines knock', 18.5, 0.25, { align: 'center', size: 10.5, color: 'red', plate: true });
          sn.fn((r) => 1 - r ** (1 - g), { color: 'orange', width: 2.4, domain: [2, 26] });
          sn.fn((r) => diesel(r).eta, { color: 'teal', width: 2.4, domain: [2, 26] });
          for (const [cc, col] of [[O, 'orange'], [D, 'teal']]) { sn.dot(cc.r, cc.eta, { r: 6, color: col }); const ec = 1 - T1 / cc.Tmax; sn.dot(cc.r, ec, { r: 5.5, hollow: true, color: col }); sn.line(cc.r, cc.eta, cc.r, ec, { color: col, width: 1, dash: [3, 3] }); }
          sn.text('○ Carnot for each engine’s extremes', 25.6, 0.97, { align: 'right', size: 10.5, color: 'muted', plate: true });
          cur = { O, D, s, kind };
        }, { still: 2.1 });
        v.readout(() => {
          if (!cur) return '';
          const { O, D } = cur;
          return `Otto, $r$ = ${v.fix(O.r, 1)}: $\\eta = 1 - r^{1-\\gamma}$ = **${v.fix(O.eta, 3)}**, peak ${v.fix(O.T3, 0)} K, ${v.fix(P1 * O.r ** g * O.T3 / O.T2 / 100, 0)} bar, Carnot for its extremes ${v.fix(1 - T1 / O.T3, 3)} · Diesel, $r$ = ${v.fix(D.r, 1)}, cut-off $\\rho$ = ${v.fix(D.rho, 2)}: $\\eta$ = **${v.fix(D.eta, 3)}** (an Otto at the same $r$ would give ${v.fix(1 - D.r ** (1 - g), 3)}), peak ${v.fix(D.T3, 0)} K, ${v.fix(P1 * D.r ** g / 100, 0)} bar`;
        });
      },
    },
  ],
};
