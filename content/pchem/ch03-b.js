// Physical Chemistry — Chapter 3: Entropy, the second and third laws, and free energy (part b: 3.9–3.15)
import { R, RL, VDW, vdwP, vdwV, cubicRoots, debyeS, debyeCv, DFH, cpOf, intCp, intCpT, S298 } from './ch03.shared.js';

// ---- 3.9: argon -------------------------------------------------------------------------------------------
// Transition data: T_m, T_b from NIST WebBook; latent heats converted from Air Liquide's per-kilogram values (29.588 and 161.14 kJ/kg × 39.948 g/mol);
// liquid C_p = 1.117 kJ/(kg K) at the boiling point (liquid-argon detector review) → 44.6 J/(K mol); S°(298.15 K, 1 bar) = 154.846 J/(K mol) (NIST/CODATA).
const AR = { Tm: 83.8, Tb: 87.3, Hf: 1182, Hv: 6437, CpL: 44.6, CpG: 2.5 * R, S298: 154.846 };
const argonParts = (theta, ex, Tend) => {
  const sol = debyeS(theta, Math.min(Tend, AR.Tm)) + ex * Math.min(Tend, AR.Tm) / AR.Tm;
  const fus = Tend > AR.Tm ? AR.Hf / AR.Tm : 0;
  const liq = Tend > AR.Tm ? AR.CpL * Math.log(Math.min(Tend, AR.Tb) / AR.Tm) : 0;
  const vap = Tend > AR.Tb ? AR.Hv / AR.Tb : 0;
  const gas = Tend > AR.Tb ? AR.CpG * Math.log(Tend / AR.Tb) + R * Math.log(1.01325) : 0;
  return { sol, fus, liq, vap, gas, total: sol + fus + liq + vap + gas };
};

// ---- 3.12–3.15: van der Waals gas -----------------------------------------------------------------------------
const CVM = { Ar: 1.5 * R, N2: cpOf('N2', 298.15) - R, CO2: cpOf('CO2', 298.15) - R };
const GASES = { CO2: VDW.CO2, N2: VDW.N2, Ar: VDW.Ar };
const potentials = (g, cv) => ({
  S: (T, V) => cv * Math.log(T / 298.15) + R * Math.log(V - g.b),                      // J/(K mol), V in L/mol; additive constant dropped
  p: (T, V) => 100 * vdwP(g, T, V),                                                         // kPa = J/L
});
const jac = (f, g, T, V) => {
  const hT = 1e-4 * T, hV = 1e-4 * V;
  const fT = (f(T + hT, V) - f(T - hT, V)) / (2 * hT), fV = (f(T, V + hV) - f(T, V - hV)) / (2 * hV);
  const gT = (g(T + hT, V) - g(T - hT, V)) / (2 * hT), gV = (g(T, V + hV) - g(T, V - hV)) / (2 * hV);
  return fT * gV - fV * gT;
};
const Tf = (T) => T, Vf = (T, V) => V;
const partial = (f, g, h, T, V) => jac(f, h, T, V) / jac(g, h, T, V);                // (∂f/∂g)_h by the Jacobian ratio

// reduced van der Waals: Maxwell construction
const reducedRoots = (pr, Tr) => cubicRoots(3 * pr, -(pr + 8 * Tr), 9, -3).filter((x) => x > 1 / 3);
function psatReduced(Tr) {
  if (Tr >= 1) return null;
  const sp = cubicRoots(4 * Tr, -9, 6, -1).filter((x) => x > 1 / 3);          // spinodal volumes: dp/dV = 0
  if (sp.length < 2) return null;
  const pOf = (Vr) => 8 * Tr / (3 * Vr - 1) - 3 / (Vr * Vr);
  const pLo = Math.max(1e-9, pOf(sp[0])), pHi = pOf(sp[sp.length - 1]);
  const area = (p) => { const r = reducedRoots(p, Tr); if (r.length < 3) return null; const l = r[0], gg = r[r.length - 1]; return (8 * Tr / 3) * Math.log((3 * gg - 1) / (3 * l - 1)) + 3 / gg - 3 / l - p * (gg - l); };
  let lo = pLo * 1.0001 + 1e-12, hi = pHi * 0.9999, fl = area(lo);
  if (fl === null || area(hi) === null) return null;
  for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2, fm = area(m); if (fm === null) break; if ((fm > 0) === (fl > 0)) { lo = m; fl = fm; } else hi = m; }
  return (lo + hi) / 2;
}
/** ln φ(p) by integrating (Z − 1)/p from 0 along the gas branch (p in bar). Returns {p[], lnphi[], pend}. */
function fugacityCurve(g, T, pmax, n = 800) {
  let pend = pmax;
  if (T < g.Tc) { const ps = psatReduced(T / g.Tc); if (ps) pend = Math.min(pmax, ps * g.pc * 0.9995); }
  const B = (g.b - g.a / (RL * T)), lim = B / (RL * T);
  const ps = [0], ys = [lim], lnphi = [0], Z = [1], V = [Infinity];
  let acc = 0;
  for (let i = 1; i <= n; i++) {
    const p = pend * i / n, roots = vdwV(g, T, p), Vg = roots[roots.length - 1], z = p * Vg / (RL * T);
    ps.push(p); ys.push((z - 1) / p); Z.push(z); V.push(Vg);
    acc += (ys[i] + ys[i - 1]) / 2 * (ps[i] - ps[i - 1]); lnphi.push(acc);
  }
  return { p: ps, lnphi, Z, V, pend };
}

// ---- 3.13: reactions ------------------------------------------------------------------------------------------
const HF = { N2: 0, H2: 0, NH3: DFH.NH3, CO: DFH.CO, H2O: DFH.H2Og, CO2: DFH.CO2, O2: 0 };
const RXN = {
  haber: { name: 'N₂ + 3 H₂ → 2 NH₃', tex: '\\mathrm{N_2}+3\\mathrm{H_2}\\to2\\mathrm{NH_3}', sp: [['N2', -1], ['H2', -3], ['NH3', 2]] },
  wgs: { name: 'CO + H₂O → CO₂ + H₂', tex: '\\mathrm{CO}+\\mathrm{H_2O(g)}\\to\\mathrm{CO_2}+\\mathrm{H_2}', sp: [['CO', -1], ['H2O', -1], ['CO2', 1], ['H2', 1]] },
  coox: { name: '2 CO + O₂ → 2 CO₂', tex: '2\\mathrm{CO}+\\mathrm{O_2}\\to2\\mathrm{CO_2}', sp: [['CO', -2], ['O2', -1], ['CO2', 2]] },
};
const rxnH = (r, T) => r.sp.reduce((s, [k, nu]) => s + nu * (HF[k] * 1000 + intCp(k, 298.15, T)), 0);          // J/mol
const rxnS = (r, T) => r.sp.reduce((s, [k, nu]) => s + nu * (S298[k] + intCpT(k, 298.15, T)), 0);             // J/(K mol)
const rxnG = (r, T) => rxnH(r, T) - T * rxnS(r, T);

export default {
  collection: 'pchem',
  chapter: 3,
  items: [
    {
      num: '3.9', kind: 'Method', name: 'Absolute entropies from heat capacities',
      statement: String.raw`With the third law fixing $S(0)=0$ for a perfect crystal, the entropy of a substance at temperature $T$ can be reconstructed from heat-capacity integrals, equilibrium latent heats and low-temperature extrapolation:
$$S(T) = \int_0^{T_m}\frac{C_p^{\text{solid}}}{T}\mathrm{d}T + \frac{\Delta_{\text{fus}}H}{T_m} + \int_{T_m}^{T_b}\frac{C_p^{\text{liq}}}{T}\mathrm{d}T + \frac{\Delta_{\text{vap}}H}{T_b} + \int_{T_b}^{T}\frac{C_p^{\text{gas}}}{T}\mathrm{d}T,$$
with the lowest part extrapolated by the Debye law $C_p\approx aT^3$ below the lowest measured temperature. Each phase transition at equilibrium adds $\Delta_{\text{trs}}H/T_{\text{trs}}$ (pchem-3.6), and each integral is the area under $C_p/T$, equivalently the area under $C_p$ plotted against $\ln T$.`,
      idea: String.raw`Entropy is a state function (pchem-3.2), so any reversible path from 0 K will do, and heating at constant pressure supplies $\mathrm{d}q_{\text{rev}} = C_p\,\mathrm{d}T$ (pchem-2.5). The third law (pchem-3.8) removes the integration constant; the Debye extrapolation covers the range where calorimeters cannot reach, and is accurate because lattice vibrations are phonons of low frequency there. Substances with frozen-in disorder come out lower than the statistical value by the residual entropy.`,
      caption: String.raw`A model of argon, built from its transition data. Left: $C_p$ against $\ln T$; the shaded areas are the entropy contributions (solid from a Debye model, liquid, gas). Right: the running entropy with the jumps at melting and boiling, ending at the tabulated $S^\circ$. Slide the Debye temperature and the extra solid heat capacity to see how much each piece matters, and where the Debye-only model falls short.`,
      deps: ['pchem-3.8', 'pchem-2.5'],
      refs: ['Atkins Focus 3', 'M–S ch. 21'],
      tags: ['absolute entropy', 'Debye law', 'calorimetry'],
      credit: 'Nernst, 1906–12 (heat theorem); Debye, 1912 ($T^3$ law)',
      scope: String.raw`This is a **model reconstruction**, not Clusius's original data: the solid is a Debye solid (default $\theta_D = 92$ K, a typical low-temperature value I did not verify against a primary source) with $C_p\approx C_V$, so it omits the anharmonic $C_p - C_V$ excess near melting, which is why the sum falls several J/(K mol) short until the "extra solid $C_p$" slider is raised; the gas is treated as ideal ($C_p = \tfrac52R$) with a $R\ln(1.01325)$ correction from 1 atm to 1 bar. Melting and boiling points and $S^\circ=154.846$ J/(K mol) are NIST values; latent heats (1182 and 6437 J/mol) are converted from Air Liquide's per-kilogram values and the liquid $C_p$ (44.6) from a liquid-argon review, their uncertainty has not been established by this review.`,
      verify: true,
      viz(v) {
        const th = v.slider('Debye temperature $\\theta_D$', 60, 130, 92, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const ex = v.slider('extra solid $C_p - C_V$ at $T_m$', 0, 15, 0, { step: 0.1, fmt: (x) => `${x.toFixed(1)} J/(K mol)` });
        const te = v.slider('upper temperature', 50, 298.15, 298.15, { step: 0.5, fmt: (x) => `${x.toFixed(0)} K` });
        const s1 = v.stage({ x: [1, 320], y: [0, 50], xlog: true, axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$C_p$ / (J K⁻¹ mol⁻¹)', height: 340, title: 'area under $C_p$ against $\\ln T$ = entropy' });
        const s2 = v.stage({ x: [0, 310], y: [0, 170], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$S(T)$ / (J K⁻¹ mol⁻¹)', height: 340, title: 'running entropy of argon' });
        const cpOfT = (T, theta, e) => T <= AR.Tm ? R * debyeCv(T / theta) + e * T / AR.Tm : T <= AR.Tb ? AR.CpL : AR.CpG;
        v.render(() => {
          const T1 = te.value;
          const seg = (lo, hi, f, col) => { const hi2 = Math.min(hi, T1); if (hi2 <= lo) return; s1.fn(f, { domain: [lo, hi2], color: col, width: 2.5, fill: true, base: 0, n: 160 }); };
          seg(1, AR.Tm, (T) => cpOfT(T, th.value, ex.value), 'blue');
          seg(AR.Tm, AR.Tb, () => AR.CpL, 'orange');
          seg(AR.Tb, 320, () => AR.CpG, 'teal');
          s1.fn((T) => 12 * Math.PI ** 4 / 5 * R * (T / th.value) ** 3, { domain: [1, 12], color: 'ink', width: 1.2, dash: true });
          s1.text('Debye $T^3$ law', 2.2, 4.3, { size: 11, color: 'ink', align: 'left' });
          s1.vline(AR.Tm, { color: 'muted', dash: true }); s1.text('melt +' + v.fix(AR.Hf / AR.Tm, 1), AR.Tm, 47, { align: 'right', dx: -6, size: 11, color: 'muted' });
          s1.vline(AR.Tb, { color: 'muted', dash: true }); s1.text('boil +' + v.fix(AR.Hv / AR.Tb, 1), AR.Tb, 41, { align: 'left', dx: 6, size: 11, color: 'muted' });
          s1.vline(T1, { color: 'gold', width: 2 });
          // running entropy
          const pts = [];
          const push = (T) => { const p = argonParts(th.value, ex.value, T); pts.push([T, p.total]); };
          for (let T = 0.5; T <= Math.min(AR.Tm, T1); T += 0.5) push(T);
          const segs = [pts.slice()]; pts.length = 0;
          const pAt = (T) => argonParts(th.value, ex.value, T).total;
          const sol = argonParts(th.value, ex.value, AR.Tm - 1e-9).total;
          s2.path(segs[0], { color: 'blue', width: 2.5 });
          if (T1 > AR.Tm) {
            const afterFus = sol + AR.Hf / AR.Tm;
            s2.line(AR.Tm, sol, AR.Tm, afterFus, { color: 'orange', width: 2.5, dash: true });
            const liqEnd = afterFus + AR.CpL * Math.log(Math.min(T1, AR.Tb) / AR.Tm);
            s2.line(AR.Tm, afterFus, Math.min(T1, AR.Tb), liqEnd, { color: 'orange', width: 2.5 });
            if (T1 > AR.Tb) {
              const afterVap = liqEnd + AR.Hv / AR.Tb;
              s2.line(AR.Tb, liqEnd, AR.Tb, afterVap, { color: 'teal', width: 2.5, dash: true });
              const g = []; for (let T = AR.Tb; T <= T1; T += 1) g.push([T, afterVap + AR.CpG * Math.log(T / AR.Tb)]); g.push([T1, afterVap + AR.CpG * Math.log(T1 / AR.Tb) + R * Math.log(1.01325)]);
              s2.path(g, { color: 'teal', width: 2.5 });
            }
          }
          s2.hline(AR.S298, { color: 'green', dash: true, width: 1.5 }); s2.text('tabulated $S^\\circ$ = 154.85', 8, AR.S298, { align: 'left', dy: -9, size: 11, color: 'green' });
          s2.vline(T1, { color: 'gold', width: 2 }); s2.dot(T1, pAt(T1), { r: 6, color: 'gold' });
        });
        v.legend([['blue', 'solid (Debye model)', { area: true }], ['orange', 'liquid', { area: true }], ['teal', 'gas', { area: true }]]);
        v.readout(() => {
          const p = argonParts(th.value, ex.value, te.value);
          return `up to ${v.fix(te.value, 0)} K: solid $${v.fix(p.sol, 2)}$ + fusion $${v.fix(p.fus, 2)}$ + liquid $${v.fix(p.liq, 2)}$ + vaporization $${v.fix(p.vap, 2)}$ + gas $${v.fix(p.gas, 2)}$ = $${v.fix(p.total, 2)}$ J/(K mol)\n${te.value > 298 ? `tabulated $S^\\circ(298.15\\ \\mathrm{K})=154.85$: the model is ${v.fix(Math.abs(AR.S298 - p.total), 2)} J/(K mol) ${p.total < AR.S298 ? 'short' : 'over'} (model assumptions and rounded input data)` : 'raise the upper temperature to 298 K to compare with the tabulated value'}`;
        });
      },
    },
    {
      num: '3.10', kind: 'Definition', name: 'Helmholtz and Gibbs energies',
      statement: String.raw`The Helmholtz energy $A = U - TS$ and the Gibbs energy $G = H - TS = U + pV - TS$ are state functions of the system alone. For a process at constant temperature and constant volume with no non-expansion work, $\Delta S_{\text{total}} = \Delta S - \Delta U/T = -\Delta A/T$, and at constant temperature and pressure $\Delta S_{\text{total}} = \Delta S - \Delta H/T = -\Delta G/T$. Hence a spontaneous change has $\Delta A\le 0$ (at constant $T,V$) or $\Delta G\le0$ (at constant $T,p$), and equilibrium is a minimum of the corresponding function.`,
      idea: String.raw`Constant $T$ puts the surroundings in a huge thermal bath, so heat leaves the system reversibly for them: $q_{\text{surr}} = -q_{\text{sys}}$, which equals $-\Delta U$ at constant volume and $-\Delta H$ at constant pressure (pchem-2.3, pchem-2.5). Then the second law (pchem-3.4) $\Delta S+\Delta S_{\text{surr}}\ge0$ becomes a statement about the system alone, after multiplying by $-T$. The two functions are Legendre transforms of $U$ and $H$ with respect to $S$ (mech-12.1 states the transform), which is why $T$ is their natural variable.`,
      caption: String.raw`Choose a constraint and a process (the default is melting of ice: $\Delta H=+6.01$ kJ/mol and $\Delta S\approx +22$ J/(K mol)). The left curve is the total entropy change as a function of temperature; it is zero at $T^* = \Delta H/\Delta S$, and above it the endothermic process is driven by the system's own entropy. The bars on the right split $\Delta S_{\text{total}}$ into system and surroundings, and show that $-\Delta G/T$ (or $-\Delta A/T$) equals their sum.`,
      deps: ['pchem-3.4', 'mech-12.1', 'thermo-3.9'],
      refs: ["Tong §4.4, Eqs. (4.19)–(4.22)"],
      tags: ['Gibbs energy', 'Helmholtz energy', 'spontaneity'],
      credit: 'Helmholtz and Gibbs energies',
      scope: String.raw`Closed systems with only expansion work, in contact with a bath at the temperature of the system. The model takes $\Delta H$ and $\Delta S$ independent of $T$ (their change with $T$ is a heat-capacity effect, pchem-2.11), and $\Delta U=\Delta H-\Delta n_{\text{gas}}RT$ for ideal gases. The ice-melting default uses rounded transition parameters near 273.15 K.`,
      viz(v) {
        const cons = v.select('constraint', [{ value: 'p', label: 'constant $T, p$ → $G$' }, { value: 'V', label: 'constant $T, V$ → $A$' }], 'p');
        const dH = v.slider('$\\Delta H$', -80, 80, 6.01, { step: 0.01, fmt: (x) => `${x.toFixed(2)} kJ/mol` });
        const dS = v.slider('$\\Delta S$ of system', -200, 200, 22, { step: 0.5, fmt: (x) => `${x.toFixed(1)} J/(K mol)` });
        const dn = v.slider('$\\Delta n_{\\mathrm{gas}}$', -3, 3, 0, { int: true });
        const s1 = v.stage({ x: [100, 600], y: [-1, 1], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$\\Delta S_{\\mathrm{total}}$ / (J K⁻¹ mol⁻¹)', height: 330, title: 'total entropy change against temperature' });
        const s2 = v.stage({ x: [0.3, 4.7], y: [-1, 1], axes: 'box', gutter: true, ylabel: 'entropy change / (J K⁻¹ mol⁻¹)', height: 330, title: 'system + surroundings', xticks: [[1, 'system'], [2, 'surroundings'], [3, 'total'], [4, '−ΔG/T']] });
        const hT = s1.handle(298.15, 0, { color: 'gold', label: 'T', constrain: (x) => [Math.min(600, Math.max(100, x)), 0] });
        const calc = (T) => {
          const q = cons.value === 'p' ? dH.value * 1000 : dH.value * 1000 - dn.value * R * T;     // heat absorbed by the system, J/mol
          const Ssur = -q / T, Stot = dS.value + Ssur, dF = q - T * dS.value;
          return { q, Ssur, Stot, dF };
        };
        v.render(() => {
          const lab = cons.value === 'p' ? 'G' : 'A';
          const ys = []; for (let T = 100; T <= 600; T += 5) ys.push(calc(T).Stot);
          const lo = Math.min(...ys, calc(hT.x).Stot), hi = Math.max(...ys, calc(hT.x).Stot), pad = Math.max(2, (hi - lo) * 0.15);
          s1.setView([100, 600], [Math.min(lo, 0) - pad, Math.max(hi, 0) + pad]);
          s1.hline(0, { color: 'muted' });
          const path = []; for (let T = 100; T <= 600; T += 2) path.push([T, calc(T).Stot]);
          // colour by sign
          let seg = []; let sgn = null;
          path.forEach((pt) => { const s = pt[1] >= 0; if (sgn !== null && s !== sgn) { s1.path(seg, { color: sgn ? 'green' : 'red', width: 2.8 }); seg = [seg[seg.length - 1]]; } sgn = s; seg.push(pt); });
          if (seg.length) s1.path(seg, { color: sgn ? 'green' : 'red', width: 2.8 });
          const c = calc(hT.x); hT.set(hT.x, c.Stot);
          s1.vline(hT.x, { color: 'gold', dash: true });
          const Tst = dH.value * 1000 / dS.value;
          if (cons.value === 'p' && Tst > 100 && Tst < 600 && Math.abs(dS.value) > 0.5) { s1.dot(Tst, 0, { r: 5, color: 'ink' }); s1.text('$T^*$ = ' + v.fix(Tst, 0) + ' K', Tst, 0, { dy: 18, size: 12 }); }
          s1.corner(c.Stot >= 0 ? 'spontaneous' : 'not spontaneous', 'tr', { color: c.Stot >= 0 ? 'green' : 'red', plate: true });
          const vals = [c.Stot - c.Ssur, c.Ssur, c.Stot, -c.dF / hT.x], cols = ['accent', 'orange', c.Stot >= 0 ? 'green' : 'red', 'purple'];
          const m = Math.max(5, ...vals.map(Math.abs)) * 1.25;
          s2.setView([0.3, 4.7], [-m, m]); s2.hline(0, { color: 'muted' });
          vals.forEach((h, i) => { s2.rect(i + 0.65, 0, i + 1.35, h, { fill: cols[i], fillAlpha: 0.65, color: cols[i] }); s2.text(v.fix(h, 2), i + 1, h, { dy: h >= 0 ? -10 : 13, size: 12 }); });
          s2.setTicks([[1, 'system'], [2, 'surroundings'], [3, 'total'], [4, `−Δ${lab}/T`]], null);
        });
        v.readout(() => {
          const c = calc(hT.x), lab = cons.value === 'p' ? 'G' : 'A';
          return `$T=${v.fix(hT.x, 1)}$ K: $q_{\\text{sys}}=${v.fix(c.q / 1000, 2)}$ kJ/mol, $\\Delta S_{\\text{surr}}=-q/T=${v.fix(c.Ssur, 2)}$, $\\Delta S_{\\text{total}}=${v.fix(c.Stot, 2)}$ J/(K mol)\n$\\Delta ${lab} = ${cons.value === 'p' ? '\\Delta H' : '\\Delta U'} - T\\Delta S = ${v.fix(c.dF / 1000, 3)}$ kJ/mol, so $-\\Delta ${lab}/T=${v.fix(-c.dF / hT.x, 2)}$ J/(K mol) $=\\Delta S_{\\text{total}}$`;
        });
      },
    },
    {
      num: '3.11', kind: 'Theorem', name: 'Maximum non-expansion work equals −ΔG',
      statement: String.raw`At constant temperature and pressure, the maximum non-expansion work (electrical, for example) that a system can deliver is $w_{\text{e,max}} = -\Delta G$, attained only in a reversible process; any real process delivers $w_e \le -\Delta G$, and the shortfall, $-\Delta G - w_e$, is dissipated as extra heat. For a cell that transfers $n$ moles of electrons per mole of reaction at reversible voltage $E$ this is $\Delta G = -nFE$.`,
      idea: String.raw`Combining the first law at constant $p$ ($\Delta H = q-w_e$ for work $w_e$ delivered by the system) with the second law ($q\le T\Delta S$, pchem-3.4) gives $w_e\le T\Delta S-\Delta H=-\Delta G$ for the work delivered; equality for reversible heat exchange. A fuel cell run slowly converts the free-energy part of the reaction enthalpy to work, and the rest, $-T\Delta S$, must leave as heat; run faster, overpotentials turn more of the free energy into heat and the voltage sags below its reversible value.`,
      caption: String.raw`A hydrogen–oxygen fuel cell, $\mathrm{H_2}+\tfrac12\mathrm{O_2}\to\mathrm{H_2O(l)}$. Drag the current density along the polarization curve (illustrative model, not a measured curve). The stacked bar splits the reaction enthalpy, 285.8 kJ per mole of $\mathrm{H_2}$, into electrical work, the unavoidable reversible heat $-T\Delta S$ and the dissipated extra heat. At vanishing current the work reaches $-\Delta G$.`,
      deps: ['pchem-3.10'],
      refs: ["DOE Fuel Cell Handbook (7th ed.), §2.1 and §2.3, Eqs. (2-1)–(2-2), (2-14)–(2-19)"],
      tags: ['Gibbs energy', 'maximum work', 'fuel cell'],
      credit: 'Gibbs maximum-work bound',
      scope: String.raw`Constant $T$ and $p$, reaction to liquid water at 298.15 K with $\Delta_rH^\circ=-285.83$ kJ/mol and $\Delta_rG^\circ=-237.13$ kJ/mol ($E^\circ=1.229$ V; thermoneutral voltage $-\Delta H/2F=1.481$ V). The polarization curve $V=E^\circ - b\ln(1+j/j_0) - r j$ with $b=0.05$ V, $j_0=0.01$ A cm⁻², and a slider resistance $r$ is an illustrative model, not data for any real cell.`,
      viz(v) {
        const Fc = 96485.33212, dG = -237130, dH = -285830, E0 = -dG / (2 * Fc), Eth = -dH / (2 * Fc);
        const rr = v.slider('cell resistance $r$', 0, 0.6, 0.2, { step: 0.01, fmt: (x) => `${x.toFixed(2)} Ω cm²` });
        const Vj = (j) => E0 - 0.05 * Math.log(1 + j / 0.01) - rr.value * j;
        const s1 = v.stage({ x: [0, 1.5], y: [0, 1.7], axes: 'box', gutter: true, xlabel: 'current density $j$ / (A cm⁻²)', ylabel: 'cell voltage / V', height: 340, title: 'polarization curve (illustrative model)' });
        const s2 = v.stage({ x: [0, 3], y: [0, 300], axes: 'box', gutter: true, ylabel: 'energy per mole of H₂ / kJ', height: 340, title: 'where the reaction enthalpy goes', xticks: [[0.8, 'reversible'], [2.2, 'at this current']] });
        const h = s1.handle(0.5, 0.8, { color: 'gold', label: 'load', constrain: (x) => { const j = Math.min(1.5, Math.max(0.001, x)); return [j, Vj(j)]; } });
        v.render(() => {
          s1.fn(Vj, { color: 'accent', width: 3, domain: [0.0003, 1.5], n: 300 });
          s1.hline(E0, { color: 'green', dash: true }); s1.text('reversible voltage $E^\\circ=-\\Delta G/2F$ = ' + v.fix(E0, 3) + ' V', 1.48, E0, { align: 'right', dy: -10, size: 11, color: 'green' });
          s1.hline(Eth, { color: 'muted', dash: true }); s1.text('thermoneutral $-\\Delta H/2F$ = ' + v.fix(Eth, 3) + ' V', 1.48, Eth, { align: 'right', dy: -10, size: 11, color: 'muted' });
          const j = h.x, V = Vj(j); h.set(j, V);
          s1.between(() => 0, (x) => Vj(x), 0.0003, j, { fill: 'blue', fillAlpha: 0.1 });
          const bar = (x0, wk) => { const th = -dH / 1000, rev = (dG - dH) / 1000; let y = 0; [[wk, 'blue'], [rev, 'orange'], [Math.max(0, th - wk - rev), 'red']].forEach(([hh, c]) => { s2.rect(x0 - 0.5, y, x0 + 0.5, y + hh, { fill: c, fillAlpha: 0.65, color: c }); if (hh > 12) s2.text(v.fix(hh, 1), x0, y + hh / 2, { size: 12 }); y += hh; }); };
          bar(0.8, -dG / 1000); bar(2.2, 2 * Fc * V / 1000);
          s2.hline(-dH / 1000, { color: 'muted', dash: true }); s2.text('$-\\Delta H$ = 285.8', 2.95, -dH / 1000, { align: 'right', dy: -9, size: 11, color: 'muted' });
        });
        v.legend([['blue', 'electrical work $w_e$', { area: true }], ['orange', 'reversible heat $-T\\Delta S$', { area: true }], ['red', 'dissipated heat', { area: true }]]);
        v.readout(() => {
          const j = h.x, V = Vj(j), we = 2 * Fc * V / 1000, lost = -dG / 1000 - we;
          return `$j=${v.fix(j, 3)}$ A/cm²: $V=${v.fix(V, 3)}$ V, work $w_e=2FV=${v.fix(we, 1)}$ kJ/mol against $-\\Delta G=237.1$ kJ/mol, so ${v.fix(lost, 1)} kJ/mol is dissipated ($w_e\\le-\\Delta G$ ✓)\nentropy produced $=${v.fix(lost * 1000 / 298.15, 1)}$ J/(K mol); efficiency $w_e/(-\\Delta H)=${v.fix(we / 285.83, 3)}$ (ceiling $\\Delta G/\\Delta H=${v.fix(237.13 / 285.83, 3)}$)`;
        });
      },
    },
    {
      num: '3.12', kind: 'Theorem', name: 'Fundamental equation and Maxwell relations',
      statement: String.raw`For a closed system doing only expansion work, the combined first and second laws give the fundamental equation $\mathrm{d}U = T\,\mathrm{d}S - p\,\mathrm{d}V$, and its Legendre transforms
$$\mathrm{d}H = T\,\mathrm{d}S + V\,\mathrm{d}p,\qquad \mathrm{d}A = -S\,\mathrm{d}T - p\,\mathrm{d}V,\qquad \mathrm{d}G = -S\,\mathrm{d}T + V\,\mathrm{d}p.$$
Because each is an exact differential, equality of mixed second derivatives yields the four Maxwell relations
$$\Big(\tfrac{\partial T}{\partial V}\Big)_S = -\Big(\tfrac{\partial p}{\partial S}\Big)_V,\quad \Big(\tfrac{\partial T}{\partial p}\Big)_S = \Big(\tfrac{\partial V}{\partial S}\Big)_p,\quad \Big(\tfrac{\partial S}{\partial V}\Big)_T = \Big(\tfrac{\partial p}{\partial T}\Big)_V,\quad \Big(\tfrac{\partial S}{\partial p}\Big)_T = -\Big(\tfrac{\partial V}{\partial T}\Big)_p.$$`,
      idea: String.raw`Write $\mathrm{d}U = T\,\mathrm{d}S - p\,\mathrm{d}V$ (pchem-3.2 for the heat term, pchem-2.1 for the work term). Each potential is a function of a natural pair of variables, with $T,p,V,S$ as its first partial derivatives; since mixed second partials of a smooth function commute (pma-9.41), differentiating each first derivative with respect to the other variable gives the relations. The point of the right-hand sides is that they are measurable ($p,V,T$ from an equation of state) while the left-hand sides involve $S$.`,
      caption: String.raw`Pick a potential in the square (rows: $S$ or $T$; columns: $V$ or $p$) to see its relation, and drag the state point on the $(T,V)$ plane of a van der Waals gas. The two bars give the two sides of the relation, each computed by finite differences of the van der Waals pressure and entropy through the Jacobian ratio $(\partial f/\partial g)_h$; they agree to rounding error. Switching to the ideal gas changes the numbers but not the agreement.`,
      deps: ['pchem-3.10', 'pma-9.41', 'thermo-3.12'],
      refs: ["Tong §4.4.2, Eqs. (4.23)–(4.26)"],
      tags: ['Maxwell relations', 'fundamental equation', 'state functions'],
      credit: 'Maxwell relations',
      scope: String.raw`Closed system, one component, expansion work only. The numerical test uses a van der Waals gas with constants computed from critical constants and a temperature-independent $C_V$; the relations hold for every equation of state, so the test checks the arithmetic, not the physics.`,
      viz(v) {
        const gas = v.select('gas', [{ value: 'CO2', label: '$\\mathrm{CO_2}$' }, { value: 'N2', label: '$\\mathrm{N_2}$' }, { value: 'Ar', label: 'Ar' }, { value: 'ideal', label: 'ideal' }], 'CO2');
        const pot = v.select('potential', [{ value: 'U', label: '$U(S,V)$' }, { value: 'H', label: '$H(S,p)$' }, { value: 'A', label: '$A(T,V)$' }, { value: 'G', label: '$G(T,p)$' }], 'A');
        const sq = v.stage({ x: [0, 4], y: [0, 4], axes: false, height: 330, title: 'thermodynamic square' });
        const sp = v.stage({ x: [250, 650], y: [0.06, 0.6], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$V$ / (L mol⁻¹)', height: 330, title: 'state plane: isobars and isentropes' });
        const sb = v.stage({ x: [0, 3], y: [-1, 1], axes: 'box', gutter: true, height: 330, title: 'both sides of the relation', xticks: [[0.8, 'left side'], [2.2, 'right side']] });
        const hs = sp.handle(400, 0.22, { color: 'gold', label: 'state', constrain: { x: [260, 640], y: [0.07, 0.58] } });
        const REL = {
          U: { tex: '\\left(\\frac{\\partial T}{\\partial V}\\right)_S = -\\left(\\frac{\\partial p}{\\partial S}\\right)_V', d: '\\mathrm{d}U=T\\,\\mathrm{d}S-p\\,\\mathrm{d}V', unit: 'K/L' },
          H: { tex: '\\left(\\frac{\\partial T}{\\partial p}\\right)_S = \\left(\\frac{\\partial V}{\\partial S}\\right)_p', d: '\\mathrm{d}H=T\\,\\mathrm{d}S+V\\,\\mathrm{d}p', unit: 'K/kPa' },
          A: { tex: '\\left(\\frac{\\partial S}{\\partial V}\\right)_T = \\left(\\frac{\\partial p}{\\partial T}\\right)_V', d: '\\mathrm{d}A=-S\\,\\mathrm{d}T-p\\,\\mathrm{d}V', unit: 'J/(K L)' },
          G: { tex: '-\\left(\\frac{\\partial S}{\\partial p}\\right)_T = \\left(\\frac{\\partial V}{\\partial T}\\right)_p', d: '\\mathrm{d}G=-S\\,\\mathrm{d}T+V\\,\\mathrm{d}p', unit: 'L/K' },
        };
        const model = () => { const g = gas.value === 'ideal' ? { a: 0, b: 0 } : GASES[gas.value]; const cv = gas.value === 'ideal' ? 1.5 * R : CVM[gas.value]; return potentials(g, cv); };
        const sides = (T, V) => {
          const { S, p } = model();
          switch (pot.value) {
            case 'U': return [partial(Tf, Vf, S, T, V), -partial(p, S, Vf, T, V)];
            case 'H': return [partial(Tf, p, S, T, V), partial(Vf, S, p, T, V)];
            case 'A': return [partial(S, Vf, Tf, T, V), partial(p, Tf, Vf, T, V)];
            default: return [-partial(S, p, Tf, T, V), partial(Vf, Tf, p, T, V)];
          }
        };
        v.render(() => {
          const cells = { U: [0.3, 2.2, 'U', 'S,V'], H: [2.1, 2.2, 'H', 'S,p'], A: [0.3, 0.5, 'A', 'T,V'], G: [2.1, 0.5, 'G', 'T,p'] };
          Object.entries(cells).forEach(([k, [x, y, nm, vars]]) => { const on = k === pot.value; sq.rect(x, y, x + 1.6, y + 1.4, { fill: on ? 'accent' : 'panel', fillAlpha: on ? 0.28 : 0.4, color: on ? 'accent' : 'muted', width: on ? 3 : 1.5 }); sq.tex(nm, x + 0.8, y + 0.85, { size: 28, color: on ? 'accent' : 'ink' }); sq.tex(`(${vars})`, x + 0.8, y + 0.3, { size: 14, color: 'muted' }); });
          sq.tex('V', 1.1, 3.85, { color: 'muted' }); sq.tex('p', 2.9, 3.85, { color: 'muted' }); sq.tex('S', 0.12, 2.9, { color: 'muted' }); sq.tex('T', 0.12, 1.2, { color: 'muted' });
          sq.tex(REL[pot.value].d, 2, 0.12, { size: 14 });
          const { S, p } = model();
          sp.clip(() => {
            const Ss = []; for (let i = 0; i <= 12; i++) for (let T of [250, 450, 650]) { const V = 0.07 + 0.51 * i / 12; Ss.push(S(T, V)); }
            const lo = Math.min(...Ss), hi = Math.max(...Ss);
            sp.contour((T, V) => S(T, V), Array.from({ length: 8 }, (_, i) => lo + (hi - lo) * (i + 1) / 9), { color: 'orange', width: 1.4, res: 80 });
            sp.contour((T, V) => p(T, V) / 100, [5, 20, 50, 100, 200, 400], { color: 'blue', width: 1.4, res: 80 });
          });
          const [l, r] = sides(hs.x, hs.y), m = Math.max(1e-9, Math.abs(l), Math.abs(r)) * 1.35;
          sb.setView([0, 3], [-m, m]); sb.hline(0, { color: 'muted' });
          [[0.8, l, 'accent'], [2.2, r, 'green']].forEach(([x, h, c]) => { sb.rect(x - 0.5, 0, x + 0.5, h, { fill: c, fillAlpha: 0.6, color: c }); sb.text('$' + v.sci(h, 4) + '$', x, h, { dy: h >= 0 ? -12 : 14, size: 12 }); });
          sb.setLabels(undefined, REL[pot.value].unit);
        });
        v.legend([['orange', 'isentropes (S = const)'], ['blue', 'isobars (p / bar)']]);
        v.readout(() => {
          const [l, r] = sides(hs.x, hs.y);
          return `$${REL[pot.value].tex}$\nat $T=${v.fix(hs.x, 0)}$ K, $V=${v.fix(hs.y, 3)}$ L/mol: left $=${v.sci(l, 6)}$, right $=${v.sci(r, 6)}$ ${REL[pot.value].unit}; relative difference $${v.sci(Math.abs(l - r) / Math.max(1e-30, Math.abs(l)), 2)}$`;
        });
      },
    },
    {
      num: '3.13', kind: 'Theorem', name: 'Gibbs–Helmholtz equation',
      statement: String.raw`At constant pressure the temperature dependence of the Gibbs energy is
$$\Big(\frac{\partial (G/T)}{\partial T}\Big)_p = -\frac{H}{T^2},\qquad\text{equivalently}\qquad \Big(\frac{\partial (G/T)}{\partial (1/T)}\Big)_p = H,$$
and for a change of state or reaction $\Big(\partial(\Delta G/T)/\partial(1/T)\Big)_p=\Delta H$. If $\Delta H$ is nearly constant between $T_1$ and $T_2$, then $\Delta G(T_2)/T_2 \approx \Delta G(T_1)/T_1 + \Delta H\,(1/T_2 - 1/T_1)$.`,
      idea: String.raw`From $G = H - TS$ and $(\partial G/\partial T)_p = -S$ (pchem-3.12, the $\mathrm{d}G$ relation), $(\partial (G/T)/\partial T)_p = \frac1T(\partial G/\partial T)_p - \frac{G}{T^2} = -\frac{S}{T} - \frac{H-TS}{T^2} = -\frac{H}{T^2}$. The substitution $u = 1/T$ turns this into a slope, so a plot of $\Delta G/T$ against $1/T$ has slope $\Delta H$: a straight line only if $\Delta H$ is constant, and a curve of slowly changing slope, set by $\Delta C_p$ (Kirchhoff, pchem-2.11), otherwise.`,
      caption: String.raw`Choose a reaction. The curve is $\Delta G^\circ/T$ against $1000/T$, built from standard enthalpies of formation, standard entropies and $C_p(T)$ polynomials. Drag the point along the curve: the tangent's slope is $\Delta H^\circ(T)$ in kJ/mol. Set a second temperature $T_2$ with the slider and compare the constant-$\Delta H$ extrapolation (open square) with the full calculation (filled); the right panel shows the error across the temperature range.`,
      deps: ['pchem-3.12'],
      refs: ['Atkins 3E', 'M–S ch. 22'],
      tags: ['Gibbs–Helmholtz', 'temperature dependence', 'extrapolation'],
      credit: 'Gibbs, 1870s; Helmholtz, 1882',
      scope: String.raw`Gas-phase reactions with ideal-gas $C_p(T)$ polynomials from the chapter-2 table and standard entropies at 298.15 K from NIST/CODATA (N₂ 191.609, H₂ 130.680, NH₃ 192.77, CO 197.660, CO₂ 213.785, H₂O(g) 188.835, O₂ 205.152 J K⁻¹ mol⁻¹); formation enthalpies are the chapter-2 values, so $\Delta H^\circ$ for ammonia synthesis ($-92.2$ kJ/mol) differs by 0.3 kJ/mol from the CODATA value ($-45.94$ kJ/mol per NH₃). The polynomials are only meaningful up to about 1000 K. The attribution to Gibbs and Helmholtz is quoted from secondary sources (Helmholtz 1882, Gibbs 1873–78).`,
      verify: true,
      viz(v) {
        const rx = v.select('reaction', Object.keys(RXN).map((k) => ({ value: k, label: `$${RXN[k].tex}$` })), 'haber');
        const T2 = v.slider('target temperature $T_2$', 300, 1000, 700, { step: 5, fmt: (x) => `${x.toFixed(0)} K` });
        const s1 = v.stage({ x: [1, 3.4], y: [-400, 100], axes: 'box', gutter: true, xlabel: '$1000\\,\\mathrm{K}/T$', ylabel: '$\\Delta G^\\circ/T$ / (J K⁻¹ mol⁻¹)', height: 340, title: '$\\Delta G/T$ against $1/T$' });
        const s2 = v.stage({ x: [300, 1000], y: [-30, 30], axes: 'box', gutter: true, xlabel: '$T_2$ / K', ylabel: 'error in $\\Delta G(T_2)$ / kJ mol⁻¹', height: 340, title: 'constant-$\\Delta H$ extrapolation minus full calculation' });
        const f = (x) => rxnG(RXN[rx.value], 1000 / x) / (1000 / x);
        const h = s1.handle(2.2, 0, { color: 'gold', label: 'T₁', constrain: (x) => { const xx = Math.min(3.35, Math.max(1.02, x)); return [xx, f(xx)]; } });
        v.render(() => {
          const r = RXN[rx.value];
          const ys = []; for (let x = 1; x <= 3.4; x += 0.05) ys.push(f(x));
          const lo = Math.min(...ys), hi = Math.max(...ys), pad = (hi - lo) * 0.2 + 5;
          s1.setView([1, 3.4], [lo - pad, hi + pad]);
          s1.fn(f, { color: 'accent', width: 3, domain: [1, 3.4], n: 200 });
          s1.hline(0, { color: 'muted', dash: true });
          const x1 = h.x, T1 = 1000 / x1, y1 = f(x1); h.set(x1, y1);
          const dH = rxnH(r, T1) / 1000;
          s1.line(1, y1 + dH * (1 - x1), 3.4, y1 + dH * (3.4 - x1), { color: 'orange', width: 1.8 });
          const xx = 1000 / T2.value, pred = y1 + dH * (xx - x1), exact = f(xx);
          s1.vline(xx, { color: 'muted', dash: true });
          s1.dot(xx, pred, { r: 7, color: 'orange', hollow: true }); s1.dot(xx, exact, { r: 5, color: 'green' });
          s1.text('$T_2$', xx, hi + pad * 0.6, { size: 12, color: 'muted' });
          // error panel
          const err = (T) => { const x = 1000 / T; return ((y1 + dH * (x - x1)) - f(x)) * T / 1000; };
          const es = []; for (let T = 300; T <= 1000; T += 10) es.push(err(T));
          const m = Math.max(2, ...es.map(Math.abs)) * 1.2;
          s2.setView([300, 1000], [-m, m]); s2.hline(0, { color: 'muted' });
          s2.fn(err, { color: 'red', width: 2.5, domain: [300, 1000], n: 140 });
          s2.vline(T1, { color: 'gold', width: 2 }); s2.dot(T2.value, err(T2.value), { r: 6, color: 'orange' });
        });
        v.legend([['accent', 'full $\\Delta G^\\circ/T$'], ['orange', 'tangent: slope $\\Delta H^\\circ(T_1)$'], ['green', 'exact at $T_2$', { dot: true }]]);
        v.readout(() => {
          const r = RXN[rx.value], x1 = h.x, T1 = 1000 / x1, y1 = f(x1), dH = rxnH(r, T1) / 1000, xx = 1000 / T2.value, pred = (y1 + dH * (xx - x1)) * T2.value / 1000, exact = f(xx) * T2.value / 1000;
          return `at $T_1=${v.fix(T1, 0)}$ K: $\\Delta G^\\circ=${v.fix(y1 * T1 / 1000, 1)}$ kJ/mol, slope $\\Delta H^\\circ(T_1)=${v.fix(dH, 1)}$ kJ/mol (Kirchhoff)\nat $T_2=${v.fix(T2.value, 0)}$ K: Gibbs–Helmholtz with constant $\\Delta H$ gives $\\Delta G=${v.fix(pred, 1)}$ kJ/mol; full calculation $${v.fix(exact, 1)}$ kJ/mol; error $${v.fix(pred - exact, 2)}$ kJ/mol`;
        });
      },
    },
    {
      num: '3.14', kind: 'Definition', name: 'Pressure dependence of G and fugacity',
      statement: String.raw`At constant temperature $(\partial G/\partial p)_T = V$, so $G_m(p)-G_m(p_0)=\int_{p_0}^{p}V_m\,\mathrm{d}p$. For a perfect gas this is $RT\ln(p/p_0)$. For a real gas one keeps the same form by defining the **fugacity** $f$, an effective pressure, through
$$\mu(p) = \mu^\circ + RT\ln\frac{f}{p^\circ},\qquad f=\varphi\,p,\qquad \ln\varphi = \int_0^{p}\frac{Z-1}{p'}\,\mathrm{d}p',$$
where $Z=pV_m/RT$ is the compression factor (pchem-1.11) and $\varphi\to1$ as $p\to0$. The fugacity coefficient is below 1 where attractions dominate ($Z<1$) and above 1 where repulsion dominates.`,
      idea: String.raw`The relation $(\partial G/\partial p)_T=V$ is the $\mathrm{d}G$ equation of pchem-3.12. Subtracting the perfect-gas integral $\int RT\,\mathrm{d}p/p$ from the real one gives $\int_0^p (V_m - RT/p')\,\mathrm{d}p' = RT\int_0^p (Z-1)/p'\,\mathrm{d}p'$, which defines $\ln\varphi$, since at low enough pressure every gas is perfect and the integral is anchored there. For the van der Waals gas (pchem-1.13) $Z-1\to (b - a/RT)\,p/RT$, so $\varphi<1$ at low pressure when $T$ is below the Boyle temperature $a/Rb$ and above 1 when it is higher.`,
      caption: String.raw`Pick a gas and a temperature. Left: the Gibbs energy relative to 1 bar from $\int V\,\mathrm{d}p$ along the van der Waals gas branch (blue), against the perfect gas $RT\ln p$ (dashed); the red dashed curve is the perfect-gas formula evaluated at the fugacity, and lies exactly on the blue one. Right: $\varphi=f/p$ against $p$: below 1 where attraction dominates and turning back up as repulsion takes over; for hydrogen at room temperature (far above its Boyle temperature) it is above 1 from the start. Below $T_c$ the curve stops at the vapour pressure from the Maxwell construction. The default is $\mathrm{CO_2}$ just above its critical temperature.`,
      deps: ['pchem-3.12', 'pchem-1.13', 'pchem-1.11'],
      refs: ['Atkins 3E', 'M–S ch. 22'],
      tags: ['fugacity', 'real gas', 'chemical potential'],
      credit: 'Lewis, 1901 (fugacity); Proc. Am. Acad. 37, 49',
      scope: String.raw`van der Waals gas with constants computed from the critical constants (a = 27R²T_c²/64p_c, b = RT_c/8p_c), so quantitative agreement with a particular real gas is only rough (a second-virial-coefficient comparison would be better at low pressure). Pressures run along the single-phase gas branch only.`,
      viz(v) {
        const gas = v.select('gas', Object.keys(VDW).map((k) => ({ value: k, label: k === 'CO2' ? '$\\mathrm{CO_2}$' : k === 'N2' ? '$\\mathrm{N_2}$' : k === 'CH4' ? '$\\mathrm{CH_4}$' : k === 'H2' ? '$\\mathrm{H_2}$' : k })), 'CO2');
        const Ts = v.slider('temperature $T$', 200, 700, 320, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const s1 = v.stage({ x: [1, 800], y: [0, 30], xlog: true, axes: 'box', gutter: true, xlabel: '$p$ / bar', ylabel: '$G_m(p)-G_m(1\\ \\mathrm{bar})$ / kJ mol⁻¹', height: 340, title: 'Gibbs energy of the gas' });
        const s2 = v.stage({ x: [0, 800], y: [0, 2], axes: 'box', gutter: true, xlabel: '$p$ / bar', ylabel: '$\\varphi = f/p$', height: 340, title: 'fugacity coefficient' });
        let info = {};
        v.render(() => {
          const g = VDW[gas.value], T = Math.min(Ts.value, 1e4);
          const fc = fugacityCurve(g, T, 800);
          if (fc.pend < 1.5) { s1.corner('vapour pressure below 1.5 bar: liquid at 1 bar', 'tl', { color: 'red', plate: true }); info = { phi: 1, p50: 1, pend: fc.pend, G: 0, Gid: 0, direct: 0 }; return; }
          const RT = R * T;
          const at = (p) => { const nn = fc.p.length - 1, x = p / fc.pend * nn, i = Math.min(nn - 1, Math.floor(x)), u = x - i; return (1 - u) * fc.lnphi[i] + u * fc.lnphi[i + 1]; };
          const l1 = at(1), pend = fc.pend;
          const G = (p) => RT * (Math.log(p) + at(p) - (Math.log(1) + l1)) / 1000;
          const Gid = (p) => RT * Math.log(p) / 1000;
          // direct ∫V dp, Simpson on 400 points
          const direct = (p) => { const n = 600, u0 = 0, u1 = Math.log(p), h = (u1 - u0) / n; let s = 0; for (let i = 0; i <= n; i++) { const pp = Math.exp(u0 + i * h), r = vdwV(g, T, pp), Vg = r[r.length - 1]; s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * Vg * pp; } return s * h / 3 * 100 / 1000; };   // ∫V dp = ∫V p d(ln p), Simpson in ln p
          const xmax = Math.max(10, pend * 1.25);
          s1.setView([1, xmax], [Math.min(0, G(pend)) - 1, Math.max(Gid(xmax), G(pend), 1) * 1.05]);
          s1.fn(Gid, { color: 'muted', width: 2, dash: true, domain: [1, xmax], n: 160 });
          s1.fn(G, { color: 'blue', width: 3, domain: [1, pend], n: 160 });
          const ff = (p) => RT * Math.log(p * Math.exp(at(p)) / 1) / 1000 - RT * Math.log(1 * Math.exp(l1)) / 1000;
          s1.fn(ff, { color: 'red', width: 1.5, dash: [4, 4], domain: [1, pend], n: 80 });
          if (pend < 799) { s1.vline(pend, { color: 'orange', dash: true }); s1.text('vapour pressure', pend, 1, { align: 'right', dx: -6, dy: -10, size: 11, color: 'orange' }); }
          // φ
          const ps = fc.p.slice(1), phis = fc.lnphi.slice(1).map(Math.exp);
          const mx = Math.max(1.3, ...phis) * 1.1;
          s2.setView([0, Math.max(10, pend * 1.15)], [0, Math.min(mx, 3)]); s2.hline(1, { color: 'muted', dash: true });
          s2.path(ps.map((p, i) => [p, phis[i]]), { color: 'green', width: 3 });
          if (pend < 799) { s2.vline(pend, { color: 'orange', dash: true }); }
          info = { phi: Math.exp(at(Math.min(pend, 50))), p50: Math.min(pend, 50), pend, G: G(pend), Gid: Gid(pend), direct: direct(pend), TB: g.a / (RL * g.b) };
        });
        v.legend([['blue', 'real gas, $\\int V\\,\\mathrm{d}p$'], ['muted', 'perfect gas', { dash: true }], ['red', 'perfect-gas formula at $f$', { dash: true }], ['green', '$\\varphi=f/p$']]);
        v.readout(() => `at the end of the gas branch ($p=${v.fix(info.pend, 1)}$ bar): $G-G(1\\,\\mathrm{bar})$ = ${v.fix(info.G, 3)} kJ/mol from $RT\\ln(f/f_1)$ and ${v.fix(info.direct, 3)} kJ/mol from direct integration of $V\\,\\mathrm{d}p$; perfect gas ${v.fix(info.Gid, 3)} kJ/mol\n$\\varphi(${v.fix(info.p50, 0)}\\ \\text{bar})=${v.fix(info.phi, 3)}$; Boyle temperature of this van der Waals gas $a/Rb=${v.fix(info.TB, 0)}$ K`);
      },
    },
    {
      num: '3.15', kind: 'Theorem', name: 'Thermodynamic equation of state and internal pressure',
      statement: String.raw`For any closed one-component system, the dependence of internal energy on volume at constant temperature (the internal pressure) is fixed by the equation of state:
$$\pi_T \equiv \Big(\frac{\partial U}{\partial V}\Big)_T = T\Big(\frac{\partial p}{\partial T}\Big)_V - p.$$
It vanishes for a perfect gas and equals $a/V_m^2$ for a van der Waals gas. Consequently a gas with $\pi_T>0$ cools when it expands freely into vacuum (no heat, no work, $U$ constant): $\Delta T \approx -\dfrac{\pi_T}{C_V}\,\Delta V$ for a small expansion, and for van der Waals gas exactly $\Delta T = -\dfrac{a}{C_V}\Big(\dfrac1{V_1}-\dfrac1{V_2}\Big)$ if $C_V$ is constant.`,
      idea: String.raw`Start from $\mathrm{d}U = T\,\mathrm{d}S - p\,\mathrm{d}V$ (pchem-3.12), divide by $\mathrm{d}V$ at constant $T$ and replace $(\partial S/\partial V)_T$ by the Maxwell relation $(\partial p/\partial T)_V$. The result converts an unmeasurable derivative into one from the equation of state, and it proves for the perfect gas $p = nRT/V$ that $U$ is independent of volume, which Joule's experiments could only bound. For the van der Waals gas the attractive term makes $\pi_T=a/V_m^2>0$: pulling the molecules apart costs energy, taken from kinetic energy.`,
      caption: String.raw`Left: $\pi_T$ computed from the van der Waals pressure by a numerical derivative (solid) against $a/V_m^2$ (dashed); the perfect gas gives zero. Right: a gas expands freely from a small chamber into a larger one when you press play. Its temperature falls for the real gas and stays constant for the perfect gas; the particles are illustrative, while the temperature change is computed from the formula above.`,
      deps: ['pchem-3.12'],
      refs: ["Tong §4.4.2; direct fundamental-equation derivation"],
      tags: ['internal pressure', 'equation of state', 'Joule expansion'],
      credit: 'Thermodynamic internal-pressure identity',
      scope: String.raw`Closed systems of one component; the temperature change uses $C_V$ constant and the van der Waals equation, with constants computed from critical constants (CO₂, N₂, Ar) and $C_V$ at 298 K from the chapter-2 $C_p$ table (Ar: $\tfrac32R$). The expansion is adiabatic into vacuum, and the animation shows the final temperature approached smoothly, not the transient.`,
      viz(v) {
        const gas = v.select('gas', [{ value: 'CO2', label: '$\\mathrm{CO_2}$' }, { value: 'N2', label: '$\\mathrm{N_2}$' }, { value: 'Ar', label: 'Ar' }], 'CO2');
        const T1 = v.slider('initial temperature $T_1$', 200, 500, 300, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const V1 = v.slider('initial volume $V_1$', 0.07, 1.5, 0.5, { step: 0.005, fmt: (x) => `${x.toFixed(3)} L/mol` });
        const fac = v.slider('expansion factor $V_2/V_1$', 1.5, 20, 8, { step: 0.5 });
        const mode = v.select('gas model', [{ value: 'real', label: 'van der Waals' }, { value: 'ideal', label: 'perfect' }], 'real');
        const sa = v.stage({ x: [0.07, 2], y: [-1, 1], axes: 'box', gutter: true, xlabel: '$V_m$ / (L mol⁻¹)', ylabel: '$\\pi_T$ / bar', height: 330, title: 'internal pressure $T(\\partial p/\\partial T)_V-p$', xlog: true });
        const sb = v.stage({ x: [0, 2.2], y: [0, 1.1], axes: false, equal: true, height: 330, title: 'free expansion into vacuum' });
        const sc = v.stage({ x: [1, 20], y: [-30, 5], axes: 'box', gutter: true, xlabel: '$V_2/V_1$', ylabel: '$T-T_1$ / K', height: 330, title: 'temperature after expansion' });
        const rng = v.rng(3);
        const pts = Array.from({ length: 70 }, () => [rng(), rng(), rng() * 6.28]);
        const info = () => { const g = GASES[gas.value], cv = CVM[gas.value]; return { g, cv }; };
        const dT = (g, cv, V1_, r) => -g.a * 100 / cv * (1 / V1_ - 1 / (V1_ * r));        // a in L² bar/mol² → ×100 J·L/mol²
        let xi = 1;
        v.animate((t) => {
          const { g, cv } = info(), real = mode.value === 'real';
          xi = Math.min(1, Math.max(0, (t - 0.6) / 2.2)); xi = xi * xi * (3 - 2 * xi);
          // π_T by finite differences of the van der Waals pressure (bar)
          const T = T1.value, pT = (V) => { const h = 1e-3 * T; return T * (vdwP(g, T + h, V) - vdwP(g, T - h, V)) / (2 * h) - vdwP(g, T, V); };
          sa.setView([0.07, 2], [-0.1 * g.a / 0.07 ** 2, 1.1 * g.a / 0.07 ** 2]);
          sa.fn((V) => g.a / (V * V), { color: 'muted', width: 2, dash: true, domain: [0.07, 2], n: 160 });
          sa.fn(pT, { color: 'blue', width: 3, domain: [0.07, 2], n: 160 });
          sa.hline(0, { color: 'red', width: 2.5 }); sa.text('perfect gas: 0', 1.9, 0, { align: 'right', dy: -10, size: 11, color: 'red' });
          sa.vline(V1.value, { color: 'gold', dash: true }); sa.dot(V1.value, g.a / V1.value ** 2, { r: 6, color: 'gold' });
          // box
          sb.rect(0, 0, 1, 1, { color: 'ink', width: 2 }); sb.rect(1, 0, 2.2, 1, { color: 'ink', width: 2, fill: 'accent', fillAlpha: 0.04 });
          const Tcur = T1.value + (real ? dT(g, cv, V1.value, 1 + (fac.value - 1) * xi) : 0);
          const speed = Math.sqrt(Tcur / 300);
          pts.forEach(([a, b, ph], i) => { const spread = 1 + 1.2 * xi * (i % 2 ? 1 : 0.55 + 0.45 * ((i * 7) % 5) / 4), x = (a * spread) % (1 + xi * 1.2); const wob = 0.02 * speed * Math.sin(t * 6 * speed + ph); sb.dot(Math.min(2.15, 0.04 + x * 0.96) + wob, 0.04 + 0.92 * b + wob, { r: 4, color: real ? 'blue' : 'teal' }); });
          sb.line(1, 0, 1, 1, { color: 'red', width: 3, alpha: 1 - xi });
          sb.corner(`$T=${v.fix(Tcur, 1)}$ K`, 'tr', { plate: true });
          // T(V2/V1)
          const rr = (r) => (real ? dT(g, cv, V1.value, r) : 0);
          sc.setView([1, 20], [Math.min(-1, dT(g, cv, V1.value, 20) * 1.15), 3]);
          sc.hline(0, { color: 'muted' });
          sc.fn((r) => dT(g, cv, V1.value, r), { color: 'blue', width: 2.5, domain: [1, 20], n: 100 });
          sc.hline(0, { color: 'red', width: 2.5 });
          const rcur = 1 + (fac.value - 1) * xi;
          sc.dot(rcur, rr(rcur), { r: 6, color: 'gold' }); sc.vline(fac.value, { color: 'muted', dash: true });
        }, { period: 4.5, still: 3.6 });
        v.legend([['blue', 'van der Waals'], ['red', 'perfect gas'], ['muted', '$a/V_m^2$', { dash: true }]]);
        v.readout(() => {
          const { g, cv } = info(), V = V1.value, pi = (g.a / V ** 2), d = dT(g, cv, V, fac.value);
          return `${gas.value === 'CO2' ? '$\\mathrm{CO_2}$' : gas.value === 'N2' ? '$\\mathrm{N_2}$' : 'Ar'} at $V_1=${v.fix(V, 3)}$ L/mol: $\\pi_T=a/V_1^2=${v.fix(pi, 1)}$ bar (numerical derivative agrees, see the solid curve); $C_V=${v.fix(cv, 1)}$ J/(K mol)\nfree expansion to $V_2=${v.fix(fac.value, 1)}V_1$: van der Waals $\\Delta T=-\\tfrac{a}{C_V}(1/V_1-1/V_2)=${v.fix(d, 2)}$ K; perfect gas $\\Delta T=0$`;
        });
      },
    },
  ],
};
