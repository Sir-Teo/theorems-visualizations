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
      caption: String.raw`An isolated box of simulated hard spheres: gas A (100 light molecules, orange) starts hot and dense, gas B (60 molecules of twice the mass, teal) cool and dilute. Choose what the partition lets through: **heat** only (a light wall jiggling in place), **heat and volume** (a free piston) or also **particles** (the partition is lifted at $t = 10$). The curves are each gas's entropy, measured from the simulation as $N[\ln(V/N) + \tfrac32\ln T]$ (per slab for mixing gases, in units of $k$; coarse-graining into slabs costs a few $k$), and their sum. The total climbs to the dashed line — the maximum entropy allowed by the constraints, computed from the conserved energy — while gas A's entropy can fall as it gives up heat. Small wiggles are the fluctuations of a few hundred molecules.`,
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
          sp.heat((V, P) => S(V, P), { range: [S0 - 90, S0 + 90], cmap: 'theme-diverging', neg: 'blue', pos: 'red', res: 4, key: 'S-' + g + Math.round(S0) });
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
          items.forEach(([val, lab, col], k) => { const x = x0 + w * (k + 0.5) / 3, hh = hgt * val / mx; sa.rect(x - 0.35, y0, x + 0.35, y0 + hh, { fill: col, fillAlpha: 0.75, color: col, width: 1 }); sa.text(lab, x, y0 - 0.3, { align: 'center', size: 10.5, color: col }); sa.text(`${v.fix(val, 2)} J/K`, x, y0 + hh, { dy: val >= 0 ? -9 : 9, align: 'center', size: 10.5, weight: 650, color: col }); });
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
            if (V2 < 39.9) { const xw = 0.7 + 8.6 * V2 / 40; sa.rect(xw, 4, 9.3, 6.4, { fill: 'faint', fillAlpha: 0.25, stroke: false, hatch: 'muted', hatchGap: 7, hatchAlpha: 0.3 }); sa.line(xw, 4, xw, 6.4, { color: 'ink', width: 2 }); }
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
            sb.setTitle('replacement path: semipermeable pistons'); sb.setLabels('mole fraction of A', 'entropy of mixing (J/K)');
            sb.setView([0, 1], [0, 6.5]);
            sb.fn((z) => -R * (z * Math.log(z) + (1 - z) * Math.log(1 - z)), { color: 'green', width: 2.6, domain: [0.001, 0.999] });
            sb.hline(R * Math.log(2), { color: 'faint', dash: [4, 4] }); sb.text('R ln 2 = 5.76 J/K', 0.98, R * Math.log(2), { dy: -9, align: 'right', size: 11, color: 'muted' });
            sb.dot(x, dS, { r: 6, color: 'green' });
            res = { gen: dS, txt: `$-nR[x\\ln x + (1-x)\\ln(1-x)]$ = ${v.fix(dS, 3)} J/K (largest, $R\\ln 2$, at $x = 1/2$)` };
            v.legend([['green', 'entropy of mixing'], ['orange', 'gas A', { dot: true }], ['teal', 'gas B', { dot: true }]]);
          } else {
            const Cw = 4184, W = u * 100000, Tf = T0 + W / Cw, dS = Cw * Math.log(Tf / T0);
            sa.rect(3, 3.9, 7, 6.5, { fill: pick(rp, (Tf - 150) / 450), fillAlpha: 0.55, color: 'ink', width: 1.6, radius: 4 });
            sa.line(5, 6.9, 5, 4.6, { color: 'muted', width: 3 }); for (const s of [-1, 1]) sa.rect(5 + s * 0.15, 4.3, 5 + s * 1.1, 4.9, { fill: 'muted', fillAlpha: 0.8, stroke: false });
            sa.text(`1 kg of water, ${T0} K → ${Tf.toFixed(2)} K`, 5, 3.55, { align: 'center', size: 11, color: 'muted' });
            sa.text(`paddle work W = ${(W / 1000).toFixed(1)} kJ`, 4.8, 6.75, { align: 'right', size: 11.5, color: 'orange', weight: 650 });
            bars(dS, 0, 0.8, 0.6, 8.4, 2.0, Math.max(1, Cw * Math.log((T0 + 100000 / Cw) / T0)) * 1.1);
            sb.setTitle('replacement path: heat the water reversibly'); sb.setLabels('heat added reversibly Q (J)', '1/T  (1/K)');
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
    // ------------------------------------------------------------------ 2.15
    {
      num: '2.15', kind: 'Model', name: 'Stirling engine',
      statement: String.raw`The ideal **Stirling cycle** takes a fixed mass of gas through two isotherms joined by two constant-volume steps: (1) isothermal expansion at $T_h$ from $V_{\min}$ to $V_{\max}$, absorbing $nRT_h\ln r$; (2) cooling at constant volume $V_{\max}$ from $T_h$ to $T_c$; (3) isothermal compression at $T_c$, rejecting $nRT_c\ln r$; (4) heating at constant volume back to $T_h$ ($r = V_{\max}/V_{\min}$). A **regenerator** — a porous matrix the gas shuttles through — stores the heat given up in step 2 and returns it in step 4. With a perfect regenerator the only external heat is taken in at $T_h$ and rejected at $T_c$, and
$$\eta = 1 - \frac{T_c}{T_h},$$
the Carnot efficiency. If the regenerator recovers only a fraction $\varepsilon$ of $Q_{\text{reg}} = nC_V(T_h - T_c)$, the rest must come from the flame and
$$\eta = \frac{R(T_h - T_c)\ln r}{RT_h\ln r + (1 - \varepsilon)C_V(T_h - T_c)}.$$`,
      idea: String.raw`The isochoric steps exchange heat across the whole temperature range, which would ruin the efficiency if it came from the hot reservoir and went to the cold one. The regenerator makes those exchanges internal: each slice of the matrix takes heat from the gas passing one way and gives it back, at the same temperature, when the gas passes back — so these exchanges are reversible and cost nothing. What remains is heat in at $T_h$ and out at $T_c$ only, which by 2.5 and 2.7 means Carnot's efficiency. Unlike Carnot's cycle, the Stirling cycle has fat isochoric corners, so it delivers far more work per cycle for the same pressure range.`,
      caption: String.raw`An alpha-type Stirling engine running the ideal cycle: the hot cylinder (left, over the flame) and the cold cylinder (right, water-cooled) are joined through the regenerator. Watch the pistons: in step 1 the gas expands in the hot cylinder, in step 2 both pistons move together and push it through the regenerator into the cold side, and so on; the dots are proportional to how much gas is on each side. The regenerator's colour bar shows the heat it holds. Drag the **regenerator effectiveness** down to zero: the flame must now also reheat the gas in step 4, and the efficiency falls well below Carnot's.`,
      deps: ['thermo-2.4'],
      see: ['energy-2.12'],
      refs: ['Schroeder §4.3'],
      tags: ['engines', 'Stirling'],
      credit: 'R. Stirling, patent 1816',
      scope: String.raw`Ideal cycle: isothermal cylinders, no dead volume, a regenerator with no flow losses and discontinuous piston motion. Real Stirling engines move their pistons sinusoidally, have dead volume and imperfect heat exchangers, and typically reach about half of the Carnot efficiency.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Stirling_engine' },
      viz(v) {
        const eps = v.slider('regenerator effectiveness ε', 0, 1, 1, { step: 0.01, fmt: (x) => v.fix(x, 2) });
        const Th = v.slider('$T_h$', 450, 1000, 800, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const Tc = v.slider('$T_c$', 280, 380, 300, { step: 5, fmt: (x) => x.toFixed(0) + ' K' });
        const rr = v.slider('compression ratio $r$', 1.5, 4, 2.5, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const se = v.stage({ x: [0, 12], y: [0.4, 6.8], equal: true, height: 260, axes: false, full: true });
        const sp = v.stage({ x: [0, 4.5], y: [0, 500], height: 260, axes: 'box', xlabel: 'V (L)', ylabel: 'P (kPa)', weight: 1, title: 'ideal Stirling cycle (0.05 mol of helium)' });
        const sb = v.stage({ x: [0, 1], y: [0, 5], height: 260, axes: false, weight: 1.15, title: 'heat and work per cycle' });
        const n = 0.05, cv = 1.5 * R, PER = 7;
        const R_ = v.rng(17), dots = Array.from({ length: 46 }, () => [R_(), R_()]);
        let cur = null;
        v.animate((t) => {
          const h = Th.value, c = Math.min(Tc.value, h - 20), r = rr.value, e = eps.value, Vmin = 1, Vmax = r;
          const u = ((t / PER) * 4) % 4, ph = Math.floor(u), q = u - ph, ease = q * q * (3 - 2 * q);
          let Vh, Vc;
          if (ph === 0) { Vh = Vmin + (Vmax - Vmin) * ease; Vc = 0; } else if (ph === 1) { Vh = Vmax * (1 - ease); Vc = Vmax * ease; } else if (ph === 2) { Vh = 0; Vc = Vmax - (Vmax - Vmin) * ease; } else { Vh = Vmin * ease; Vc = Vmin * (1 - ease); }
          const P = n * R / (Vh / h + Vc / c), fh = (Vh / h) / (Vh / h + Vc / c), V = Vh + Vc;
          const Qh = n * R * h * Math.log(r), Qc = n * R * c * Math.log(r), Qreg = n * cv * (h - c), W = Qh - Qc, Qin = Qh + (1 - e) * Qreg, Qout = Qc + (1 - e) * Qreg, eta = W / Qin, eC = 1 - c / h;
          // regenerator heat content: rises in step 2, falls in step 4
          const held = ph === 0 ? 0 : ph === 1 ? e * ease : ph === 2 ? e : e * (1 - ease);
          // ---- engine
          const y0 = 2.4, y1 = 4.6, L = 3.4, xh = 4.4, xc = 7.6, wH = L * Vh / Vmax, wC = L * Vc / Vmax;
          se.rect(xh - wH, y0, xh, y1, { fill: 'red', fillAlpha: 0.28, stroke: false }); se.rect(xc, y0, xc + wC, y1, { fill: 'blue', fillAlpha: 0.22, stroke: false });
          se.line(xh - L - 0.6, y0, xh, y0, { color: 'ink', width: 2.4 }); se.line(xh - L - 0.6, y1, xh, y1, { color: 'ink', width: 2.4 });
          se.line(xc, y0, xc + L + 0.6, y0, { color: 'ink', width: 2.4 }); se.line(xc, y1, xc + L + 0.6, y1, { color: 'ink', width: 2.4 });
          se.line(xh, y1, xh, 4.0, { color: 'ink', width: 2.4 }); se.line(xh, y0, xh, 3.0, { color: 'ink', width: 2.4 }); se.line(xc, y1, xc, 4.0, { color: 'ink', width: 2.4 }); se.line(xc, y0, xc, 3.0, { color: 'ink', width: 2.4 });
          // regenerator matrix with a temperature gradient
          for (let k = 0; k < 16; k++) { const x = xh + (xc - xh) * k / 16; se.rect(x, 3.0, x + (xc - xh) / 16, 4.0, { fill: pick(tRamp(v), 1 - k / 15), fillAlpha: 0.55, stroke: false }); }
          se.rect(xh, 3.0, xc, 4.0, { color: 'ink', width: 1.2, hatch: 'ink', hatchGap: 5, hatchAlpha: 0.25 });
          se.text('regenerator', (xh + xc) / 2, 2.7, { align: 'center', size: 11, color: 'muted' });
          se.rect(xh + 0.3, 4.75, xc - 0.3, 5.05, { color: 'purple', width: 1 }); se.rect(xh + 0.3, 4.75, xh + 0.3 + (xc - xh - 0.6) * held, 5.05, { fill: 'purple', fillAlpha: 0.75, stroke: false });
          se.text(`heat held ${v.fix(held * Qreg, 0)} J`, (xh + xc) / 2, 5.35, { align: 'center', size: 10.5, color: 'purple' });
          // pistons and rods
          se.rect(xh - wH - 0.35, y0 + 0.04, xh - wH, y1 - 0.04, { fill: 'muted', fillAlpha: 0.9, color: 'ink', width: 1 }); se.line(xh - wH - 0.35, 3.5, 0.2, 3.5, { color: 'muted', width: 4 });
          se.rect(xc + wC, y0 + 0.04, xc + wC + 0.35, y1 - 0.04, { fill: 'muted', fillAlpha: 0.9, color: 'ink', width: 1 }); se.line(xc + wC + 0.35, 3.5, 11.8, 3.5, { color: 'muted', width: 4 });
          // gas dots
          const nh = Math.round(fh * dots.length);
          dots.forEach(([a, b], i) => { if (i < nh) { if (wH > 0.05) se.dot(xh - wH * (0.05 + 0.9 * a), y0 + 0.15 + 1.9 * b, { r: 2.6, color: 'red', ring: false }); } else if (wC > 0.05) se.dot(xc + wC * (0.05 + 0.9 * a), y0 + 0.15 + 1.9 * b, { r: 2.6, color: 'blue', ring: false }); });
          if ((ph === 1 || ph === 3) && q > 0.05 && q < 0.95) for (let k = 0; k < 6; k++) { const s = ((k / 6 + t * 0.9) % 1), x = ph === 1 ? xh + (xc - xh) * s : xc - (xc - xh) * s; se.dot(x, 3.5 + 0.25 * Math.sin(k * 2.1), { r: 2.6, color: pick(tRamp(v), 1 - (x - xh) / (xc - xh)), ring: false }); }
          // flame and cooling
          for (let k = 0; k < 5; k++) { const x = xh - L + 0.5 + k * 0.65, fl = ph === 0 || (ph === 3 && e < 0.999) ? 1 : 0.35; se.poly([[x - 0.2, 1.3], [x + 0.2, 1.3], [x, 1.3 + 0.75 * fl]], { fill: 'orange', fillAlpha: 0.8 * fl, color: 'red', width: 1 }); }
          se.text('flame', xh - L / 2, 0.85, { align: 'center', size: 11, color: 'red' });
          for (let k = 0; k < 5; k++) se.line(xc + 0.5 + k * 0.65, 1.2, xc + 0.5 + k * 0.65, 2.2, { color: 'blue', width: 2, alpha: ph === 2 ? 1 : 0.35 });
          se.text('cooling water', xc + L / 2, 0.85, { align: 'center', size: 11, color: 'blue' });
          if (ph === 0) band(v, se, [[xh - L / 2, 1.9], [xh - L / 2, 2.35]], 9, 'red');
          if (ph === 3 && e < 0.999) band(v, se, [[xh - L / 2, 1.9], [xh - L / 2, 2.35]], 3 + 8 * (1 - e), 'red');
          if (ph === 2) band(v, se, [[xc + L / 2, 2.35], [xc + L / 2, 1.9]], 9, 'blue');
          const names = ['1: isothermal expansion at Th — heat from the flame', '2: constant volume — gas gives heat to the regenerator', '3: isothermal compression at Tc — heat to the cooling water', e < 0.999 ? '4: constant volume — regenerator (and flame) reheat the gas' : '4: constant volume — the regenerator reheats the gas'];
          se.text(names[ph], 6, 6.45, { align: 'center', size: 12, weight: 650 });
          // ---- P–V
          const pmax = n * R * h / Vmin;
          sp.setView([0, Vmax * 1.15], [0, pmax * 1.15]);
          const iso = (T, a, b) => Array.from({ length: 61 }, (_, i) => { const VV = a + (b - a) * i / 60; return [VV, n * R * T / VV]; });
          sp.poly([...iso(h, Vmin, Vmax), ...iso(c, Vmax, Vmin)], { fill: 'orange', fillAlpha: 0.15, stroke: false });
          sp.path(iso(h, Vmin, Vmax), { color: 'red', width: ph === 0 ? 3.4 : 2 }); sp.path(iso(c, Vmax, Vmin), { color: 'blue', width: ph === 2 ? 3.4 : 2 });
          sp.line(Vmax, n * R * h / Vmax, Vmax, n * R * c / Vmax, { color: 'purple', width: ph === 1 ? 3.4 : 2, dash: [6, 4] }); sp.line(Vmin, n * R * c / Vmin, Vmin, n * R * h / Vmin, { color: 'purple', width: ph === 3 ? 3.4 : 2, dash: [6, 4] });
          sp.dot(V, P, { r: 7, color: 'gold' });
          // ---- bars
          const mx = Math.max(Qin, Qout) * 1.08, rows = [[Qin, 'red', 'heat from flame'], [e * Qreg, 'purple', 'recycled by regenerator'], [W, 'orange', 'work'], [Qout, 'blue', 'heat to cooling water']];
          rows.forEach(([val, col, lab], k) => { const yy = 4.3 - k * 1.0; sb.rect(0.42, yy - 0.3, 0.42 + 0.5 * val / mx, yy + 0.3, { fill: col, fillAlpha: 0.75, color: col, width: 1 }); sb.text(lab, 0.4, yy, { align: 'right', size: 11, color: col, weight: 600 }); sb.text(`${val.toFixed(0)} J`, 0.43 + 0.5 * val / mx, yy, { size: 11 }); });
          sb.text(`η = ${v.fix(eta, 3)}   Carnot ${v.fix(eC, 3)}`, 0.5, 0.35, { align: 'center', size: 12.5, weight: 700, color: Math.abs(eta - eC) < 1e-6 ? 'green' : 'ink' });
          cur = { eta, eC, W, Qin, Qreg, e };
        }, { still: 2.6 });
        v.legend([['red', 'isotherm at $T_h$'], ['blue', 'isotherm at $T_c$'], ['purple', 'constant-volume steps (through the regenerator)', { dash: true }]]);
        v.readout(() => cur ? `per cycle: work ${v.fix(cur.W, 1)} J, heat from the flame ${v.fix(cur.Qin, 1)} J (of which $(1-\\varepsilon)Q_{\\text{reg}}$ = ${v.fix((1 - cur.e) * cur.Qreg, 1)} J re-heats the gas in step 4) · $\\eta$ = **${v.fix(cur.eta, 4)}** vs Carnot $1 - T_c/T_h$ = ${v.fix(cur.eC, 4)} ${cur.e === 1 ? '— equal, with a perfect regenerator' : `— ${v.fix(100 * cur.eta / cur.eC, 1)}% of Carnot`}` : '');
      },
    },
    // ------------------------------------------------------------------ 2.16
    {
      num: '2.16', kind: 'Theorem', name: 'Carathéodory’s principle',
      statement: String.raw`**Principle (Carathéodory, 1909).** In every neighbourhood of any equilibrium state of a thermodynamic system there are states that cannot be reached from it by any adiabatic process.

**Theorem.** For a simple system this principle is equivalent to the existence of an empirical entropy: the inexact differential of heat has an integrating factor, $\delta Q_{\text{rev}} = \tau\,d\sigma$, so that the reversible adiabats fill state space as the level surfaces $\sigma = $ const. Every adiabatic process leaves $\sigma$ unchanged or moves it in one direction only (by convention, upward), and the states with lower $\sigma$ are adiabatically inaccessible. Identifying $\tau$ with the absolute temperature makes $\sigma$ the entropy $S$, recovering 2.9 and 2.10 without heat engines.`,
      idea: String.raw`The mathematics is a theorem on Pfaffian forms: if a form $\omega = \sum_i X_i\,dx_i$ in three or more variables had no integrating factor ($\omega \wedge d\omega \ne 0$ somewhere), curves tangent to $\omega = 0$ could join any two nearby points (Chow–Rashevskii), so every nearby state would be reachable adiabatically — contradicting the principle. In two variables every form is integrable, so the content appears with two or more work coordinates. Physically, irreversible adiabatic processes (stirring, free expansion, slamming a piston) only ever push the state to one side of the reversible adiabat through it, never to the other.`,
      caption: String.raw`Left, one mole of monatomic gas on log–log $V$–$T$ axes: from the start state A, the reversible adiabat through it (a straight line of slope −2/3 here) divides the plane. Apply adiabatic processes with the buttons — stirring, free expansion, slamming the piston in or letting it fly out, slow compression or expansion — and the state moves, but never into the red region below the adiabat. *300 random routes* tries many combinations: every end point lands on or above the line. Right, the reason in three dimensions: two gas samples in thermal contact, with volumes $V_1$ and $V_2$. Drag the loop in the $(V_1, V_2)$ plane; the gas is taken around it quasistatically and adiabatically, and the bottom panel follows its temperature. For real gases $T$ returns exactly to its start — the adiabats are surfaces. Switch to the **fictitious substance** (whose heat form has no integrating factor) and each turn ratchets $T$ down (or up, run the other way): every nearby state becomes reachable, and no entropy could exist.`,
      deps: ['thermo-2.10'],
      see: ['mfd-4.12'],
      refs: ['Tong ch. 4'],
      tags: ['entropy', 'axiomatics'],
      credit: 'C. Carathéodory, 1909 (Mathematische Annalen 67)',
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Carath%C3%A9odory%27s_theorem_(thermodynamics)' },
      viz(v) {
        const A = { V: 20, T: 300 };
        let cur = { ...A }, trail = [], cloud = [];
        const SA = () => Math.log(A.T) * 1.5 + Math.log(A.V);
        const Sf = (s) => 1.5 * Math.log(s.T) + Math.log(s.V);
        const clampS = (s) => ({ V: clamp(s.V, 2.2, 95), T: clamp(s.T, 55, 1900) });
        const moves = {
          stir: (s, k = 1) => ({ V: s.V, T: s.T + 60 * k }),
          free: (s, k = 1) => ({ V: s.V * (1 + 0.6 * k), T: s.T }),
          slam: (s, k = 1) => { const x = 1 + 2 * k, Tf = (1.5 + x) / 2.5 * s.T; return { V: Tf / (x * s.T / s.V), T: Tf }; },
          fly: (s, k = 1) => { const x = 1 - 0.7 * k, Tf = (1.5 + x) / 2.5 * s.T; return { V: Tf / (x * s.T / s.V), T: Tf }; },
          squeeze: (s, k = 1) => { const f = 1 - 0.35 * k; return { V: s.V * f, T: s.T * f ** (-2 / 3) }; },
          expand: (s, k = 1) => { const f = 1 + 0.5 * k; return { V: s.V * f, T: s.T * f ** (-2 / 3) }; },
        };
        const apply = (name) => { const nx = clampS(moves[name](cur)); trail.push({ a: cur, b: nx, rev: name === 'squeeze' || name === 'expand' }); cur = nx; };
        const randomCloud = (seed) => { const R_ = v.rng(seed), keys = Object.keys(moves); cloud = []; for (let i = 0; i < 300; i++) { let s = { ...A }; for (let j = 0; j < 3; j++) s = clampS(moves[keys[Math.floor(R_() * keys.length)]](s, R_())); cloud.push(s); } };
        for (const m of ['slam', 'expand', 'free', 'squeeze', 'fly']) apply(m); // an example route
        randomCloud(7);
        v.button('stir', () => apply('stir')); v.button('free expansion', () => apply('free')); v.button('slam piston in', () => apply('slam'));
        v.button('let piston fly out', () => apply('fly')); v.button('slow squeeze', () => apply('squeeze')); v.button('slow expansion', () => apply('expand'));
        v.button('300 random routes', () => randomCloud(Math.floor(performance.now()) % 100000 + 1));
        v.button('back to A', () => { cur = { ...A }; trail = []; cloud = []; });
        const sub = v.select('substance in the loop', [{ value: 'real', label: 'two real gases' }, { value: 'fict', label: 'fictitious substance' }], 'real');
        const rev = v.toggle('run the loop the other way', false);
        const sa = v.stage({ x: [2, 100], y: [50, 2000], xlog: true, ylog: true, height: 320, axes: 'box', xlabel: 'V (L)', ylabel: 'T (K)', weight: 1.15, title: 'what adiabatic processes can reach from A' });
        const sl = v.stage({ x: [5, 40], y: [5, 40], height: 320, axes: 'box', xlabel: 'V₁ (L)', ylabel: 'V₂ (L)', weight: 0.85, title: 'a closed loop of the two volumes' });
        const sT = v.stage({ x: [0, 3], y: [0, 1], height: 190, axes: 'box', xlabel: 'turns around the loop', ylabel: 'T (K)', full: true, title: 'temperature of the gas pair, taken around the loop three times adiabatically' });
        const hc = sl.handle(20, 20, { color: 'ink', label: 'centre', constrain: { x: [12, 32], y: [12, 32] } });
        const hr = sl.handle(28, 20, { color: 'accent', constrain: (x, y) => { const d = Math.hypot(x - hc.x, y - hc.y), rr = clamp(d, 2, Math.min(hc.x, hc.y) - 6); const a = Math.atan2(y - hc.y, x - hc.x); return [hc.x + rr * Math.cos(a), hc.y + rr * Math.sin(a)]; } });
        hc.onDrag = () => { const rr = Math.min(Math.hypot(hr.x - hc.x, hr.y - hc.y), Math.min(hc.x, hc.y) - 6); hr.set(hc.x + rr, hc.y); };
        // ratchet test (cached in the render)
        const loopRun = (fict, dir) => {
          const rad = Math.hypot(hr.x - hc.x, hr.y - hc.y), ph0 = Math.atan2(hr.y - hc.y, hr.x - hc.x), N = 600, out = [];
          let T = 300;
          const f = (ph, T_) => { const V1 = hc.x + rad * Math.cos(ph), V2 = hc.y + rad * Math.sin(ph), d1 = -rad * Math.sin(ph) * dir, d2 = rad * Math.cos(ph) * dir, g = fict ? 1 + (V1 / 20 - 1) : 1; return -(T_ / 3) * (d1 / V1 + g * d2 / V2); };
          for (let k = 0; k <= 3 * N; k++) {
            const ph = ph0 + dir * 2 * Math.PI * k / N; out.push([k / N, T]);
            const hh = 2 * Math.PI / N, p = ph0 + 2 * Math.PI * k / N * dir;
            const k1 = f(p, T), k2 = f(p + dir * hh / 2, T + hh / 2 * k1), k3 = f(p + dir * hh / 2, T + hh / 2 * k2), k4 = f(p + dir * hh, T + hh * k3);
            T += hh / 6 * (k1 + 2 * k2 + 2 * k3 + k4); void ph;
          }
          return out;
        };
        let lr = null;
        v.render(() => {
          // ---- V–T panel
          const sA = SA(), adT = (V) => Math.exp((sA - Math.log(V)) / 1.5);
          const top = [[2, adT(2)], [100, adT(100)], [100, 2000], [2, 2000]], bot = [[2, 50], [100, 50], [100, adT(100)], [2, adT(2)]];
          sa.poly(top, { fill: 'green', fillAlpha: 0.1, stroke: false }); sa.poly(bot, { fill: 'red', fillAlpha: 0.08, stroke: false, hatch: 'red', hatchAlpha: 0.22, hatchGap: 9 });
          sa.fn(adT, { color: 'purple', width: 2.4 });
          sa.text('adiabatically inaccessible from A', 2.4, 70, { size: 12, color: 'red', weight: 700, plate: true });
          sa.text('reachable', 60, 1500, { size: 12, color: 'green', weight: 700, align: 'right', plate: true });
          if (cloud.length) sa.dots(cloud.map((s) => [s.V, s.T]), { r: 2.4, color: 'green' });
          for (const sg of trail) {
            if (sg.rev) { const n = 20, pts = []; for (let i = 0; i <= n; i++) { const V = sg.a.V * (sg.b.V / sg.a.V) ** (i / n); pts.push([V, sg.a.T * (sg.a.V / V) ** (2 / 3)]); } sa.path(pts, { color: 'purple', width: 2.6 }); }
            else sa.arrow(sg.a.V, sg.a.T, sg.b.V, sg.b.T, { color: 'ink', width: 1.8, dash: [5, 4], head: 9 });
          }
          sa.dot(A.V, A.T, { r: 6, color: 'ink', label: 'A', labelPos: 'sw' });
          if (trail.length) sa.dot(cur.V, cur.T, { r: 6, color: 'gold' });
          // ---- loop panel
          const fict = sub.value === 'fict', dir = rev.value ? -1 : 1;
          const rad = Math.hypot(hr.x - hc.x, hr.y - hc.y);
          if (fict) { sl.heat((x, y) => 1 + (x / 20 - 1), { range: [0, 3], cmap: 'theme', color: 'pink', res: 6, key: 'g' }); sl.axes(); }
          sl.circle(hc.x, hc.y, rad, { color: fict ? 'pink' : 'accent', width: 2.6 });
          for (let k = 0; k < 4; k++) { const a = Math.PI / 2 * k + 0.4, b = a + 0.3 * dir; sl.arrow(hc.x + rad * Math.cos(a), hc.y + rad * Math.sin(a), hc.x + rad * Math.cos(b), hc.y + rad * Math.sin(b), { color: fict ? 'pink' : 'accent', width: 2, head: 10 }); }
          if (fict) sl.text('pressure of gas 2 depends on V₁', 6, 38.5, { size: 11, color: 'pink', weight: 650, plate: true });
          lr = loopRun(fict, dir);
          const Ts = lr.map((p) => p[1]), lo = Math.min(...Ts), hi = Math.max(...Ts), pad = Math.max(5, 0.15 * (hi - lo));
          sT.setView([0, 3], [lo - pad, hi + pad]);
          sT.hline(300, { color: 'muted', width: 1, dash: [5, 4] });
          for (let k = 1; k < 3; k++) sT.vline(k, { color: 'faint', width: 1 });
          sT.path(lr, { color: fict ? 'pink' : 'accent', width: 2.4 });
          for (let k = 1; k <= 3; k++) { const p = lr[Math.min(lr.length - 1, Math.round(k * 600))]; sT.dot(p[0], p[1], { r: 5, color: fict ? 'pink' : 'accent' }); }
          sT.text('start: 300 K', 0.02, 300, { dy: -9, size: 11, color: 'muted' });
        });
        v.legend([['purple', 'reversible adiabat through A'], ['ink', 'irreversible adiabatic jump', { dash: true }], ['green', 'end points of random routes', { dot: true }]]);
        v.readout(() => {
          const sA = SA(), dS = Sf(cur) - sA, below = cloud.filter((s) => Sf(s) < sA - 1e-9).length;
          const T1 = lr ? lr[600][1] : 300;
          return `current state: $V$ = ${v.fix(cur.V, 1)} L, $T$ = ${v.fix(cur.T, 0)} K, $(S - S_A)/R$ = ${v.fix(dS, 3)} ≥ 0${cloud.length ? ` · random routes: ${cloud.length - below} of ${cloud.length} end on or above the adiabat, ${below} below` : ''} · loop: after one adiabatic turn $T$ = ${v.fix(T1, 6)} K (${sub.value === 'real' ? 'back to 300 K: states below are out of reach' : `changed by ${v.fix(T1 - 300, 2)} K: states below and above are both reachable`})`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.17
    {
      num: '2.17', kind: 'Model', name: 'Efficiency at maximum power',
      statement: String.raw`A reversible engine has the Carnot efficiency but takes infinitely long per cycle, so it delivers no power. In the **endoreversible** model (Novikov 1957, Chambadal 1957, Curzon & Ahlborn 1975) a reversible engine runs between internal temperatures $T_{hw} < T_h$ and $T_{cw} > T_c$, and heat reaches it through finite conductances, $\dot Q_h = K_h(T_h - T_{hw})$ and $\dot Q_c = K_c(T_{cw} - T_c)$. The power $P = \dot Q_h - \dot Q_c$ vanishes both at $\eta = 0$ and at $\eta = \eta_C$, and is largest at
$$\eta^* = 1 - \sqrt{\frac{T_c}{T_h}},$$
independent of $K_h$ and $K_c$. For a broader class of **low-dissipation** engines (Esposito et al. 2010) the efficiency at maximum power is not universal but lies between $\eta_C/2$ and $\eta_C/(2 - \eta_C)$, both of which agree with $1 - \sqrt{T_c/T_h} = \eta_C/2 + \eta_C^2/8 + \dots$ to second order.`,
      idea: String.raw`Running faster means larger temperature drops across the heat exchangers, which increases the heat flow but shrinks the temperature range $T_{hw} - T_{cw}$ the reversible core can use. With the reversible core imposing $\dot Q_h/T_{hw} = \dot Q_c/T_{cw}$ (2.7), the power as a function of $T_{hw}$ and $T_{cw}$ is maximized by setting the two drops in proportion to $\sqrt{K}$; the square root of the temperature ratio drops out of the algebra, and the conductances cancel. The result describes many real power plants better than the Carnot limit does, though it is neither a bound nor exact.`,
      caption: String.raw`Drag the operating point (the engine's efficiency as a fraction of Carnot's). Left: the temperature ladder — heat flows from $T_h$ through a conductance down to the working fluid at $T_{hw}$, the reversible core works between $T_{hw}$ and $T_{cw}$, and heat leaks on to $T_c$; arrows are drawn to scale. Middle: power against efficiency, computed honestly from the model; the peak sits on $1 - \sqrt{T_c/T_h}$ whatever conductance ratio you choose. Switch to the **low-dissipation** model and the peak moves inside the band between $\eta_C/2$ and $\eta_C/(2-\eta_C)$ as you change the dissipation asymmetry. Bottom: observed efficiencies of 13 power plants against their Carnot efficiency (data as tabulated by Esposito et al. 2010); hover a dot. The three ringed plants are those Curzon and Ahlborn compared in 1975.`,
      deps: ['thermo-2.7'],
      see: ['energy-2.8'],
      refs: ['Schroeder §4.1', 'Curzon & Ahlborn, Am. J. Phys. 43, 22 (1975)', 'Esposito, Kawai, Lindenberg & Van den Broeck, PRL 105, 150603 (2010)'],
      tags: ['efficiency', 'finite-time thermodynamics'],
      credit: 'Novikov, 1957; Chambadal, 1957; Curzon & Ahlborn, 1975',
      scope: String.raw`A model, not a law: it assumes Newtonian heat transfer and a reversible core. Other loss mechanisms give other efficiencies at maximum power; for low-dissipation engines they lie between $\eta_C/2$ and $\eta_C/(2-\eta_C)$. Real plants are also optimized for cost, not purely for power.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Endoreversible_thermodynamics' },
      viz(v) {
        const model = v.select('model', [{ value: 'endo', label: 'endoreversible (Curzon–Ahlborn)' }, { value: 'ld', label: 'low-dissipation (Esposito et al.)' }], 'endo');
        const op = v.slider('operating point: η as a fraction of η_C', 0.02, 0.98, 0.3, { step: 0.01, fmt: (x) => `${Math.round(x * 100)}%` });
        const Th = v.slider('$T_h$', 400, 1000, 838, { step: 1, fmt: (x) => x.toFixed(0) + ' K' });
        const Tc = v.slider('$T_c$', 250, 380, 298, { step: 1, fmt: (x) => x.toFixed(0) + ' K' });
        const ratio = v.slider('conductance ratio $K_h/K_c$', 0.1, 10, 1, { log: true, fmt: (x) => v.fix(x, 2) });
        const asym = v.slider('dissipation ratio $\\Sigma_c/\\Sigma_h$', 0.01, 100, 1, { log: true, fmt: (x) => v.fix(x, 2) });
        v.button('go to maximum power', () => { op.set(clamp(peak.eta / (1 - Tc.value / Th.value), 0.02, 0.98)); });
        const sl = v.stage({ x: [0, 4], y: [0, 1100], height: 300, axes: 'box', ylabel: 'T (K)', xticks: [], weight: 0.7, minWidth: 200, title: 'temperature ladder' });
        const sp = v.stage({ x: [0, 1], y: [0, 1.12], height: 300, axes: 'box', xlabel: 'efficiency η', ylabel: 'power / maximum power', weight: 1.2, title: 'power against efficiency' });
        const sx = v.stage({ x: [0.25, 0.75], y: [0, 0.75], height: 270, axes: 'box', xlabel: 'Carnot efficiency of the plant', ylabel: 'observed efficiency', full: true, hover: true, title: 'real power plants' });
        let peak = { eta: 0 }, curve = [];
        const endo = (eta, h, c, r) => { const Kh = 2 * r / (1 + r), Kc = 2 / (1 + r), x = (Kh * h + Kc * c / (1 - eta)) / (Kh + Kc); const Qh = Kh * (h - x); return { P: eta * Qh, Thw: x, Tcw: (1 - eta) * x, Qh, Qc: Qh * (1 - eta) }; };
        const ldEnv = (eta, h, c, sc) => { // max power at given η over the hot contact time (ΔS = 1, Σ_h = 1, Σ_c = sc)
          let best = { P: 0 };
          for (let i = 0; i < 160; i++) { const th = 1.0001 * 10 ** (-0.2 + 3.4 * i / 159); const rhs = (1 - eta) * h * (1 - 1 / th) / c - 1; if (rhs <= 0) continue; const tc = sc / rhs, Qh = h * (1 - 1 / th), Qc = c * (1 + sc / tc), P = (Qh - Qc) / (th + tc); if (P > best.P) best = { P, Qh: Qh / (th + tc), Qc: Qc / (th + tc), th, tc }; }
          return best;
        };
        v.render(() => {
          const h = Th.value, c = Math.min(Tc.value, h - 20), eC = 1 - c / h, m = model.value;
          ratio.el.hidden = m !== 'endo'; asym.el.hidden = m !== 'ld';
          const at = (eta) => (m === 'endo' ? endo(eta, h, c, ratio.value) : ldEnv(eta, h, c, asym.value));
          curve = []; let pk = { eta: 0, P: -1 };
          for (let i = 1; i < 240; i++) { const eta = eC * i / 240, r = at(eta); curve.push([eta, r.P]); if (r.P > pk.P) pk = { eta, P: r.P }; }
          let a = Math.max(0, pk.eta - eC / 240), b = Math.min(eC, pk.eta + eC / 240);
          for (let k = 0; k < 40; k++) { const m1 = a + (b - a) * 0.382, m2 = a + (b - a) * 0.618; if (at(m1).P > at(m2).P) b = m2; else a = m1; }
          peak = { eta: (a + b) / 2, P: at((a + b) / 2).P };
          const eta = op.value * eC, s = at(eta), ca = 1 - Math.sqrt(c / h), lo = eC / 2, hi = eC / (2 - eC);
          // ---- P–η
          sp.setView([0, Math.min(1, eC * 1.12)], [0, 1.12]);
          sp.vband(lo, hi, { color: 'green', alpha: 0.1 });
          sp.vline(ca, { color: 'green', width: 2, dash: [6, 4] }); sp.vline(eC, { color: 'red', width: 1.6, dash: [3, 3] });
          sp.text('η_CA = 1 − √(Tc/Th)', ca, 1.06, { dx: 5, size: 11, color: 'green', weight: 650 });
          sp.text('Carnot:', eC, 0.86, { dx: 4, size: 11, color: 'red', weight: 650 }); sp.text('P = 0', eC, 0.78, { dx: 4, size: 11, color: 'red', weight: 650 });
          sp.path(curve.map(([e, P]) => [e, P / peak.P]).concat([[eC, 0]]), { color: 'ink', width: 2.6 });
          sp.dot(peak.eta, 1, { r: 5, hollow: true, color: 'ink' });
          sp.dot(eta, s.P / peak.P, { r: 7, color: 'gold' });
          // ---- ladder
          sl.setView([0, 4], [0, Math.max(1100, h * 1.1)]);
          sl.hline(h, { color: 'red', width: 2.4 }); sl.hline(c, { color: 'blue', width: 2.4 });
          sl.text(`Th ${h.toFixed(0)} K`, 0.1, h, { dy: -9, size: 11, color: 'red', weight: 650 }); sl.text(`Tc ${c.toFixed(0)} K`, 0.1, c, { dy: 11, size: 11, color: 'blue', weight: 650 });
          const sc_ = 3 + 26 * s.Qh / Math.max(1e-9, (m === 'endo' ? endo(0.001, h, c, ratio.value).Qh : s.Qh * 1.6));
          if (m === 'endo') {
            sl.rect(1.4, s.Tcw, 2.6, s.Thw, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.6, radius: 6 });
            sl.text('reversible core', 2, (s.Thw + s.Tcw) / 2, { align: 'center', size: 10.5, color: 'orange', weight: 650 });
            sl.hline(s.Thw, { color: 'red', width: 1.2, dash: [4, 4] }); sl.hline(s.Tcw, { color: 'blue', width: 1.2, dash: [4, 4] });
            sl.text(`Thw ${s.Thw.toFixed(0)}`, 3.95, s.Thw, { dy: -9, align: 'right', size: 10.5, color: 'red' }); sl.text(`Tcw ${s.Tcw.toFixed(0)}`, 3.95, s.Tcw, { dy: 11, align: 'right', size: 10.5, color: 'blue' });
            band(v, sl, [[2, h], [2, s.Thw]], Math.min(26, sc_), 'red'); band(v, sl, [[2, s.Tcw], [2, c]], Math.min(26, sc_ * (1 - eta)), 'blue');
            band(v, sl, [[2.6, (s.Thw + s.Tcw) / 2], [3.9, (s.Thw + s.Tcw) / 2]], Math.max(2, Math.min(26, sc_ * eta)), 'orange');
          } else {
            sl.rect(1.4, c + 0.12 * (h - c), 2.6, h - 0.12 * (h - c), { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 1.6, radius: 6 });
            sl.text(`τh = ${v.fix(s.th || 0, 2)}`, 2, (h + c) / 2 + 40, { align: 'center', size: 10.5, color: 'red' }); sl.text(`τc = ${v.fix(s.tc || 0, 2)}`, 2, (h + c) / 2 - 40, { align: 'center', size: 10.5, color: 'blue' });
            sl.text('contact times', 2, (h + c) / 2, { align: 'center', size: 10.5, color: 'orange', weight: 650 });
          }
          // ---- plants
          sx.fn((e) => e, { color: 'red', width: 1.6, dash: [3, 3] }); sx.text('Carnot', 0.6, 0.6, { dx: -6, dy: -8, align: 'right', size: 11, color: 'red' });
          sx.between((e) => e / (2 - e), (e) => e / 2, 0.25, 0.75, { fill: 'green', fillAlpha: 0.12 });
          sx.fn((e) => 1 - Math.sqrt(1 - e), { color: 'green', width: 2.4 }); sx.text('1 − √(Tc/Th)', 0.74, 1 - Math.sqrt(0.26), { dy: -10, align: 'right', size: 11, color: 'green', weight: 650 });
          sx.text('shaded band: η_C/2 … η_C/(2 − η_C)', 0.5, 0.08, { align: 'center', size: 10.5, color: 'green', plate: true });
          const ptr = sx.pointer; let hov = null;
          if (ptr.inside) { let best = 16 * 16; for (const p of PLANTS) { const ex = 1 - p.Tc / p.Th, d = (sx.X(ex) - sx.X(ptr.x)) ** 2 + (sx.Y(p.eta) - sx.Y(ptr.y)) ** 2; if (d < best) { best = d; hov = p; } } }
          for (const p of PLANTS) { const ex = 1 - p.Tc / p.Th; sx.dot(ex, p.eta, { r: p === hov ? 7 : 5, color: 'accent' }); if (p.ca) { sx.dot(ex, p.eta, { r: 9, hollow: true, color: 'ink', width: 1.4 }); sx.text(p.name, ex, p.eta, { dx: 11, dy: p.name === 'CANDU' ? 10 : -8, size: 11, weight: 650, plate: true }); } }
          if (hov) sx.text(`${hov.name} (${hov.kind}): observed ${hov.eta}, Curzon–Ahlborn ${v.fix(1 - Math.sqrt(hov.Tc / hov.Th), 3)}, Carnot ${v.fix(1 - hov.Tc / hov.Th, 3)}`, 0.26, 0.7, { size: 11.5, weight: 650, plate: true });
        });
        v.legend([['ink', 'power of the model engine'], ['gold', 'operating point', { dot: true }], ['green', 'Curzon–Ahlborn efficiency', { dash: true }], ['green', 'low-dissipation band', { area: true }]]);
        v.readout(() => {
          const h = Th.value, c = Math.min(Tc.value, h - 20), eC = 1 - c / h, ca = 1 - Math.sqrt(c / h), eta = op.value * eC;
          const errs = PLANTS.map((p) => Math.abs(p.eta - (1 - Math.sqrt(p.Tc / p.Th))));
          return `computed maximum of the power curve at $\\eta^*$ = **${v.fix(peak.eta, 4)}** · $1 - \\sqrt{T_c/T_h}$ = ${v.fix(ca, 4)}, $\\eta_C/2$ = ${v.fix(eC / 2, 4)}, $\\eta_C/(2-\\eta_C)$ = ${v.fix(eC / (2 - eC), 4)}, $\\eta_C$ = ${v.fix(eC, 4)} · operating at $\\eta$ = ${v.fix(eta, 3)} gives ${v.fix(100 * (model.value === 'endo' ? endo(eta, h, c, ratio.value).P : ldEnv(eta, h, c, asym.value).P) / peak.P, 1)}% of maximum power · plants: median |observed − Curzon–Ahlborn| = ${v.fix(errs.sort((a, b) => a - b)[6], 3)}`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.18
    {
      num: '2.18', kind: 'Paper', name: 'Réflexions sur la puissance motrice du feu',
      paper: { authors: 'S. Carnot', year: 1824, title: 'Réflexions sur la puissance motrice du feu et sur les machines propres à développer cette puissance', venue: 'Paris: Bachelier (book)', url: 'https://fr.wikisource.org/wiki/R%C3%A9flexions_sur_la_puissance_motrice_du_feu' },
      introduces: ['thermo-2.4', 'thermo-2.5'],
      credit: 'Sadi Carnot, 1824',
      statement: String.raw`Carnot's 118-page book founded the theory of heat engines. In modern terms it showed:

- Work ("motive power") is obtained from heat only when heat passes from a hotter body to a colder one; a temperature difference is indispensable, as a difference of level is for a water wheel.
- The greatest work is obtained by a cycle in which no body ever touches another of different temperature, so that every step could be run backwards — the four-step **Carnot cycle** (2.4), described for a gas in a cylinder alternately touching a hot body A and a cold body B, with expansions and compressions in between that change its temperature without contact.
- **Carnot's theorem** (2.5): « La puissance motrice de la chaleur est indépendante des agens mis en œuvre pour la réaliser ; sa quantité est fixée uniquement par les températures des corps entre lesquels se fait en dernier résultat le transport du calorique ». The proof: a better engine, combined with a reversible one run backwards, would produce motive power from nothing.
- The motive power of a given quantity of heat falling one degree is larger at low temperatures than at high ones; he computed it for air, water vapour and alcohol vapour.

Scope: the reasoning is set in the caloric theory — heat as an indestructible fluid, so that all the heat taken from A arrives in B. That premise is false (an engine rejects less heat than it absorbs, the difference being the work), but the conclusions about reversibility, the maximum and its dependence on the temperatures alone survived.`,
      idea: String.raw`In 1824 steam engines were improved by trial and error — Watt's condenser, high pressure, Woolf's compounding — with no theory of what limited them, and heat was widely regarded as a conserved substance, caloric. Carnot, a young military engineer, asked whether the motive power of heat is bounded and on what it depends. He compared heat to falling water: « on peut comparer avec assez de justesse la puissance motrice de la chaleur à celle d'une chute d'eau » — the power depends on the quantity of caloric and on the height of its fall, the temperature difference. Two ideas did the work: **reversibility** (any contact between bodies at different temperatures wastes a fall of caloric that could have produced work) and the impossibility of **perpetual motion**, which turns "no engine beats the reversible one" into a theorem. The book went almost unread until Clapeyron restated it with the pressure–volume diagram in 1834; Kelvin found it through Clapeyron, and in 1850 Clausius reconciled Carnot's theorem with Joule's equivalence of heat and work by dropping the conservation of caloric, which led to the second law (2.1) and to the absolute temperature scale (2.6).`,
      caption: String.raw`**His cycle**: step through Carnot's own numbered operations 1°–7° (quoted from the 1824 text) on a re-drawing of his figure — the cylinder abcd, the piston positions cd, ef, gh, ik, and the bodies A (hot, here 100 °C) and B (cold, 0 °C) brought into contact with it; on the right the same operations on the $P$–$V$ diagram that Clapeyron introduced in 1834 (Carnot drew none). **The waterfall**: his analogy, with heat as caloric (conserved, all of it reaches the lower body) or as energy (part of it becomes work). The right panel shows the work per unit heat for a fall from the chosen temperature down to 0 °C. **His numbers**: the paper's own values for the motive power of 1000 units of heat falling one degree, against today's exact value $1000\ \text{kcal} \times 1\,\text{K}/T$.`,
      deps: ['thermo-2.3', 'thermo-1.16'],
      see: ['tech-7.10', 'thermo-2.7'],
      refs: [],
      tags: ['Carnot', 'history', 'engines'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Reflections_on_the_Motive_Power_of_Fire' },
      viz(v) {
        const TA = 373.15, TB = 273.15, K = (TA / TB) ** 2.5; // air: f = 5
        const KCAL = 4186.8, UMP = 9806.65; // J per unit of heat (1 kg of water by 1 °C), J per unit of motive power (1 m³ of water raised 1 m)
        const mode = v.select('view', [{ value: 'cycle', label: 'his cycle, operations 1°–7°' }, { value: 'fall', label: 'the waterfall' }, { value: 'num', label: 'his numbers' }], 'cycle');
        const heatAs = v.select('heat as', [{ value: 'cal', label: 'caloric (1824)' }, { value: 'en', label: 'energy (1850)' }], 'cal');
        const tA = v.slider('upper body at', 1, 1000, 100, { step: 1, fmt: (x) => x.toFixed(0) + ' °C' });
        const sa = v.stage({ x: [0, 10], y: [0, 8], equal: true, height: 340, axes: false, weight: 1 });
        const sb = v.stage({ x: [0, 1], y: [0, 1], height: 340, axes: 'box', weight: 1 });
        const LV = { ik: 1 / K, cd: 1, ef: 2, gh: 2 * K };
        const frames = [
          { k: 1, a: 'cd', b: 'cd', body: 'A', T0: TA, T1: TA, note: String.raw`1° « Contact du corps A avec l'air renfermé dans la capacité abcd » — the air under the piston at cd takes the temperature of the hot body A.` },
          { k: 2, a: 'cd', b: 'ef', body: 'A', T0: TA, T1: TA, note: String.raw`2° « Le piston s'élève graduellement, et vient prendre la position ef » — the air expands while touching A, which supplies the caloric that keeps its temperature constant.` },
          { k: 3, a: 'ef', b: 'gh', body: null, T0: TA, T1: TB, note: String.raw`3° « Le corps A est éloigné, et l'air ne se trouve plus en contact avec aucun corps capable de lui fournir du calorique » — the piston rises on from ef to gh and the air cools until it reaches the temperature of B.` },
          { k: 4, a: 'gh', b: 'cd', body: 'B', T0: TB, T1: TB, note: String.raw`4° « L'air est mis en contact avec le corps B ; il est comprimé par le retour du piston » — from gh back to cd, at the constant temperature of B, to which the air gives up caloric.` },
          { k: 5, a: 'cd', b: 'ik', body: null, T0: TB, T1: TA, note: String.raw`5° « Le corps B est écarté, et l'on continue la compression de l'air » — isolated again, the air is compressed from cd to ik and heats up to the temperature of A.` },
          { k: 6, a: 'ik', b: 'ef', body: 'A', T0: TA, T1: TA, note: String.raw`6° « L'air est remis en contact avec le corps A ; le piston retourne de la position ik à la position ef » — expansion at the constant temperature of A.` },
          { k: 7, a: 'ef', b: 'ef', body: null, T0: TA, T1: TA, cycle: true, note: String.raw`7° « La période décrite sous le n° 3 se renouvelle, puis successivement les périodes 4, 5, 6, 3 »… — operations 3–6 form the closed cycle. The expansions happen at higher temperature and pressure than the compressions, so a surplus of motive power remains, produced, Carnot says, by the fall of caloric from A to B.` },
        ];
        const S = v.steps({ frames, start: 'end', still: 6, transition: 0.7, counter: 'operation' });
        const yOf = (V) => 0.9 + 1.2 * V;
        const Pof = (V, T) => (T / TA) / V;
        const modern = (tUp) => 1000 * KCAL / (UMP * (tUp + 273.15));
        const TABLE = [
          { sub: 'air', fall: '1° → 0°', t: 1, c: 1.395, col: 'accent' },
          { sub: 'water vapour (Clément–Desormes law)', fall: '1° → 0°', t: 1, c: 1.290, col: 'teal' },
          { sub: 'water vapour', fall: '78° → 77°', t: 78, c: 1.212, col: 'teal' },
          { sub: 'alcohol vapour', fall: '78.7° → 77.7°', t: 78.7, c: 1.230, col: 'purple' },
          { sub: 'water vapour', fall: '100° → 99°', t: 100, c: 1.112, col: 'teal' },
        ];
        v.render(() => {
          const m = mode.value, rp = tRamp(v);
          S.el.hidden = m !== 'cycle'; if (S.noteEl) S.noteEl.hidden = m !== 'cycle';
          heatAs.el.hidden = m !== 'fall'; tA.el.hidden = m !== 'fall';
          if (m === 'cycle') {
            const f = S.frame.k ? S.frame : frames[6], tw = S.tween ?? 1, prev = S.prev && S.prev.k ? S.prev : f;
            const V = LV[f.a] * (LV[f.b] / LV[f.a]) ** tw, T = f.T0 === f.T1 ? f.T0 : (f.k === 3 ? TA * (LV.ef / V) ** 0.4 : TB * (LV.cd / V) ** 0.4);
            // bodies A and B (slide in to touch the cylinder)
            const home = { A: 0.5, B: 7.4 }, under = 3.9, posOf = (who, fr) => (fr.body === who ? under : home[who]);
            for (const who of ['A', 'B']) { const x = lerp(posOf(who, prev), posOf(who, f), tw); const col = who === 'A' ? 'red' : 'blue'; sa.rect(x, 0.05, x + 2.2, 0.85, { fill: col, fillAlpha: 0.35, color: col, width: 1.6, radius: 4 }); sa.text(`${who}  ${who === 'A' ? '100 °C' : '0 °C'}`, x + 1.1, 0.45, { align: 'center', size: 12, weight: 700, color: col, halo: false }); }
            // cylinder abcd with the piston positions
            sa.rect(4, 0.9, 6, yOf(V), { fill: pick(rp, (T - TB) / (TA - TB)), fillAlpha: 0.45, stroke: false });
            sa.line(4, 0.9, 4, 6.9, { color: 'ink', width: 2.4 }); sa.line(6, 0.9, 6, 6.9, { color: 'ink', width: 2.4 }); sa.line(4, 0.9, 6, 0.9, { color: 'ink', width: 2.4 });
            for (const [name, l, r] of [['ik', 'i', 'k'], ['cd', 'c', 'd'], ['ef', 'e', 'f'], ['gh', 'g', 'h']]) { const y = yOf(LV[name]); sa.line(3.75, y, 4, y, { color: 'muted', width: 1.2 }); sa.line(6, y, 6.25, y, { color: 'muted', width: 1.2 }); sa.text(l, 3.6, y, { align: 'right', size: 14, math: true, color: 'muted' }); sa.text(r, 6.4, y, { size: 14, math: true, color: 'muted' }); }
            sa.text('a', 3.6, 0.95, { align: 'right', size: 14, math: true, color: 'muted' }); sa.text('b', 6.4, 0.95, { size: 14, math: true, color: 'muted' });
            sa.rect(4.05, yOf(V), 5.95, yOf(V) + 0.25, { fill: 'muted', fillAlpha: 0.9, color: 'ink', width: 1 }); sa.line(5, yOf(V) + 0.25, 5, 7.6, { color: 'muted', width: 4 });
            sa.text(`air ${(T - 273.15).toFixed(0)} °C`, 5, Math.max(1.25, (0.9 + yOf(V)) / 2), { align: 'center', size: 11.5, weight: 650, plate: true });
            if (f.body === 'A' && f.a !== f.b) { band(v, sa, [[3.2, 1.2], [3.95, 1.2]], 7, 'red'); sa.text('caloric in', 2.2, 1.6, { align: 'center', size: 11, color: 'red', weight: 650 }); }
            if (f.body === 'B' && f.a !== f.b) { band(v, sa, [[6.05, 1.2], [6.8, 1.2]], 7, 'blue'); sa.text('caloric out', 7.8, 1.6, { align: 'center', size: 11, color: 'blue', weight: 650 }); }
            sa.text(`operation ${f.k}°`, 0.2, 7.6, { size: 13, weight: 700 });
            // Clapeyron's diagram
            sb.setTitle('the same operations on Clapeyron’s $P$–$V$ diagram (1834)'); sb.setLabels('V / V(cd)', 'P (relative)');
            sb.setTicks(null, null); sb.setView([0, LV.gh * 1.25], [0, Pof(LV.ik, TA) * 1.12]);
            const strokes = frames.slice(1, 6);
            const path = (fr, u) => { const n = 50, out = []; for (let i = 0; i <= Math.round(n * u); i++) { const VV = LV[fr.a] * (LV[fr.b] / LV[fr.a]) ** (i / n), TT = fr.T0 === fr.T1 ? fr.T0 : (fr.k === 3 ? TA * (LV.ef / VV) ** 0.4 : TB * (LV.cd / VV) ** 0.4); out.push([VV, Pof(VV, TT)]); } return out; };
            const cyc = [...path(frames[2], 1), ...path(frames[3], 1), ...path(frames[4], 1), ...path(frames[5], 1)];
            sb.poly(cyc, { fill: 'orange', fillAlpha: f.cycle ? 0.22 : 0.07, color: 'faint', width: 1 });
            for (const fr of strokes) { if (fr.k > f.k) continue; const pts = path(fr, fr.k === f.k ? tw : 1); sb.path(pts, { color: fr.body === 'A' ? 'red' : fr.body === 'B' ? 'blue' : 'purple', width: 2.6, dash: fr.body ? null : [6, 4] }); }
            sb.dot(V, Pof(V, T), { r: 6, color: 'gold' });
            for (const [name, Tn, pos] of [['ef', TA, 'ne'], ['gh', TB, 'nw'], ['cd', TB, 'sw'], ['ik', TA, 'e']]) sb.dot(LV[name], Pof(LV[name], Tn), { r: 3.5, color: 'ink', label: name, labelPos: pos });
            sb.dot(LV.cd, Pof(LV.cd, TA), { r: 3.5, color: 'muted', label: 'cd (1°)', labelPos: 'ne' });
            v.legend([['red', 'touching A (isotherm)'], ['blue', 'touching B (isotherm)'], ['purple', 'no contact (adiabat)', { dash: true }], ['orange', 'net motive power of the cycle', { area: true }]]);
          } else if (m === 'fall') {
            const tU = tA.value, Th = tU + 273.15, Q = 1, cal = heatAs.value === 'cal';
            const Wm = 1 - TB / Th, Wc = Math.log(Th / TB), Qout = cal ? Q : Q * TB / Th, W = cal ? Wc : Wm;
            const tMax = Math.max(150, tU * 1.12), yT = (t) => 1.25 + 5.5 * t / tMax;
            const step = tMax > 600 ? 250 : tMax > 300 ? 100 : 50;
            sa.line(0.45, yT(0), 0.45, yT(tMax), { color: 'muted', width: 1.4 }); for (let t = 0; t <= tMax; t += step) { sa.line(0.35, yT(t), 0.55, yT(t), { color: 'muted', width: 1 }); sa.text(`${t} °C`, 0.65, yT(t), { size: 10, color: 'muted' }); }
            const yA = yT(tU), yB = yT(0), wx = 4.6, rr = Math.min(1.1, (yA - yB) / 2.6), wy = (yA + yB) / 2, sx = wx + rr * 0.75;
            const wQ = 4 + 20 * Q, wO = 4 + 20 * Qout;
            band(v, sa, [[3.4, yA], [sx, yA], [sx, wy]], wQ, 'accent', { head: false, alpha: 0.55 });
            band(v, sa, [[sx, wy], [sx, yB], [6.3, yB]], wO, 'accent', { alpha: 0.55 });
            sa.rect(1.6, yA - 0.32, 3.4, yA + 0.32, { fill: 'red', fillAlpha: 0.35, color: 'red', width: 1.4, radius: 4 }); sa.text(`A  ${tU.toFixed(0)} °C`, 2.5, yA, { align: 'center', size: 11.5, weight: 700, color: 'red', halo: false });
            sa.rect(6.3, yB - 0.4, 9.2, yB + 0.4, { fill: 'blue', fillAlpha: 0.3, color: 'blue', width: 1.4, radius: 4 }); sa.text('B  0 °C', 7.75, yB, { align: 'center', size: 11.5, weight: 700, color: 'blue', halo: false });
            sa.circle(wx, wy, rr, { fill: 'panel', fillAlpha: 1, color: 'ink', width: 2 }); for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4 + 0.3; sa.line(wx, wy, wx + rr * Math.cos(ang), wy + rr * Math.sin(ang), { color: 'ink', width: 1.4 }); }
            band(v, sa, [[wx - 0.1, wy], [wx - rr - 1.9, wy]], 3 + 20 * Math.min(W, 1.6) / 1.2, 'orange');
            sa.text(`work ${v.fix(W, 3)}`, wx - rr - 1.0, wy, { dy: -16, align: 'center', size: 11, weight: 650, color: 'orange' });
            sa.text(cal ? 'all the caloric reaches B' : `only ${v.fix(Qout, 3)} of it reaches B`, 7.75, yB + 0.75, { align: 'center', size: 11, color: 'accent', weight: 650, plate: true });
            sa.text(`heat taken from A: 1`, sx + 0.3, yA + 0.05, { dy: -14, size: 11, color: 'accent', weight: 650 });
            sa.text(cal ? 'caloric view: heat falls like water and is not used up' : 'energy view: the wheel turns part of the heat into work', 5, 7.65, { align: 'center', size: 11.5, weight: 650 });
            // work per unit heat against the height of the fall
            sb.setTitle('work per unit of heat, falling from A down to 0 °C'); sb.setLabels('temperature of A (°C)', 'work / heat taken from A');
            sb.setTicks(null, null); sb.setView([0, 1060], [0, 1.6]);
            sb.hline(1, { color: 'red', width: 1.4, dash: [5, 4] }); sb.text('energy ceiling: work ≤ heat', 130, 1, { dy: -9, size: 11, color: 'red', plate: true });
            sb.fn((t) => 1 - TB / (t + 273.15), { color: 'green', width: 2.6, domain: [0, 1000] });
            sb.fn((t) => Math.log((t + 273.15) / TB), { color: 'orange', width: 2.2, dash: [6, 4], domain: [0, 1000] });
            sb.fn((t) => 1.12 * UMP / (1000 * KCAL) * t, { color: 'purple', width: 1.8, dash: [2, 4], domain: [0, 1000] });
            sb.dot(1000, 560 * UMP / (1000 * KCAL), { r: 6, color: 'purple' }); sb.text('Carnot’s estimate for 1000°', 990, 560 * UMP / (1000 * KCAL), { dy: 16, align: 'right', size: 11, color: 'purple', weight: 650, plate: true });
            sb.vline(tU, { color: 'ink', width: 1, dash: [3, 3] });
            sb.text('energy: 1 − TB/TA', 560, 1 - TB / 833, { dy: 14, size: 11, color: 'green', weight: 650, plate: true });
            sb.text('caloric kept, F = 1/T: ln(TA/TB)', 640, Math.log(913 / TB), { dy: 16, size: 11, color: 'orange', weight: 650, plate: true });
            v.legend([['green', 'today (Carnot efficiency)'], ['orange', 'caloric conserved, Carnot’s function = 1/T', { dash: true }], ['purple', 'Carnot’s proportional rule (1.12 per 1000 per degree)', { dash: true }]]);
          } else {
            sa.text('motive power of 1000 units of heat falling 1°', 5, 7.55, { align: 'center', size: 12, weight: 700 });
            sa.text('(work in m³ of water raised 1 m; a unit of heat warms 1 kg of water by 1 °C)', 5, 7.1, { align: 'center', size: 10.5, color: 'muted' });
            const cols = [0.15, 5.9, 7.45, 8.9];
            ['working substance, fall', 'Carnot', 'today', 'ratio'].forEach((h, i) => sa.text(h, cols[i], 6.4, { size: 11, weight: 700, color: 'muted', align: i ? 'center' : 'left' }));
            sa.line(0.15, 6.1, 9.8, 6.1, { color: 'faint', width: 1 });
            TABLE.forEach((r, k) => { const y = 5.5 - k * 1.05, md = modern(r.t); sa.text(r.sub, cols[0], y + 0.15, { size: 11, color: r.col, weight: 650 }); sa.text(r.fall, cols[0], y - 0.25, { size: 10.5, color: 'muted' }); sa.text(v.fix(r.c, 3), cols[1], y, { align: 'center', size: 12, weight: 700 }); sa.text(v.fix(md, 3), cols[2], y, { align: 'center', size: 12 }); sa.text(v.fix(r.c / md, 3), cols[3], y, { align: 'center', size: 12, color: Math.abs(r.c / md - 1) < 0.05 ? 'green' : 'red', weight: 650 }); });
            sb.setTitle('Carnot’s values against today’s $1000\\ \\text{kcal}\\times 1\\,\\text{K}/T$'); sb.setLabels('temperature of the fall (°C)', 'motive power (units)');
            sb.setTicks(null, null); sb.setView([-14, 112], [1.0, 1.65]);
            sb.fn((t) => modern(t), { color: 'green', width: 2.6, domain: [-5, 110] });
            TABLE.forEach((r) => sb.dot(r.t, r.c, { r: 6, color: r.col }));
            sb.text('air', 1, 1.395, { dx: 9, size: 11, color: 'accent', weight: 650 }); sb.text('steam (Clément–Desormes)', 1, 1.29, { dx: 9, size: 11, color: 'teal', weight: 650 });
            sb.text('alcohol', 78.7, 1.23, { dx: 9, dy: -8, size: 11, color: 'purple', weight: 650 }); sb.text('steam', 78, 1.212, { dx: 9, dy: 9, size: 11, color: 'teal', weight: 650 }); sb.text('steam', 100, 1.112, { dx: -9, align: 'right', size: 11, color: 'teal', weight: 650 });
            sb.text('today: falls as 1/T', 40, modern(40), { dy: -12, size: 11, color: 'green', weight: 650 });
            v.legend([['green', 'today: the Carnot efficiency of a one-degree fall'], ['accent', 'Carnot 1824: air', { dot: true }], ['teal', 'water vapour', { dot: true }], ['purple', 'alcohol vapour', { dot: true }]]);
          }
        });
        v.readout(() => {
          const m = mode.value;
          if (m === 'cycle') { const QA = TA * Math.log(LV.ef / LV.ik), QB = TB * Math.log(LV.gh / LV.cd); return `per cycle (1 mol of air, $R$ = 8.314 J/(mol K)): heat from A ${v.fix(R * QA, 0)} J, heat to B ${v.fix(R * QB, 0)} J · Carnot assumed they were equal (caloric conserved); in fact $Q_B/Q_A = T_B/T_A$ = **${v.fix(QB / QA, 3)}**, and the missing ${v.fix(100 * (1 - QB / QA), 1)}% is the work — yet his maximum, $1 - T_B/T_A$, survived`; }
          if (m === 'fall') { const Th = tA.value + 273.15; return `fall from ${tA.value.toFixed(0)} °C to 0 °C: today $W/Q_A = 1 - T_B/T_A$ = **${v.fix(1 - TB / Th, 3)}**; caloric kept and Carnot's function $1/T$: $\\ln(T_A/T_B)$ = ${v.fix(Math.log(Th / TB), 3)} (agree for small falls, to first order) · Carnot's own estimate for 1000° — 560 units of motive power per 1000 units of heat — is ${v.fix(560 * UMP / (1000 * KCAL), 2)} J of work per J of heat: impossible once heat is energy`; }
          const r = TABLE[4], a = TABLE[0];
          return `steam at 100 °C: Carnot **${r.c}** vs today ${v.fix(modern(r.t), 3)} (${v.fix(100 * (r.c / modern(r.t) - 1), 1)}%) · air at 0 °C: ${a.c} vs ${v.fix(modern(a.t), 3)} (${v.fix(100 * (a.c / modern(a.t) - 1), 1)}%: almost all of it from Delaroche and Bérard's specific heat of air, 0.267 where today's is 0.240 — with 0.240 his own arithmetic gives 1.55) · his conclusion that a degree of fall is worth more at low temperature is right: today's value goes as $1/T$`;
        });
      },
    },
    // ------------------------------------------------------------------ 2.19
    {
      num: '2.19', kind: 'Paper', name: 'Bequeme Formen der Hauptgleichungen der Wärmetheorie',
      paper: { authors: 'R. Clausius', year: 1865, title: 'Ueber verschiedene für die Anwendung bequeme Formen der Hauptgleichungen der mechanischen Wärmetheorie', venue: 'Annalen der Physik 201 (7): 353–400', doi: '10.1002/andp.18652010702' },
      introduces: ['thermo-2.9', 'thermo-2.10'],
      credit: 'Rudolf Clausius, 1865 (read to the Naturforschende Gesellschaft in Zürich on 24 April 1865)',
      statement: String.raw`Clausius rewrote the two main laws of the mechanical theory of heat in forms convenient for calculation. The first law: $dQ = dU + A\,dW$, with $U$ the energy of the body and $A$ the heat equivalent of work ($1/424$ in his units, after Joule). The second law, for any cycle: $\int dQ/T \le 0$, with equality when every change is reversible (his equation (I), $dQ$ the heat absorbed and $T$ the absolute temperature of the body). Hence for reversible changes $dQ = T\,dS$ for a quantity $S$ fixed by the state alone, $\int dQ/T = S - S_0$ (his equation (64)), which he named:

« … so schlage ich vor, die Grösse $S$ nach dem griechischen Worte ἡ τροπή, die Verwandlung, die *Entropie* des Körpers zu nennen. » (p. 390) — chosen deliberately to resemble *Energie*, the two quantities being so closely related. In irreversible changes the uncompensated transformation $S - S_0 - \int dQ/T$ is positive. He closed by extending both quantities to the whole universe (p. 400):

« 1) Die Energie der Welt ist constant. 2) Die Entropie der Welt strebt einem Maximum zu. »

Scope: equilibrium states of bodies; the extension to "the world" is an extrapolation that assumes the universe is an isolated thermodynamic system.`,
      idea: String.raw`Clausius had reconciled Carnot (2.18) with Joule in 1850 and in 1854 had found that around any reversible cycle the "equivalence values" $Q/T$ of the heat exchanged add up to zero. The 1865 paper drew the consequence: heat, whose differential equations "do not satisfy the condition of immediate integrability" (§10), has an integrating factor $1/T$, so $\int dQ/T$ defines a property of the state — the entropy (2.9) — which never decreases in an isolated system (2.10). He gave it a name meant to be usable unchanged in every language, worked out $S$ for gases and vapours, and showed what the new equations could do: from them he derived the difference between water's two specific heats from its measured expansion and compressibility. Entropy became the central quantity of thermodynamics; Boltzmann's $S = k\ln W$ (5.6) later explained what it counts.`,
      caption: String.raw`**Loops**: entropy of 1 mol of air over the $p$–$V$ plane (colour and contours, which are the adiabats). **Draw any closed loop** with the mouse (a sample loop is shown first). The right panel follows the loop: $\int dQ/T$ (green) tracks $S - S_0$ (dashed) and returns to zero when the loop closes, while $\int dQ$ ends at the work done. Add **internal friction** (work turned into heat inside the gas, as in Clausius' irreversible processes): $\oint dQ/T$ becomes negative and the gap is his *uncompensated transformation*. **Water**: Clausius' own worked example (footnote, pp. 373–374): from Kopp's expansion and Grassi's compressibility data he computed $C - c$ for water at 0, 25 and 50 °C; compare his numbers with today's (IAPWS data via NIST, and Kell's formulas). **The world**: four bodies exchanging heat in isolation — energy stays constant, entropy climbs to its maximum.`,
      deps: ['thermo-2.8', 'thermo-2.5', 'thermo-1.11', 'thermo-2.18'],
      see: ['thermo-5.6', 'info-1.2', 'pchem-3.2'],
      refs: [],
      tags: ['entropy', 'history', 'Clausius'],
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Entropy#History' },
      viz(v) {
        const f = 5, cv = 2.5 * R;
        const mode = v.select('view', [{ value: 'loops', label: 'loops in the p–V plane' }, { value: 'water', label: 'his example: water' }, { value: 'world', label: 'the world' }], 'loops');
        const fr = v.slider('internal friction', 0, 6, 0, { step: 0.1, fmt: (x) => v.fix(x, 1) + ' kPa' });
        const bSample = v.button('Sample loop', () => { loop = sample(); });
        let seed = 3; const bWorld = v.button('Another world', () => { seed++; });
        const sa = v.stage({ x: [0, 60], y: [0, 500], height: 330, axes: 'box', weight: 1.2 });
        const sb = v.stage({ x: [0, 1], y: [-1, 1], height: 330, axes: 'box', weight: 1 });
        const sample = () => Array.from({ length: 241 }, (_, i) => { const p = 2 * Math.PI * i / 240; return [30 + 16 * Math.cos(p) + 3 * Math.cos(3 * p), 250 - 150 * Math.sin(p) - 30 * Math.sin(2 * p)]; });
        let loop = sample(), drawing = null;
        sa.onDrag((x, y, phase) => {
          if (mode.value !== 'loops') return;
          const px = [clamp(x, 3, 58), clamp(y, 20, 490)];
          if (phase === 'start') drawing = [px];
          else if (phase === 'move' && drawing) { const q = drawing[drawing.length - 1]; if (Math.hypot(sa.X(px[0]) - sa.X(q[0]), sa.Y(px[1]) - sa.Y(q[1])) > 3) drawing.push(px); }
          else if (phase === 'end' && drawing) { if (drawing.length > 12) { loop = drawing.concat([drawing[0]]); } drawing = null; }
          v.invalidate();
        });
        const Sof = (V, p) => cv * Math.log(p * V / R) + R * Math.log(V);
        let out = null;
        v.render(() => {
          const m = mode.value;
          fr.el.hidden = m !== 'loops'; bSample.hidden = m !== 'loops'; bWorld.hidden = m !== 'world';
          if (m === 'loops') {
            sa.setTitle('entropy of 1 mol of air over the $p$–$V$ plane: draw a loop'); sa.setLabels('V (L)', 'p (kPa)'); sa.setTicks(null, null); sa.setView([0, 60], [0, 500]);
            const S0 = Sof(30, 250);
            sa.heat((V, p) => Sof(V, p), { range: [S0 - 50, S0 + 50], cmap: 'theme', color: 'teal', res: 4, key: 'S1865' });
            const lv = []; for (let k = -8; k <= 8; k++) lv.push(S0 + 6 * k);
            sa.contour((V, p) => Sof(V, p), lv, { color: 'teal', width: 0.9, alpha: 0.55, res: 90 }); sa.axes();
            const L = drawing || loop, mu = drawing ? 0 : fr.value;
            // walk the loop: dQ (absorbed from outside), T, S
            let Q = 0, I = 0, N = 0; const trace = [{ u: 0, I: 0, S: 0, Q: 0 }], Sstart = Sof(L[0][0], L[0][1]);
            let len = 0; for (let i = 1; i < L.length; i++) len += Math.hypot(L[i][0] - L[i - 1][0], (L[i][1] - L[i - 1][1]) / 8);
            let acc = 0;
            for (let i = 1; i < L.length; i++) {
              const [V0, p0] = L[i - 1], [V1, p1] = L[i], sub = 24; let dqSeg = 0;
              for (let j = 0; j < sub; j++) { // midpoint rule on sub-steps of each straight piece
                const Va = V0 + (V1 - V0) * j / sub, pa = p0 + (p1 - p0) * j / sub, Vb = V0 + (V1 - V0) * (j + 1) / sub, pb = p0 + (p1 - p0) * (j + 1) / sub;
                const Vm = (Va + Vb) / 2, pm = (pa + pb) / 2, T = Vm * pm / R, dq = (f / 2 + 1) * pm * (Vb - Va) + f / 2 * Vm * (pb - pa), dF = mu * Math.abs(Vb - Va);
                Q += dq - dF; I += (dq - dF) / T; N += dF / T; dqSeg += dq;
              }
              acc += Math.hypot(V1 - V0, (p1 - p0) / 8);
              trace.push({ u: acc / len, I, S: Sof(V1, p1) - Sstart, Q });
              if (!drawing) sa.line(V0, p0, V1, p1, { color: dqSeg >= 0 ? 'red' : 'blue', width: 3.2 });
            }
            if (drawing) sa.path(drawing, { color: 'gold', width: 3 });
            else { for (const k of [0.15, 0.4, 0.65, 0.9]) { const i = Math.floor(k * (L.length - 8)), j = i + Math.max(2, Math.round(L.length / 40)); sa.arrow(L[i][0], L[i][1], L[j][0], L[j][1], { color: 'ink', width: 2, head: 11 }); } sa.dot(L[0][0], L[0][1], { r: 5, color: 'ink', label: 'start', labelPos: 'ne' }); }
            sa.text('contours: S = const (adiabats)', 59, 485, { align: 'right', size: 11, color: 'teal', weight: 650, plate: true });
            const all = trace.flatMap((t) => [t.I, t.S]), lo = Math.min(...all, -1), hi = Math.max(...all, 1);
            sb.setTitle('around the loop: $\\int dQ/T$ and $S - S_0$'); sb.setLabels('fraction of the loop', 'J/K'); sb.setTicks(null, null);
            sb.setView([0, 1], [lo - 0.12 * (hi - lo), hi + 0.12 * (hi - lo)]);
            sb.hline(0, { color: 'muted', width: 1 });
            sb.path(trace.map((t) => [t.u, t.I]), { color: 'green', width: 3.2 });
            sb.path(trace.map((t) => [t.u, t.S]), { color: 'ink', width: 1.8, dash: [6, 4] });
            sb.dot(1, I, { r: 5, color: Math.abs(I) < 1e-6 ? 'green' : 'red' });
            sb.text(Math.abs(N) < 1e-9 ? 'his eq. (64): ∫dQ/T = S − S₀' : `uncompensated transformation N = ${v.fix(N, 3)} J/K`, 0.5, hi + 0.06 * (hi - lo), { align: 'center', size: 11, weight: 650, color: Math.abs(N) < 1e-9 ? 'green' : 'red', plate: true });
            out = { m, Q, I, N };
            v.legend([['red', 'heat absorbed'], ['blue', 'heat given out'], ['green', '$\\int dQ/T$ along the loop'], ['ink', '$S - S_0$ of the state', { dash: true }]]);
          } else if (m === 'water') {
            const kellDiff = (t) => (t + 273.15) / kellRho(t) * kellAlpha(t) ** 2 / kellKappa(t) / 1000 / waterAt(0.01, 1); // in units of C(0 °C)
            const CL = [[0, 0.0005], [25, 0.0098], [50, 0.0358]];
            sa.setTitle('$C - c$ for water: Clausius 1865 against today'); sa.setLabels('t (°C)', 'C − c  (units of C at 0 °C)'); sa.setTicks(null, null); sa.setView([-9, 103], [-0.006, 0.115]);
            sa.fn(kellDiff, { color: 'green', width: 2.6, domain: [0, 100] });
            sa.dots(WATER.map(([t, cp, cvv]) => [t, (cp - cvv) / waterAt(0.01, 1)]), { r: 3.5, color: 'ink' });
            for (const [t, d] of CL) sa.dot(t, d, { r: 7, color: 'red', label: `${d}`, labelPos: t === 0 ? 'ne' : 'nw', labelColor: 'red' });
            sa.text('today: T v α²/κ_T (Kell 1975)', 60, kellDiff(60), { dx: -8, dy: -12, align: 'right', size: 11, color: 'green', weight: 650, plate: true });
            sa.text('Clausius 1865, from Kopp’s and Grassi’s data', 4, 0.104, { size: 11, color: 'red', weight: 650, plate: true });
            sb.setTitle('the two specific heats themselves'); sb.setLabels('t (°C)', 'specific heat (units of C at 0 °C)'); sb.setTicks(null, null); sb.setView([-9, 103], [0.885, 1.012]);
            const c0 = waterAt(0.01, 1);
            sb.fn((t) => waterAt(t, 1) / c0, { color: 'red', width: 2.4, domain: [0.01, 99.9] }); sb.fn((t) => waterAt(t, 2) / c0, { color: 'blue', width: 2.4, domain: [0.01, 99.9] });
            const CC = [[0, 1, 0.9995], [25, 1.0016, 0.9918], [50, 1.0042, 0.9684]];
            for (const [t, C, c] of CC) { sb.dot(t, C, { r: 6, color: 'red', hollow: true }); sb.dot(t, c, { r: 6, color: 'blue', hollow: true }); }
            sb.text('C: today’s cp', 95, waterAt(95, 1) / c0, { dy: -10, align: 'right', size: 11, color: 'red', weight: 650 }); sb.text('c: today’s cv', 66, waterAt(66, 2) / c0, { dx: 10, dy: -6, size: 11, color: 'blue', weight: 650 });
            sb.text('rings: Clausius’ pairs (C from Regnault)', 2, 0.895, { size: 11, color: 'muted', plate: true });
            out = { m, d25: kellDiff(25) };
            v.legend([['red', 'Clausius 1865', { dot: true }], ['green', 'today, from density and compressibility'], ['ink', 'today, IAPWS-95 via NIST: $c_p - c_v$', { dot: true }]]);
          } else {
            // four bodies, all coupled, isolated from everything else
            const R_ = v.rng(seed), Cs = [1, 2, 3, 4].map(() => 500 + 2500 * R_()), T0s = [1, 2, 3, 4].map(() => 250 + 300 * R_()), G = 4;
            const tEnd = 2.6 * Math.max(...Cs) / G / 4, steps = 600, dt = tEnd / steps;
            let T = T0s.slice(); const hist = [{ t: 0, T: T.slice() }];
            for (let k = 0; k < steps; k++) {
              const d = (TT) => TT.map((Ti, i) => TT.reduce((s, Tj) => s + G * (Tj - Ti), 0) / Cs[i]);
              const k1 = d(T), k2 = d(T.map((x, i) => x + dt / 2 * k1[i])), k3 = d(T.map((x, i) => x + dt / 2 * k2[i])), k4 = d(T.map((x, i) => x + dt * k3[i]));
              T = T.map((x, i) => x + dt / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); hist.push({ t: (k + 1) * dt, T: T.slice() });
            }
            const Us = hist.map((h) => h.T.reduce((s, x, i) => s + Cs[i] * (x - T0s[i]), 0)), Ss = hist.map((h) => h.T.reduce((s, x, i) => s + Cs[i] * Math.log(x / T0s[i]), 0));
            const Tf = Cs.reduce((s, c, i) => s + c * T0s[i], 0) / Cs.reduce((s, c) => s + c, 0), Smax = Cs.reduce((s, c, i) => s + c * Math.log(Tf / T0s[i]), 0);
            const cols = ['red', 'orange', 'purple', 'blue'];
            sa.setTitle('four bodies exchanging heat, isolated from everything else'); sa.setLabels('time (s)', 'T (K)'); sa.setTicks(null, null); sa.setView([0, tEnd], [200, 600]);
            const order = T0s.map((x, i) => i).sort((a, b) => T0s[b] - T0s[a]);
            order.forEach((i, r) => sa.path(hist.map((h) => [h.t, h.T[i]]), { color: cols[r], width: 2.4 }));
            let lastY = -1e9; order.forEach((i, r) => { let y = sa.Y(T0s[i]); if (y < lastY + 15) y = lastY + 15; lastY = y; sa.textPx(`${T0s[i].toFixed(0)} K, C = ${(Cs[i] / 1000).toFixed(1)} kJ/K`, sa.X(tEnd * 0.06), y, { size: 10.5, color: cols[r], weight: 600, plate: true }); });
            sa.hline(Tf, { color: 'ink', dash: [5, 4], width: 1.2 });
            sb.setTitle('the world’s energy and entropy'); sb.setLabels('time (s)', 'change (kJ, J/K)'); sb.setTicks(null, null); sb.setView([0, tEnd], [-0.15 * Smax, 1.3 * Smax]);
            sb.hline(Smax, { color: 'green', width: 1.2, dash: [5, 4] });
            sb.path(hist.map((h, k) => [h.t, Us[k] / 1000]), { color: 'ink', width: 2.6 });
            sb.path(hist.map((h, k) => [h.t, Ss[k]]), { color: 'green', width: 2.6 });
            sb.text('1) Die Energie der Welt ist constant.', tEnd * 0.98, 0, { dy: -14, align: 'right', size: 11.5, weight: 650, color: 'ink', plate: true });
            sb.text('2) Die Entropie der Welt strebt einem Maximum zu.', tEnd * 0.98, Smax, { dy: -13, align: 'right', size: 11.5, weight: 650, color: 'green', plate: true });
            out = { m, dU: Math.max(...Us.map(Math.abs)), S: Ss[Ss.length - 1], Smax, Tf };
            v.legend([['red', 'body temperatures (hottest red … coldest blue)'], ['ink', 'total energy change (kJ)'], ['green', 'total entropy change (J/K)']]);
          }
        });
        v.readout(() => {
          if (!out) return '';
          if (out.m === 'loops') return `around the loop: $\\oint dQ$ = ${v.fix(out.Q, 1)} J (= the work done) · $\\oint dQ/T$ = **${v.fix(out.I, 5)} J/K** ${out.N > 1e-9 ? `< 0, the uncompensated transformation $N = \\oint dF/T$ = ${v.fix(out.N, 4)} J/K` : '— zero, as for every reversible cycle (equation I with =)'}`;
          if (out.m === 'water') return `$C - c$ at 25 °C: Clausius **0.0098** (with $A = 1/424$, $T = 298$) vs today ${v.fix(out.d25, 4)} (from Kell's density and compressibility) · at 50 °C: 0.0358 vs ${v.fix((323.15) / kellRho(50) * kellAlpha(50) ** 2 / kellKappa(50) / 1000 / waterAt(0.01, 1), 4)} · his $C$ (Regnault's values) rose with temperature, today's $c_p$ dips by 1% to a minimum near 35–40 °C — but $C - c$ needs only expansion and compressibility, and those were right to a few per cent`;
          return `largest change of the total energy ${v.fix(out.dU, 6)} J (constant) · total entropy rose by ${v.fix(out.S, 2)} J/K toward the maximum ${v.fix(out.Smax, 2)} J/K, reached when every body is at ${v.fix(out.Tf, 1)} K`;
        });
      },
    },
  ],
};
