// Physical Chemistry — Chapter 3: Entropy, the second and third laws, and free energy
import { R, RL } from './ch03.shared.js';

const Rln2 = R * Math.log(2);
const hmix = (x) => (x <= 0 || x >= 1 ? 0 : -(x * Math.log(x) + (1 - x) * Math.log(1 - x)));
const lnC = (N, n, M) => M.lgamma(N + 1) - M.lgamma(n + 1) - M.lgamma(N - n + 1);

// ---- 3.1: two blocks exchanging heat in packets ----------------------------------------------------------
const CBLK = 100, QPK = 50, NPK = 70;       // J/K per block, J per packet, packets shown
function ledger(mode, TA0, TB0, w) {
  let TA = TA0, TB = TB0, S = 0, alive = true;
  const out = { TA: [TA], TB: [TB], S: [0], dS: [0], ok: [true] };
  for (let i = 1; i <= NPK; i++) {
    let d = 0;
    if (mode === 'down') { if (TA - QPK / CBLK <= TB + QPK / CBLK) alive = false; if (alive) { d = QPK / TB - QPK / TA; TA -= QPK / CBLK; TB += QPK / CBLK; } }
    else if (mode === 'up') { d = QPK / TA - QPK / TB; TB -= QPK / CBLK; TA += QPK / CBLK; }
    else { d = -QPK / TB + (QPK + w) / TA; TB -= QPK / CBLK; TA += (QPK + w) / CBLK; }
    S += d; out.TA.push(TA); out.TB.push(TB); out.S.push(S); out.dS.push(d); out.ok.push(alive);
  }
  return out;
}

// ---- 3.2: reversible path integrals for 1 mol of perfect gas in the (V, T) plane ------------------------
const CVG = 1.5 * R;
function pathIntegrals(pts) {          // pts: [V, T] polyline (fine); returns [q_rev, ∫dq/T]
  let q = 0, s = 0;
  for (let i = 1; i < pts.length; i++) {
    const [V0, T0] = pts[i - 1], [V1, T1] = pts[i];
    const Tm = (T0 + T1) / 2, dV = V1 - V0, lv = Math.log(V1 / V0);
    // exact for the V-leg at constant Tm-ish: q = Cv dT + R T dV/V
    q += CVG * (T1 - T0) + R * Tm * lv;
    s += CVG * Math.log(T1 / T0) + R * lv;
  }
  return [q, s];
}
const fine = (poly, n = 120) => { const out = [poly[0]]; for (let i = 1; i < poly.length; i++) for (let k = 1; k <= n; k++) { const t = k / n; out.push([poly[i - 1][0] + t * (poly[i][0] - poly[i - 1][0]), poly[i - 1][1] + t * (poly[i][1] - poly[i - 1][1])]); } return out; };
const isoV = (V0, V1, T, n = 200) => Array.from({ length: n + 1 }, (_, k) => [V0 * Math.pow(V1 / V0, k / n), T]);   // isotherm sampled evenly in ln V

// ---- 3.3: Carnot cycle -------------------------------------------------------------------------------------
const GAM = 5 / 3;
function carnot(Th, Tc, r, VA) {
  const VB = VA * r, k = Math.pow(Th / Tc, 1.5), VC = VB * k, VD = VA * k;
  return { VA, VB, VC, VD, Th, Tc };
}
function etaOfLoop(pts) {              // pts closed loop of [S, T] clockwise; efficiency = ∮T dS / Σ_{dS>0} T dS
  let W = 0, Qin = 0;
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; const dq = (a[1] + b[1]) / 2 * (b[0] - a[0]); W += dq; if (b[0] > a[0]) Qin += dq; }
  return { W, Qin, eta: Qin > 0 ? W / Qin : 0 };
}

// ---- 3.6: Trouton data (kJ/mol at the normal boiling point; see the item's scope for sources) -------------
const TROUTON = [
  ['benzene', 353.3, 30.72, 'apolar'], ['toluene', 383.8, 33.18, 'apolar'], ['n-hexane', 341.9, 28.85, 'apolar'], ['cyclohexane', 353.9, 29.97, 'apolar'],
  ['CCl₄', 349.8, 29.82, 'apolar'], ['CHCl₃', 334.3, 29.24, 'apolar'], ['CS₂', 319.2, 26.74, 'apolar'], ['diethyl ether', 307.7, 26.52, 'apolar'], ['acetone', 329.3, 29.1, 'apolar'],
  ['methane', 111.7, 8.17, 'light'], ['nitrogen', 77.34, 5.6, 'light'], ['argon', 87.3, 6.44, 'light'],
  ['methanol', 337.8, 35.21, 'hbond'], ['ethanol', 351.5, 38.56, 'hbond'], ['water', 373.15, 40.66, 'hbond'], ['ammonia', 239.5, 23.5, 'hbond'],
  ['acetic acid', 391.2, 23.7, 'acid'],
];
const TCOL = { apolar: 'accent', light: 'teal', hbond: 'red', acid: 'purple' };

export default {
  collection: 'pchem',
  chapter: 3,
  title: 'Entropy, the second and third laws, and free energy',
  summary: String.raw`The second law says the entropy of an isolated system never decreases; the Clausius inequality turns this into a test for spontaneity and Carnot's analysis into a ceiling on engine efficiency. Boltzmann's formula reads entropy as a count of microstates, and the third law fixes its zero. Focusing on the system alone, the Helmholtz and Gibbs energies become the quantities chemists minimize, and the Maxwell relations connect what can be measured to what cannot.`,
  items: [
    {
      num: '3.1', kind: 'Law', name: 'Second law of thermodynamics',
      statement: String.raw`In any spontaneous process in an isolated system the total entropy cannot decrease: $\Delta S_{\text{total}} \ge 0$, with equality only for an idealized reversible process. Two equivalent classical wordings: heat never flows by itself from a colder body to a hotter one (Clausius), and no cyclic process has as its sole result the conversion of heat from one reservoir into work (Kelvin–Planck). Lowering the entropy of one part of the world is allowed, but only by raising that of another part by at least as much.`,
      idea: String.raw`The law is an empirical generalization of what never happens: perpetual-motion machines of the second kind. Once heat is assigned the entropy $\mathrm{d}q/T$ (pchem-3.2), the Clausius statement says exactly that moving a packet $q$ from a cold block at $T_B$ to a hot one at $T_A$ changes the entropy by $q/T_A - q/T_B < 0$ unless something else compensates, for instance work degraded into heat. It builds on the first law (pchem-2.1), which says nothing about direction, and on the thermodynamic-level Kelvin and Clausius statements (thermo-2.1).`,
      caption: String.raw`Two blocks of equal heat capacity (100 J/K) trade packets of 50 J. Pick the direction, drag the packet counter and watch the ledger on the right: downhill packets always add entropy; uphill packets subtract it unless you pay the work $w$ per packet. Raise $w$ until the ledger turns around: that is the minimum work.`,
      deps: ['pchem-2.1', 'thermo-2.1'],
      refs: ['Atkins 3A', 'M–S ch. 20'],
      tags: ['second law', 'entropy', 'spontaneity'],
      credit: 'Clausius, 1850; Kelvin, 1851',
      scope: String.raw`Macroscopic systems, where fluctuations are negligible (see pchem-3.7). The model blocks have constant heat capacity and the work is supplied by a pure-work source that carries no entropy; the dates are those usually quoted for the two statements and were checked only against secondary sources.`,
      verify: true,
      viz(v) {
        const mode = v.select('exchange', [{ value: 'down', label: 'hot → cold' }, { value: 'up', label: 'cold → hot, no work' }, { value: 'work', label: 'cold → hot, with work' }], 'down');
        const TA = v.slider('$T_A$ (hot block)', 300, 420, 350, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const TB = v.slider('$T_B$ (cold block)', 240, 320, 290, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const W = v.slider('work per packet $w$', 0, 40, 14, { step: 0.5, fmt: (x) => `${x.toFixed(1)} J` });
        const n = v.slider('packets passed', 0, NPK, 25, { int: true });
        const s1 = v.stage({ x: [0, NPK], y: [230, 440], axes: 'box', gutter: true, xlabel: 'packets passed', ylabel: '$T$ / K', height: 300, title: 'temperatures of the two blocks' });
        const s2 = v.stage({ x: [0, NPK], y: [-1, 1], axes: 'box', gutter: true, xlabel: 'packets passed', ylabel: '$\\Delta S_{\\mathrm{total}}$ / (J/K)', height: 300, title: 'running entropy ledger (blocks + work source)' });
        let L;
        v.render(() => {
          W.el.hidden = mode.value !== 'work';
          L = ledger(mode.value, TA.value, TB.value, W.value);
          const k = n.value;
          s1.path(L.TA.map((t, i) => [i, t]), { color: 'red', width: 2 });
          s1.path(L.TB.map((t, i) => [i, t]), { color: 'blue', width: 2 });
          s1.vline(k, { color: 'gold', width: 2 });
          s1.dot(k, L.TA[k], { r: 5, color: 'red' }); s1.dot(k, L.TB[k], { r: 5, color: 'blue' });
          s1.text('A', 1.5, L.TA[0], { color: 'red', dy: -10 }); s1.text('B', 1.5, L.TB[0], { color: 'blue', dy: 12 });
          const lo = Math.min(0, ...L.S), hi = Math.max(0, ...L.S), pad = Math.max(0.15, (hi - lo) * 0.15);
          s2.setView([0, NPK], [lo - pad, hi + pad]);
          s2.hline(0, { color: 'muted', dash: true });
          const sgn = L.S[NPK] >= -1e-12 ? 'green' : 'red';
          s2.path(L.S.map((t, i) => [i, t]), { color: sgn, width: 2.5 });
          s2.vline(k, { color: 'gold', width: 2 });
          s2.dot(k, L.S[k], { r: 6, color: L.S[k] >= -1e-12 ? 'green' : 'red' });
          if (L.S[NPK] < -1e-12) s2.corner('forbidden: total entropy falls', 'br', { color: 'red', plate: true });
          else if (mode.value === 'down' && !L.ok[NPK]) s2.corner('equilibrium reached: entropy stops growing', 'br', { color: 'green', plate: true });
        });
        v.legend([['red', 'block A'], ['blue', 'block B'], ['green', 'ΔS_total ≥ 0'], ['red', 'ΔS_total < 0 (never happens)']]);
        v.readout(() => {
          const k = n.value, Tm = L.TA[k], Tc = L.TB[k];
          const wmin = QPK * (Tm / Tc - 1);
          return `after ${k} packets: $T_A=${v.fix(Tm, 2)}$ K, $T_B=${v.fix(Tc, 2)}$ K, $\\Delta S_{\\text{total}}=${v.fix(L.S[k], 4)}$ J/K\nlast packet: $\\Delta S=${v.fix(L.dS[k], 5)}$ J/K\nminimum work to push a ${QPK} J packet uphill at these temperatures: $w_{\\min}=q(T_A/T_B-1)=${v.fix(wmin, 2)}$ J`;
        });
      },
    },
    {
      num: '3.2', kind: 'Definition', name: 'Thermodynamic entropy dS = đq_rev/T',
      statement: String.raw`The entropy of a closed system is the state function defined by its change along any reversible path between two states,
$$\mathrm{d}S = \frac{\mathrm{d}q_{\text{rev}}}{T}, \qquad \Delta S = \int_1^2 \frac{\mathrm{d}q_{\text{rev}}}{T}.$$
The heat $q_{\text{rev}}$ itself depends on the path, but dividing by the temperature at which it is exchanged produces an exact differential: the integral is the same for every reversible path from state 1 to state 2.`,
      idea: String.raw`That $1/T$ is an integrating factor for $\mathrm{d}q_{\text{rev}}$ is a consequence of the second law: if $\oint \mathrm{d}q_{\text{rev}}/T$ were not zero around some cycle, a combination of Carnot cycles (pchem-3.3) would violate it. For a perfect gas it can be checked directly, since $\mathrm{d}q_{\text{rev}} = C_V\,\mathrm{d}T + (RT/V)\,\mathrm{d}V$ is not exact, but dividing by $T$ gives $C_V\,\mathrm{d}\ln T + R\,\mathrm{d}\ln V$, which is (pchem-2.3 supplies the heat/work bookkeeping).`,
      caption: String.raw`One mole of a monatomic perfect gas starts at the black dot (300 K, $V_1$). Drag the end state, and drag the purple control point to bend the third route. For each of the three reversible routes the left bars show the heat absorbed (different) and the right bars show $\int \mathrm{d}q_{\text{rev}}/T$ (identical, and equal to $C_V\ln(T_2/T_1)+R\ln(V_2/V_1)$).`,
      deps: ['pchem-3.1', 'pchem-2.3'],
      refs: ['Atkins 3A', 'M–S ch. 20'],
      tags: ['entropy', 'state function', 'perfect gas'],
      credit: 'Clausius, 1865 (named entropy)',
      scope: String.raw`Reversible paths of a closed perfect-gas system with constant $C_V = \tfrac32 R$; the path integrals are evaluated numerically (400 steps) along the drawn routes.`,
      viz(v) {
        const T1 = 300;
        const sp = v.stage({ x: [0.3, 3.4], y: [150, 700], axes: 'box', gutter: true, xlabel: '$V / V_1$', ylabel: '$T$ / K', height: 360, title: 'three reversible routes from 1 to 2' });
        const sq = v.stage({ x: [0.4, 3.6], y: [-1, 1], axes: 'box', gutter: true, ylabel: 'heat $q_{\\mathrm{rev}}$ / J', height: 360, title: 'heat: depends on the route', xticks: [[1, 'A'], [2, 'B'], [3, 'C']] });
        const ss = v.stage({ x: [0.4, 3.6], y: [-1, 1], axes: 'box', gutter: true, ylabel: '$\\int \\mathrm{d}q_{\\mathrm{rev}}/T$ / (J/K)', height: 360, title: 'entropy change: the same', xticks: [[1, 'A'], [2, 'B'], [3, 'C']] });
        const P = sp.handle(2.2, 480, { color: 'accent', label: '2', constrain: { x: [0.35, 3.3], y: [160, 690] } });
        const C = sp.handle(0.6, 600, { color: 'purple', label: 'bend C', constrain: { x: [0.3, 3.4], y: [150, 700] } });
        let res = [];
        v.render(() => {
          const V2 = P.x, T2 = P.y;
          const A = isoV(1, V2, T1).concat(fine([[V2, T1], [V2, T2]], 120).slice(1));
          const B = fine([[1, T1], [1, T2]], 120).concat(isoV(1, V2, T2).slice(1));
          const Cp = Array.from({ length: 401 }, (_, k) => { const t = k / 400, u = 1 - t; return [u * u * 1 + 2 * u * t * C.x + t * t * V2, u * u * T1 + 2 * u * t * C.y + t * t * T2]; });
          const routes = [[A, 'blue'], [B, 'orange'], [Cp, 'purple']];
          res = routes.map(([pts]) => pathIntegrals(pts));
          routes.forEach(([pts, c], i) => { sp.path(pts, { color: c, width: 2.5 }); sp.text('ABC'[i], pts[Math.floor(pts.length * (i === 2 ? 0.5 : 0.78))][0], pts[Math.floor(pts.length * (i === 2 ? 0.5 : 0.78))][1], { color: c, dy: -11, size: 14 }); });
          sp.dot(1, T1, { r: 6, color: 'ink', label: '1', labelPos: 'sw' });
          sp.dot(C.x, C.y, { r: 0.1, color: 'purple' });
          const dS = CVG * Math.log(T2 / T1) + R * Math.log(V2);
          const qs = res.map((r) => r[0]), lo = Math.min(0, ...qs), hi = Math.max(0, ...qs), pad = Math.max(50, (hi - lo) * 0.2);
          sq.setView([0.4, 3.6], [lo - pad, hi + pad]); sq.hline(0, { color: 'muted' });
          res.forEach((r, i) => { sq.rect(i + 0.65, 0, i + 1.35, r[0], { fill: ['blue', 'orange', 'purple'][i], fillAlpha: 0.6, color: ['blue', 'orange', 'purple'][i] }); sq.text(v.fix(r[0], 0), i + 1, r[0], { dy: r[0] >= 0 ? -10 : 12, size: 12 }); });
          const ds = res.map((r) => r[1]), lo2 = Math.min(0, dS), hi2 = Math.max(0, dS), pad2 = Math.max(1.5, (hi2 - lo2) * 0.3);
          ss.setView([0.4, 3.6], [lo2 - pad2, hi2 + pad2]); ss.hline(0, { color: 'muted' });
          res.forEach((r, i) => { ss.rect(i + 0.65, 0, i + 1.35, r[1], { fill: ['blue', 'orange', 'purple'][i], fillAlpha: 0.6, color: ['blue', 'orange', 'purple'][i] }); ss.text(v.fix(r[1], 3), i + 1, r[1], { dy: r[1] >= 0 ? -10 : 12, size: 12 }); });
          ss.hline(dS, { color: 'green', dash: true, width: 1.5 });
          ss.corner('dashed: $C_V\\ln(T_2/T_1)+R\\ln(V_2/V_1)$', 'tl', { color: 'green' });
        });
        v.readout(() => {
          const dS = CVG * Math.log(P.y / T1) + R * Math.log(P.x);
          return `$q_A=${v.fix(res[0][0], 1)}$ J, $q_B=${v.fix(res[1][0], 1)}$ J, $q_C=${v.fix(res[2][0], 1)}$ J (path dependent)\n$\\int\\mathrm{d}q/T$: ${res.map((r) => v.fix(r[1], 4)).join(' , ')} J/K; formula $C_V\\ln(T_2/T_1)+R\\ln(V_2/V_1)=${v.fix(dS, 4)}$ J/K`;
        });
      },
    },
    {
      num: '3.3', kind: 'Theorem', name: 'Carnot cycle and its efficiency',
      statement: String.raw`A reversible engine that takes heat $q_h$ from a reservoir at $T_h$, rejects $q_c$ to a reservoir at $T_c$ and delivers the difference as work has efficiency
$$\eta = \frac{w}{q_h} = 1 - \frac{T_c}{T_h},$$
and no engine working between the same two reservoirs can exceed it. For a perfect gas the Carnot cycle consists of an isothermal expansion at $T_h$, an adiabatic expansion down to $T_c$, an isothermal compression at $T_c$ and an adiabatic compression back; in the $T$–$S$ plane it is a rectangle.`,
      idea: String.raw`On the isotherms $q_h = RT_h\ln(V_B/V_A)$ and $q_c = RT_c\ln(V_C/V_D)$; the reversible adiabats (pchem-2.7) force $V_C/V_D = V_B/V_A$, so the logarithms cancel in the ratio $q_c/q_h = T_c/T_h$. In entropy language the engine absorbs and rejects the same entropy $\Delta S = q_h/T_h = q_c/T_c$, and the work is the enclosed area of the $T$–$S$ rectangle. That no cycle does better follows from the second law (pchem-3.2): a better engine run against a Carnot refrigerator would move heat from cold to hot with no net work (thermo-2.7).`,
      caption: String.raw`Drag $T_h$, $T_c$ and the expansion ratio. The pV diagram (one mole of perfect gas) and the TS diagram show the same cycle; the shaded area is the work. Switch on a rival cycle drawn in the TS plane between the same temperature limits and entropy span: its efficiency, computed from the same area ratio, always falls below the Carnot value.`,
      deps: ['pchem-3.2', 'pchem-2.7', 'thermo-2.7'],
      refs: ['Atkins 3A', 'M–S ch. 20'],
      tags: ['Carnot', 'efficiency', 'heat engine'],
      credit: 'Carnot, 1824',
      scope: String.raw`Reversible cycle between two reservoirs; the pV diagram uses a monatomic perfect gas ($\gamma = 5/3$). Efficiency formula as a limit: real engines run irreversibly and are slower than this (see pchem-3.4).`,
      viz(v) {
        const Th = v.slider('$T_h$', 350, 900, 600, { step: 5, fmt: (x) => `${x.toFixed(0)} K` });
        const Tc = v.slider('$T_c$', 150, 500, 300, { step: 5, fmt: (x) => `${x.toFixed(0)} K` });
        const rr = v.slider('expansion ratio $V_B/V_A$', 1.3, 6, 3, { step: 0.05 });
        const riv = v.select('rival cycle', [{ value: 'none', label: 'none' }, { value: 'ell', label: 'ellipse' }, { value: 'tri', label: 'triangle' }], 'ell');
        const sp = v.stage({ x: [0, 55], y: [0, 12], axes: 'box', gutter: true, xlabel: '$V$ / L', ylabel: '$p$ / bar', height: 340, title: 'pV diagram (perfect gas, 1 mol)' });
        const st = v.stage({ x: [-2, 11], y: [0, 950], axes: 'box', gutter: true, xlabel: '$S - S_A$ / (J/K)', ylabel: '$T$ / K', height: 340, title: 'TS diagram' });
        let eta = 0, etaR = 0, W = 0, qh = 0, Cc = null;
        v.render(() => {
          const th = Th.value, tc = Math.min(Tc.value, th - 25);
          const c = carnot(th, tc, rr.value, 5); Cc = c;
          const pIso = (T) => (V) => RL * T / V;
          const k = RL * th * Math.pow(c.VB, GAM) / c.VB;                    // p V^γ constant on the adiabat through B
          const kc = RL * th * Math.pow(c.VA, GAM) / c.VA;                    // the other adiabat passes through A (and D)
          const pts = [];
          for (let i = 0; i <= 120; i++) { const V = c.VA * Math.pow(c.VB / c.VA, i / 120); pts.push([V, pIso(th)(V)]); }
          for (let i = 1; i <= 120; i++) { const V = c.VB * Math.pow(c.VC / c.VB, i / 120); pts.push([V, k / Math.pow(V, GAM)]); }
          for (let i = 1; i <= 120; i++) { const V = c.VC * Math.pow(c.VD / c.VC, i / 120); pts.push([V, pIso(tc)(V)]); }
          for (let i = 1; i <= 120; i++) { const V = c.VD * Math.pow(c.VA / c.VD, i / 120); pts.push([V, kc / Math.pow(V, GAM)]); }
          sp.setView([0, Math.max(10, c.VC * 1.12)], [0, Math.max(3, pIso(th)(c.VA) * 1.15)]);
          sp.poly(pts, { fill: 'accent', fillAlpha: 0.14, stroke: false });
          sp.path(pts.slice(0, 121), { color: 'red', width: 2.5 }); sp.path(pts.slice(120, 241), { color: 'muted', width: 2.5, dash: true });
          sp.path(pts.slice(240, 361), { color: 'blue', width: 2.5 }); sp.path(pts.slice(360), { color: 'muted', width: 2.5, dash: true });
          [['A', c.VA, pIso(th)(c.VA), 'sw'], ['B', c.VB, pIso(th)(c.VB), 'ne'], ['C', c.VC, pIso(tc)(c.VC), 'ne'], ['D', c.VD, pIso(tc)(c.VD), 'sw']].forEach(([n, x, y, lp]) => sp.dot(x, y, { r: 5, color: 'ink', label: n, labelPos: lp }));
          // work by numerical ∮ p dV
          W = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; W += (a[1] + b[1]) / 2 * (b[0] - a[0]); } W *= 100;
          qh = R * th * Math.log(rr.value);
          eta = W / qh;
          // TS
          const dS = R * Math.log(rr.value);
          st.setView([-0.25 * dS, 1.25 * dS], [0, th * 1.12]);
          st.rect(0, tc, dS, th, { fill: 'accent', fillAlpha: 0.14, color: 'accent', width: 2.5 });
          st.line(0, th, dS, th, { color: 'red', width: 3 }); st.line(0, tc, dS, tc, { color: 'blue', width: 3 });
          st.text('heat in $q_h$', dS / 2, th, { dy: -10, color: 'red', size: 12 }); st.text('heat out $q_c$', dS / 2, tc, { dy: 14, color: 'blue', size: 12 });
          st.text('A', 0, th, { dx: -10, dy: -8 }); st.text('B', dS, th, { dx: 10, dy: -8 }); st.text('C', dS, tc, { dx: 10, dy: 12 }); st.text('D', 0, tc, { dx: -10, dy: 12 });
          st.text('adiabat', dS, (th + tc) / 2, { dx: 8, align: 'left', color: 'muted', size: 11 });
          // rival
          etaR = 0;
          if (riv.value !== 'none') {
            let loop;
            if (riv.value === 'ell') loop = Array.from({ length: 200 }, (_, i) => { const a = i / 200 * 2 * Math.PI; return [dS / 2 - dS / 2 * Math.cos(a), (th + tc) / 2 + (th - tc) / 2 * Math.sin(a)]; });
            else loop = [[0, th], [dS, th], [dS / 2, tc]];
            // orientation clockwise in TS (S to the right on top): ellipse above runs left→right on top
            st.poly(loop, { fill: 'orange', fillAlpha: 0.2, color: 'orange', width: 2.5 });
            etaR = etaOfLoop(loop).eta;
          }
        });
        v.legend([['red', 'isothermal expansion at $T_h$'], ['blue', 'isothermal compression at $T_c$'], ['muted', 'adiabats', { dash: true }], ['orange', 'rival cycle']]);
        v.readout(() => `$\\eta_{\\text{Carnot}}=1-T_c/T_h=${v.fix(1 - Math.min(Tc.value, Th.value - 25) / Th.value, 4)}$; from the pV loop $w/q_h=${v.fix(W, 1)}/${v.fix(qh, 1)}=${v.fix(eta, 4)}$\n${riv.value !== 'none' ? `rival cycle (TS area ratio): $\\eta=${v.fix(etaR, 4)}$ — ${etaR < eta ? 'below' : 'NOT below'} Carnot` : 'rival cycle off'}`);
      },
    },
    {
      num: '3.4', kind: 'Theorem', name: 'Clausius inequality',
      statement: String.raw`For any cyclic process in which the system exchanges heat $\mathrm{d}q$ with surroundings at temperature $T_{\text{surr}}$ at the boundary,
$$\oint \frac{\mathrm{d}q}{T_{\text{surr}}} \le 0,$$
with equality exactly when the cycle is reversible. Equivalently, for any change of state $\Delta S \ge \int \mathrm{d}q/T_{\text{surr}}$, so for an isolated system $\Delta S \ge 0$.`,
      idea: String.raw`Cut a general cycle into small pieces, each exchanging heat with a Carnot engine that connects it to a single reservoir (pchem-3.3). If the cycle were irreversible, the engines would convert heat from that one reservoir into work with no other effect, which the second law forbids (pchem-3.1; thermo-2.8 states the same inequality). Irreversibility enters through temperature differences across the boundary and through friction, and the amount by which the sum falls short of zero is the entropy generated.`,
      caption: String.raw`A gas runs a Carnot-shaped cycle between reservoirs at $T_h$ and $T_c$. Increase the temperature drop $\delta$ (heat flows across a finite gap) or the friction fraction $f$ of the work lost to heat. The waterfall adds up $q/T_{\text{surr}}$ leg by leg: zero for the reversible cycle, negative otherwise; the grey bar shows that the gas's own entropy change around the loop is zero regardless.`,
      deps: ['pchem-3.3', 'thermo-2.8'],
      refs: ['Atkins 3A', 'M–S ch. 20'],
      tags: ['Clausius inequality', 'irreversibility', 'entropy production'],
      credit: 'Clausius, 1854 and 1865',
      scope: String.raw`Model cycle of one mole of perfect gas with isothermal legs at $T_h-\delta$ and $T_c+\delta$ and ideal (reversible) adiabats; friction returns a fraction $f$ of the net work as heat to the cold side. The dates are those usually quoted and were checked only against secondary sources.`,
      verify: true,
      viz(v) {
        const Th = 600, Tc = 300;
        const dl = v.slider('temperature drop $\\delta$', 0, 140, 40, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const f = v.slider('friction fraction $f$', 0, 0.5, 0.1, { step: 0.01, fmt: (x) => `${(100 * x).toFixed(0)} %` });
        const r = v.slider('expansion ratio', 1.5, 6, 3, { step: 0.05 });
        const s1 = v.stage({ x: [-1, 11], y: [150, 700], axes: 'box', gutter: true, xlabel: '$S$ of the gas / (J/K)', ylabel: '$T$ / K', height: 340, title: 'the gas cycle in the TS plane' });
        const s2 = v.stage({ x: [0.3, 7.1], y: [-10, 10], axes: 'box', gutter: true, ylabel: '$q/T_{\\mathrm{surr}}$ / (J/K)', height: 340, title: 'adding up q/T leg by leg', xticks: [[1, 'hot leg'], [2, 'adiabat'], [3, 'cold leg'], [4, 'adiabat'], [5.3, 'Σ surr.'], [6.4, 'Σ gas']] });
        let res = {};
        v.render(() => {
          const d = Math.min(dl.value, (Th - Tc) / 2 - 6), t1 = Th - d, t2 = Tc + d, dS = R * Math.log(r.value);
          const qh = t1 * dS, qc0 = t2 * dS, w = qh - qc0, qc = qc0 + f.value * w;
          const a = qh / Th, b = -qc / Tc, tot = a + b;
          res = { qh, qc, w, a, b, tot, eff: (1 - f.value) * w / qh, carnot: 1 - Tc / Th, gas: qh / t1 - qc0 / t2 };
          s1.setView([-0.25 * dS, 1.25 * dS], [150, 700]);
          s1.hline(Th, { color: 'red', dash: true, width: 1.5 }); s1.hline(Tc, { color: 'blue', dash: true, width: 1.5 });
          s1.text('hot reservoir', 1.22 * dS, Th, { align: 'right', dy: -8, color: 'red', size: 11 }); s1.text('cold reservoir', 1.22 * dS, Tc, { align: 'right', dy: 14, color: 'blue', size: 11 });
          s1.rect(0, t2, dS, t1, { fill: 'accent', fillAlpha: 0.16, color: 'accent', width: 2.5 });
          if (d > 0.5) { s1.measure(0.5 * dS, Th, 0.5 * dS, t1, `δ`); s1.measure(0.5 * dS, Tc, 0.5 * dS, t2, `δ`); }
          s2.setView([0.3, 7.1], [-Math.max(8, 1.25 * Math.abs(b), 1.25 * a), Math.max(8, 1.25 * a)]);
          s2.hline(0, { color: 'muted' });
          s2.rect(0.65, 0, 1.35, a, { fill: 'red', fillAlpha: 0.6, color: 'red' }); s2.text('+' + v.fix(a, 2), 1, a, { dy: -9, size: 12 });
          s2.rect(1.65, -0.0, 2.35, 0.0001, { fill: 'muted', fillAlpha: 0.5, color: 'muted' }); s2.text('0', 2, 0, { dy: -9, size: 12 });
          s2.rect(2.65, 0, 3.35, b, { fill: 'blue', fillAlpha: 0.6, color: 'blue' }); s2.text(v.fix(b, 2), 3, b, { dy: 13, size: 12 });
          s2.rect(3.65, 0, 4.35, 0.0001, { fill: 'muted', fillAlpha: 0.5, color: 'muted' }); s2.text('0', 4, 0, { dy: -9, size: 12 });
          s2.rect(4.9, 0, 5.7, tot, { fill: tot < -1e-9 ? 'orange' : 'green', fillAlpha: 0.7, color: tot < -1e-9 ? 'orange' : 'green' }); s2.text(v.fix(tot, 2), 5.3, tot, { dy: tot >= 0 ? -9 : 13, size: 12, color: 'ink' });
          s2.rect(6.0, 0, 6.8, res.gas, { fill: 'muted', fillAlpha: 0.4, color: 'muted' }); s2.text(v.fix(res.gas, 2), 6.4, res.gas, { dy: -9, size: 12 });
        });
        v.readout(() => `$\\oint \\mathrm{d}q/T_{\\mathrm{surr}} = ${v.fix(res.a, 3)} ${v.fix(res.b, 3).startsWith('−') ? '' : '+'}${v.fix(res.b, 3)} = ${v.fix(res.tot, 3)}$ J/K ${res.tot < -1e-9 ? '($<0$: irreversible)' : '(reversible)'}\nentropy generated $=${v.fix(-res.tot, 3)}$ J/K per cycle; efficiency $${v.fix(res.eff, 3)}$ against Carnot $${v.fix(res.carnot, 3)}$`);
      },
    },
    {
      num: '3.5', kind: 'Proposition', name: 'Entropy of expansion, heating and mixing',
      statement: String.raw`For a perfect gas and a substance of constant heat capacity the entropy changes of three basic processes are
$$\Delta S = nR\ln\frac{V_2}{V_1}\ \text{(isothermal expansion)},\qquad \Delta S = C\ln\frac{T_2}{T_1}\ \text{(heating at constant } C),$$
$$\Delta S_{\text{mix}} = -nR\,[x_A\ln x_A + x_B\ln x_B]\ \text{(mixing two different perfect gases at the same } T, p),$$
where $n$ is the total amount of gas. Mixing is maximal at $x_A = \tfrac12$, where it equals $R\ln 2$ per mole of mixture, and vanishes if the two gases are identical.`,
      idea: String.raw`Each is the integral $\int \mathrm{d}q_{\text{rev}}/T$ of pchem-3.2 along a convenient reversible path. For expansion, $q_{\text{rev}} = -w = nRT\ln(V_2/V_1)$ at constant $T$; for heating, $\mathrm{d}q = C\,\mathrm{d}T$. Mixing is two independent expansions: each gas expands from its own volume $x_iV$ to the full volume $V$, contributing $-n_iR\ln x_i$. Because the gases are identical in the last case there is no change of state, and the formula must not be applied.`,
      caption: String.raw`Three mini-panels. Drag the end of each process; the dots show the entropy computed for your choice. In the mixing panel move the mole fraction and watch the maximum at one half; switch on "same gas" and the curve collapses to zero (the Gibbs paradox is resolved by distinguishability).`,
      deps: ['pchem-3.2'],
      refs: ['Atkins 3B', 'M–S ch. 20'],
      tags: ['entropy', 'mixing', 'perfect gas'],
      credit: 'Gibbs, 1876–78 (mixing; the paradox named after him)',
      scope: String.raw`Perfect gases; the heating formula needs $C$ constant over the range; the mixing formula is for different gases initially at equal $T$ and $p$, with no heat or work from outside.`,
      viz(v) {
        const same = v.toggle('same gas on both sides', false);
        const sa = v.stage({ x: [1, 8], y: [0, 16], axes: 'box', gutter: true, xlabel: '$V_2/V_1$', ylabel: '$\\Delta S$ / (J/K), 1 mol', height: 300, title: 'isothermal expansion' });
        const sb = v.stage({ x: [200, 800], y: [0, 70], axes: 'box', gutter: true, xlabel: '$T_2$ / K  (from $T_1$ = 300 K)', ylabel: '$\\Delta S$ / (J/K)', height: 300, title: 'heating 1 mol of N₂ ($C_{p,m}$ = 29.1)' });
        const sc = v.stage({ x: [0, 1], y: [0, 7], axes: 'box', gutter: true, xlabel: 'mole fraction $x_A$', ylabel: '$\\Delta S_{\\mathrm{mix}}$ / (J/(K mol))', height: 300, title: 'mixing' });
        const ha = sa.handle(3, 0, { color: 'accent', constrain: (x) => [Math.min(8, Math.max(1, x)), 0], label: 'V₂' });
        const hb = sb.handle(600, 0, { color: 'orange', constrain: (x) => [Math.min(800, Math.max(200, x)), 0], label: 'T₂' });
        const hc = sc.handle(0.3, 0, { color: 'green', constrain: (x) => [Math.min(0.999, Math.max(0.001, x)), 0], label: 'x' });
        const CP_ = 29.1;
        v.render(() => {
          sa.fn((x) => R * Math.log(x), { color: 'accent', width: 2.5, domain: [1, 8] });
          const yA = R * Math.log(ha.x); ha.set(ha.x, 0);
          sa.vline(ha.x, { color: 'accent', dash: true }); sa.dot(ha.x, yA, { r: 6, color: 'gold' }); sa.text(v.fix(yA, 2), ha.x, yA, { dy: -12, size: 12 });
          sb.fn((x) => CP_ * Math.log(x / 300), { color: 'orange', width: 2.5, domain: [200, 800] });
          const yB = CP_ * Math.log(hb.x / 300);
          sb.vline(hb.x, { color: 'orange', dash: true }); sb.dot(hb.x, yB, { r: 6, color: 'gold' }); sb.text(v.fix(yB, 2), hb.x, yB, { dy: yB >= 0 ? -12 : 14, size: 12 });
          sb.setView([200, 800], [-15, 65]); sb.hline(0, { color: 'muted', dash: true });
          const g = same.value ? () => 0 : (x) => R * hmix(x);
          sc.fn(g, { color: 'green', width: 2.5, domain: [0.0005, 0.9995], n: 300 });
          sc.hline(Rln2, { color: 'muted', dash: true }); sc.text('R ln 2 = ' + v.fix(Rln2, 2), 0.02, Rln2, { align: 'left', dy: -9, size: 11, color: 'muted' });
          sc.vline(hc.x, { color: 'green', dash: true }); sc.dot(hc.x, g(hc.x), { r: 6, color: 'gold' }); sc.text(v.fix(g(hc.x), 2), hc.x, g(hc.x), { dy: -12, size: 12 });
          sc.vline(0.5, { color: 'faint' });
        });
        v.readout(() => `expansion to $V_2=${v.fix(ha.x, 2)}\\,V_1$: $\\Delta S=R\\ln(V_2/V_1)=${v.fix(R * Math.log(ha.x), 2)}$ J/K\nheating $300\\to${v.fix(hb.x, 0)}$ K: $\\Delta S=C_p\\ln(T_2/T_1)=${v.fix(CP_ * Math.log(hb.x / 300), 2)}$ J/K\nmixing at $x_A=${v.fix(hc.x, 3)}$: $\\Delta S_{\\text{mix}}=${same.value ? '0 (no change of state)' : v.fix(R * hmix(hc.x), 3) + '\\text{ J/(K mol)}'}$ ${same.value ? '' : `(maximum $R\\ln2=${v.fix(Rln2, 3)}$)`}`);
      },
    },
    {
      num: '3.6', kind: 'Law', name: 'Trouton’s rule',
      statement: String.raw`For many non-associated liquids the molar entropy of vaporization at the normal boiling point is roughly the same number,
$$\Delta_{\text{vap}}S = \frac{\Delta_{\text{vap}}H}{T_b} \approx 85\text{–}88\ \mathrm{J\,K^{-1}\,mol^{-1}} \ (\approx 10.5\,R).$$
Liquids whose structure is strongly ordered by hydrogen bonds (water, alcohols) sit well above this value, and substances with unusually low gas-phase entropy at their boiling point (the light cryogenic gases) sit below it, as do carboxylic acids that dimerize in the vapour.`,
      idea: String.raw`At $T_b$ liquid and vapour are in equilibrium, so $\Delta_{\text{vap}}S = \Delta_{\text{vap}}H/T_b$ exactly (pchem-3.5 gives the entropy change on expansion); a common rationalization is that this entropy is dominated by the roughly universal gain from turning a liquid into a gas at about 1 atm, a volume ratio of order a thousand; $R\ln 1000\approx 57$ J/K accounts for most of the number in a rough, non-rigorous way. Order in the liquid (hydrogen bonds) lowers the liquid's entropy and raises $\Delta_{\text{vap}}S$; vapour-phase association does the opposite.`,
      caption: String.raw`Each point is one liquid: boiling temperature against enthalpy of vaporization. The shaded band has the slope 85–88 J/(K mol) of Trouton's rule; the orange line has the slope you set with the slider $K$ (its bar-chart twin is the vertical orange line). Click a point to read its entropy of vaporization; the bar chart on the right ranks all of them.`,
      deps: ['pchem-3.5'],
      refs: ['Atkins 3B'],
      tags: ['Trouton', 'vaporization', 'entropy'],
      credit: 'Trouton, 1884 (Phil. Mag. 18, 54)',
      scope: String.raw`An empirical regularity for liquids of similar molecular order, not a law. The data are from the NIST Chemistry WebBook (boiling points: TRC averages; $\Delta_{\text{vap}}H$ at $T_b$ from the Majer & Svoboda 1985 compilation, ammonia from Overstreet & Giauque 1937, nitrogen from Giauque & Clayton 1933 rounded to 0.1 kJ/mol); water (40.66 kJ/mol) is the standard value and argon (6.44 kJ/mol) is converted from the latent heat per kilogram published by Air Liquide, so treat the argon entry as less certain.`,
      viz(v) {
        const Kc = v.slider('Trouton constant $K$', 60, 120, 86.5, { step: 0.5, fmt: (x) => `${x.toFixed(1)} J/(K mol)` });
        const s1 = v.stage({ x: [50, 420], y: [0, 45], axes: 'box', gutter: true, xlabel: '$T_b$ / K', ylabel: '$\\Delta_{\\mathrm{vap}}H$ / kJ mol⁻¹', height: 370, title: 'Trouton plot: 17 liquids at their normal boiling point' });
        const s2 = v.stage({ x: [0, 125], y: [0, 18], axes: 'box', gutter: true, xlabel: '$\\Delta_{\\mathrm{vap}}S$ / (J K⁻¹ mol⁻¹)', height: 370, title: 'ranked by entropy of vaporization', yticks: [] });
        let sel = TROUTON.findIndex((t) => t[0] === 'water');
        s1.onClick((x, y) => { let best = 0, bd = 1e9; TROUTON.forEach((t, i) => { const dd = ((t[1] - x) / 370) ** 2 + ((t[2] - y) / 45) ** 2; if (dd < bd) { bd = dd; best = i; } }); sel = best; v.invalidate(); });
        const ord = TROUTON.map((t, i) => [t[2] * 1000 / t[1], i]).sort((a, b) => a[0] - b[0]);
        const lab = { 'water': [0, -19], 'ethanol': [14, 4], 'methanol': [-10, 3], 'ammonia': [0, -11], 'acetic acid': [0, 15], 'methane': [8, -9], 'benzene': [12, 17], 'argon': [-4, -13] };
        v.render(() => {
          const K = Kc.value / 1000;
          s1.between((x) => 0.085 * x, (x) => 0.088 * x, 50, 420, { fill: 'green', fillAlpha: 0.22 });
          s1.fn((x) => K * x, { color: 'orange', width: 2, domain: [50, 420] });
          s1.text(`$K$ = ${v.fix(Kc.value, 1)} J/(K mol)`, 250, K * 250, { dy: 18, color: 'orange', size: 11 });
          s1.dot(TROUTON[sel][1], TROUTON[sel][2], { r: 11, hollow: true, color: 'gold' });
          TROUTON.forEach((t, i) => s1.dot(t[1], t[2], { r: i === sel ? 7 : 5, color: TCOL[t[3]] }));
          Object.entries(lab).forEach(([nm, [dx, dy]]) => { const t = TROUTON.find((q) => q[0] === nm); s1.text(t[0], t[1], t[2], { dx, dy, size: 11, color: 'muted', align: dx <= -10 ? 'right' : dx >= 8 ? 'left' : 'center' }); });
          s2.rect(85, 0, 88, 18, { fill: 'green', fillAlpha: 0.2, stroke: false });
          ord.forEach(([val, i], k) => { const t = TROUTON[i], y = 0.8 + k * 1.0; s2.rect(0, y - 0.38, val, y + 0.38, { fill: TCOL[t[3]], fillAlpha: i === sel ? 0.95 : 0.6, color: TCOL[t[3]] }); s2.text(t[0], 2, y, { align: 'left', size: 11, color: 'ink', plate: true }); });
          s2.vline(Kc.value, { color: 'orange', width: 2 });
        });
        v.legend([['accent', 'non-associated liquids', { dot: true }], ['teal', 'light cryogenic liquids', { dot: true }], ['red', 'hydrogen-bonded', { dot: true }], ['purple', 'carboxylic acid (dimerizes in vapour)', { dot: true }], ['green', '85–88 J/(K mol)', { area: true }]]);
        v.readout(() => { const t = TROUTON[sel], K = Kc.value; const near = TROUTON.filter((q) => Math.abs(q[2] * 1000 / q[1] / K - 1) < 0.05).length; return `${t[0]}: $T_b=${v.fix(t[1], 1)}$ K, $\\Delta_{\\text{vap}}H=${v.fix(t[2], 2)}$ kJ/mol, so $\\Delta_{\\text{vap}}S=${v.fix(t[2] * 1000 / t[1], 1)}$ J/(K mol) $=${v.fix(t[2] * 1000 / t[1] / R, 1)}\\,R$ (Trouton: about $10.5R=${v.fix(10.5 * R, 1)}$)\nwithin 5 % of $K=${v.fix(K, 1)}$: ${near} of ${TROUTON.length} liquids`; });
      },
    },
    {
      num: '3.7', kind: 'Principle', name: 'Boltzmann’s entropy formula S = k ln W',
      statement: String.raw`The entropy of a macroscopic state is proportional to the logarithm of the number $W$ of microstates compatible with it,
$$S = k_B \ln W,$$
where $k_B = 1.380649\times10^{-23}\ \mathrm{J\,K^{-1}}$ is Boltzmann's constant. For $N$ distinguishable particles shared between two halves of a box, the macrostate "$n$ on the left" has $W = \binom{N}{n}$, so $S/(Nk_B)$ tends to $-x\ln x-(1-x)\ln(1-x)$ with $x=n/N$ as $N$ grows; the equilibrium state is overwhelmingly the one that can be realized in the most ways. The formula applies to systems whose microstates are equally probable (the microcanonical ensemble).`,
      idea: String.raw`The logarithm is forced by additivity: entropy of two independent systems adds while the counts $W$ multiply. The count itself is a binomial coefficient, and Stirling's formula (pma-8.22) turns $\ln N! \approx N\ln N - N$ into the entropy function; the same function appears as the mixing entropy of pchem-3.5, which is now seen to be a statement about counting. Because $\binom{N}{n}/2^N$ is sharply peaked with relative width $\sim 1/\sqrt N$, fluctuations away from the maximum are unobservable for $N\sim10^{23}$ (thermo-5.6 is the same statement for a general system).`,
      caption: String.raw`Choose the number of particles $N$ and drag the fraction on the left. Left panel: $\ln W/N$ from the exact binomial count (blue), from the crude Stirling form (orange) and with the $\tfrac12\ln(2\pi n)$ corrections (green). Middle: the probability of each split, peaked at one half with width $\sim\sqrt N$. Right: one random arrangement of the particles.`,
      deps: ['pchem-3.5', 'pma-8.22', 'thermo-5.6'],
      refs: ['Atkins Focus 13', 'M–S ch. 20'],
      tags: ['Boltzmann', 'microstates', 'statistical entropy'],
      credit: 'Boltzmann, 1877 (statistical interpretation); the form $S=k\ln W$ is usually credited to Planck, c. 1900–01',
      scope: String.raw`Isolated systems with equiprobable microstates. The exact attribution of the compact formula is disputed in the secondary literature I could consult (Boltzmann's 1877 paper uses a different notation; the constant $k$ and the modern form appear in Planck's 1900–01 radiation papers), so the credit line is a summary, not a primary-source finding.`,
      verify: true,
      viz(v) {
        const M = v.M;
        const Nsel = v.select('particles $N$', [4, 10, 30, 100, 1000].map((x) => ({ value: x, label: String(x) })), 30);
        const xs = v.slider('fraction on the left $n/N$', 0, 1, 0.5, { step: 0.01 });
        const s1 = v.stage({ x: [0, 1], y: [0, 0.78], axes: 'box', gutter: true, xlabel: 'fraction on the left, $n/N$', ylabel: '$\\ln W / N$', height: 320, title: 'entropy per particle' });
        const s2 = v.stage({ x: [0, 1], y: [0, 1], axes: 'box', gutter: true, xlabel: 'fraction on the left, $n/N$', ylabel: 'probability of the split', height: 320, title: 'how likely is each split?' });
        const s3 = v.stage({ x: [0, 2.2], y: [0, 1.2], axes: false, equal: true, height: 320, title: 'one arrangement' });
        const rng = v.rng(11);
        const pos = Array.from({ length: 400 }, () => [rng(), rng()]);
        v.render(() => {
          const N = Nsel.value, n = Math.round(xs.value * N);
          const ex = []; for (let k = 0; k <= N; k++) ex.push([k / N, lnC(N, k, M) / N]);
          s1.fn(hmix, { color: 'orange', width: 2, dash: true, domain: [0.001, 0.999] });
          s1.path(ex, { color: 'blue', width: 2.5 });
          if (N <= 100) s1.dots(ex, { r: 3, color: 'blue' });
          const refined = []; for (let k = 1; k < N; k++) refined.push([k / N, (N * Math.log(N) - k * Math.log(k) - (N - k) * Math.log(N - k) + 0.5 * Math.log(N / (2 * Math.PI * k * (N - k)))) / N]);
          s1.path(refined, { color: 'green', width: 2, dash: [2, 3] });
          s1.dot(n / N, lnC(N, n, M) / N, { r: 7, color: 'gold' });
          s1.hline(Math.log(2), { color: 'muted', dash: true, width: 1 }); s1.text('ln 2', 0.02, Math.log(2), { align: 'left', dy: -9, size: 11, color: 'muted' });
          // probability
          const P = []; let pk = 0; for (let k = 0; k <= N; k++) { const p = Math.exp(lnC(N, k, M) - N * Math.log(2)); P.push([k / N, p]); pk = Math.max(pk, p); }
          s2.setView([0, 1], [0, pk * 1.18]);
          if (N <= 100) { P.forEach(([x, p], k) => s2.rect(x - 0.4 / N, 0, x + 0.4 / N, p, { fill: k === n ? 'gold' : 'blue', fillAlpha: k === n ? 0.9 : 0.55, color: k === n ? 'gold' : 'blue' })); }
          else { s2.path(P, { color: 'blue', width: 2.5 }); s2.dot(n / N, Math.exp(lnC(N, n, M) - N * Math.log(2)), { r: 6, color: 'gold' }); }
          // box
          const nd = Math.min(N, 400), nl = Math.round(nd * n / N);
          s3.rect(0, 0, 1, 1, { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.05 }); s3.rect(1.2, 0, 2.2, 1, { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.05 });
          pos.slice(0, nd).forEach(([a, b], i) => { const left = i < nl; s3.dot(left ? 0.05 + 0.9 * a : 1.25 + 0.9 * a, 0.05 + 0.9 * b, { r: N > 100 ? 2.5 : 5, color: left ? 'blue' : 'orange' }); });
          s3.text('left', 0.5, 1.1, { size: 12, color: 'muted' }); s3.text('right', 1.7, 1.1, { size: 12, color: 'muted' });
        });
        v.legend([['blue', 'exact $\\ln\\binom{N}{n}/N$'], ['orange', '$N\\ln N - n\\ln n-(N-n)\\ln(N-n)$ (Stirling)', { dash: true }], ['green', 'Stirling with $\\tfrac12\\ln(2\\pi n)$ terms', { dash: true }]]);
        v.readout(() => {
          const N = Nsel.value, n = Math.round(xs.value * N), lw = lnC(N, n, M), cr = n === 0 || n === N ? 0 : N * Math.log(N) - n * Math.log(n) - (N - n) * Math.log(N - n);
          const wtxt = lw < 25 ? `${v.fix(Math.exp(lw), 0)}` : `10^{${v.fix(lw / Math.LN10, 1)}}`;
          return `$N=${N}$, $n=${n}$: $W=\\binom{N}{n}=${wtxt}$, $\\ln W=${v.fix(lw, 3)}$ (Stirling: ${v.fix(cr, 3)}, error ${lw > 0 ? v.fix(100 * (cr - lw) / lw, 1) : '–'} %)\nall left: $W=1$, $S=0$; even split: $\\ln W=${v.fix(lnC(N, Math.round(N / 2), M), 3)}\\to N\\ln2$. For a mole of gas: $S_{\\text{even}}-S_{\\text{all left}}=k_B N_A \\ln2=R\\ln2=${v.fix(Rln2, 3)}$ J/K. Chance the box spontaneously goes all-left: $2^{-N}=${N <= 30 ? v.fix(Math.pow(2, -N), 10) : '10^{' + v.fix(-N * Math.log10(2), 0) + '}'}$`;
        });
      },
    },
    {
      num: '3.8', kind: 'Law', name: 'Third law and residual entropy',
      statement: String.raw`Third law (Nernst–Planck form): the entropy of a pure, perfectly ordered crystal in internal equilibrium tends to zero as $T\to0$, so entropy changes of all reactions between such substances vanish at absolute zero and absolute entropies can be tabulated. Where disorder is frozen in as the sample is cooled, the substance keeps a *residual entropy* $S_0 = k_B\ln W_0>0$: for a crystal of $N$ linear molecules such as CO that may sit in either of two orientations, $S_0 = R\ln 2$ per mole; for ordinary ice, counting the arrangements allowed by the Bernal–Fowler ice rules gives $S_0 \approx R\ln\tfrac32$ (Pauling).`,
      idea: String.raw`With Boltzmann's formula (pchem-3.7), a unique ground state gives $S(0)=k\ln1=0$. In CO the two orientations differ so little in energy that the molecules cannot reorient once the crystal is cold, and the calorimeter never sees the disorder they hold: the integral of $C_p/T$ from near 0 K (pchem-3.9) falls short of the statistical entropy by $S_0$. For ice, each of the $2N$ hydrogen bonds has two possible proton positions, so $4^N$ arrangements; the fraction of vertex configurations with exactly two protons near each oxygen is $6/16$, giving $W_0\approx(4\cdot\tfrac{6}{16})^N=(3/2)^N$.`,
      caption: String.raw`Left: a model crystal of CO whose molecules freeze at temperature $T_f$ with a small energy preference $\Delta E$ for the right orientation; lower $T_f$ or larger $\Delta E$ ordered it more, and the bar chart shows the residual entropy it leaves. Middle: click the four bonds around an oxygen to move protons: only arrangements with exactly two near protons obey the ice rules (6 of 16). Right: the numbers, with the calorimetric values.`,
      deps: ['pchem-3.7'],
      refs: ['Atkins Focus 3', 'M–S ch. 21'],
      tags: ['third law', 'residual entropy', 'ice rules'],
      credit: 'Nernst, 1906–12; Planck, 1911–12; Pauling, 1935',
      scope: String.raw`The CO panel is a toy model (independent orientations frozen in at $T_f$ with a two-level preference $\Delta E$ per molecule); its parameters are illustrative, not fitted. Measured values: Giauque and Stout's calorimetry of ice gave $0.82\pm0.05$ cal K⁻¹ mol⁻¹ (3.43 ± 0.21 J K⁻¹ mol⁻¹), and a 1932 table of zero-point entropies quotes Clayton and Giauque's CO value as $1.12\pm0.10$ cal K⁻¹ mol⁻¹ (about 4.7 J K⁻¹ mol⁻¹); the latter I could only confirm from a secondary summary, not the original paper.`,
      verify: true,
      viz(v) {
        const dE = v.slider('orientation preference $\\Delta E$', 0, 2000, 200, { step: 10, fmt: (x) => `${x.toFixed(0)} J/mol` });
        const Tf = v.slider('freezing temperature $T_f$', 5, 300, 80, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const sc = v.stage({ x: [0, 12], y: [0, 8], axes: false, equal: true, height: 300, title: 'CO crystal, frozen in at $T_f$' });
        const si = v.stage({ x: [-1.7, 1.7], y: [-1.5, 1.5], axes: false, equal: true, height: 300, title: 'ice: click a bond to move its proton' });
        const sb = v.stage({ x: [0, 6], y: [0, 7], axes: 'box', gutter: true, ylabel: '$S_0$ / (J K⁻¹ mol⁻¹)', height: 300, title: 'residual entropies', xticks: [] });
        const rng = v.rng(5);
        const u = Array.from({ length: 96 }, () => rng());
        const dirs = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [a / Math.SQRT2, b / Math.SQRT2]);
        const near = [true, true, false, false];
        si.onClick((x, y) => { let best = 0, bd = 1e9; dirs.forEach((d, i) => { const dd = Math.hypot(x - d[0] * 0.55, y - d[1] * 0.55); if (dd < bd) { bd = dd; best = i; } }); near[best] = !near[best]; v.invalidate(); });
        v.render(() => {
          const p = 1 / (1 + Math.exp(dE.value / (R * Tf.value)));
          for (let i = 0; i < 96; i++) { const cx = 0.9 + (i % 12) * 0.93, cy = 7.2 - Math.floor(i / 12) * 0.93, wrong = u[i] < p; sc.arrow(cx - 0.3 * (wrong ? -1 : 1), cy, cx + 0.3 * (wrong ? -1 : 1), cy, { color: wrong ? 'red' : 'blue', width: 2.5, head: 7 }); }
          // ice
          dirs.forEach((d, i) => { si.line(0, 0, d[0] * 1.2, d[1] * 1.2, { color: 'muted', width: 2.5 }); si.dot(d[0] * 1.2, d[1] * 1.2, { r: 9, color: 'red', hollow: true }); const k = near[i] ? 0.42 : 0.82; si.dot(d[0] * k, d[1] * k, { r: 6, color: 'accent' }); });
          si.dot(0, 0, { r: 12, color: 'red' }); si.text('O', 0, 0, { size: 11, color: 'ink' });
          const cnt = near.filter(Boolean).length; si.corner(cnt === 2 ? 'ice rules obeyed' : `${cnt} protons near: violates ice rules`, 'tl', { color: cnt === 2 ? 'green' : 'red', plate: true });
          // bars
          const S0m = -R * (p * Math.log(Math.max(p, 1e-12)) + (1 - p) * Math.log(Math.max(1 - p, 1e-12)));
          const bars = [[0.7, Rln2, 'muted'], [1.7, S0m, 'accent'], [2.7, 4.184 * 1.12, 'purple'], [3.7, R * Math.log(1.5), 'green'], [4.7, 4.184 * 0.82, 'orange']];
          bars.forEach(([x, h, c]) => { sb.rect(x - 0.32, 0, x + 0.32, h, { fill: c, fillAlpha: 0.65, color: c }); sb.text(v.fix(h, 2), x, h, { dy: (x === 2.7 || x === 4.7) ? -26 : -10, size: 12 }); });
          sb.line(2.7, 4.184 * 1.02, 2.7, 4.184 * 1.22, { color: 'ink', width: 2 }); sb.line(4.7, 4.184 * 0.77, 4.7, 4.184 * 0.87, { color: 'ink', width: 2 });
          sb.hline(0, { color: 'muted' });
        });
        v.legend([['muted', '$R\\ln2$, two orientations', { area: true }], ['accent', 'toy model', { area: true }], ['purple', 'CO, Clayton–Giauque (secondary source)', { area: true }], ['green', 'ice, Pauling count', { area: true }], ['orange', 'ice, Giauque–Stout', { area: true }]]);
        v.readout(() => {
          const p = 1 / (1 + Math.exp(dE.value / (R * Tf.value))), S0m = -R * (p * Math.log(Math.max(p, 1e-12)) + (1 - p) * Math.log(Math.max(1 - p, 1e-12)));
          return `model CO crystal: wrong-way fraction $p=${v.fix(p, 3)}$, $S_0=-R[p\\ln p+(1-p)\\ln(1-p)]=${v.fix(S0m, 2)}$ J/(K mol) (limit $R\\ln2=${v.fix(Rln2, 2)}$)\nice: $W_0=(3/2)^N$, $S_0=R\\ln\\tfrac32=${v.fix(R * Math.log(1.5), 2)}$ J/(K mol) against calorimetry $3.43\\pm0.21$; $6/16=${v.fix(6 / 16, 3)}$ of vertex states obey the rules`;
        });
      },
    },
  ],
};
