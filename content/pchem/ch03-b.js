// Physical Chemistry — Chapter 3: Entropy, the second and third laws, and free energy (part b: 3.9–3.15)
import { R, RL, VDW, vdwP, vdwV, cubicRoots, cpOf } from './ch03.shared.js';

import { RG, entropyBalance, zeros, CELL, fuelCell, maxwellReference, freeExpansion } from './pchem-source-audit-potentials.shared.js';

import { ARGON, argonEntropy, argonCp, reactionThermo } from './pchem-source-audit-calorimetry.shared.js';

// ---- 3.9: argon -------------------------------------------------------------------------------------------
// Reference transition values: Air Liquide at nominal 1.013 bar; CpL and theta are model choices.
const AR = ARGON;
const argonParts = argonEntropy;

// ---- 3.12–3.15: van der Waals gas -----------------------------------------------------------------------------
const CVM = { Ar: 1.5 * R, N2: cpOf('N2', 298.15) - R, CO2: cpOf('CO2', 298.15) - R };
const GASES = { CO2: VDW.CO2, N2: VDW.N2, Ar: VDW.Ar };
const potentials = (g, cv) => ({
  S: (T, V) => cv * Math.log(T / 298.15) + RG * Math.log(V - g.b),                      // J/(K mol), V in L/mol; additive constant dropped
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
const RXN = {
  haber: { name: 'N₂ + 3 H₂ → 2 NH₃', tex: '\\mathrm{N_2}+3\\mathrm{H_2}\\to2\\mathrm{NH_3}', sp: [['N2', -1], ['H2', -3], ['NH3', 2]] },
  wgs: { name: 'CO + H₂O → CO₂ + H₂', tex: '\\mathrm{CO}+\\mathrm{H_2O(g)}\\to\\mathrm{CO_2}+\\mathrm{H_2}', sp: [['CO', -1], ['H2O', -1], ['CO2', 1], ['H2', 1]] },
  coox: { name: '2 CO + O₂ → 2 CO₂', tex: '2\\mathrm{CO}+\\mathrm{O_2}\\to2\\mathrm{CO_2}', sp: [['CO', -2], ['O2', -1], ['CO2', 2]] },
};
const rxnH=(r,T)=>reactionThermo(r.sp,T).H;
const rxnG=(r,T)=>reactionThermo(r.sp,T).G;

export default {
  collection: 'pchem',
  chapter: 3,
  items: [
    {
      num: '3.9', kind: 'Method', name: 'Absolute entropies from heat capacities',
      statement: String.raw`With the third law fixing $S(0)=0$ for a perfect crystal with a unique ground state, for $T>T_b$ after melting and vaporization on a reversible constant-pressure path, heat-capacity data plus a justified low-temperature extrapolation give:
$$S(T) = \int_0^{T_m}\frac{C_p^{\text{solid}}}{T}\mathrm{d}T + \frac{\Delta_{\text{fus}}H}{T_m} + \int_{T_m}^{T_b}\frac{C_p^{\text{liq}}}{T}\mathrm{d}T + \frac{\Delta_{\text{vap}}H}{T_b} + \int_{T_b}^{T}\frac{C_p^{\text{gas}}}{T}\mathrm{d}T,$$
For a lower target temperature, stop at the appropriate phase. A Debye $C_p\approx aT^3$ extrapolation applies when three-dimensional acoustic phonons dominate at low temperature; it is not a universal form for every substance. A nonzero residual entropy $S(0)$ must be added when applicable. Each phase transition at equilibrium adds $\Delta_{\text{trs}}H/T_{\text{trs}}$ (pchem-3.6), and each integral is the area under $C_p/T$, equivalently the area under $C_p$ plotted against $\ln T$.`,
      idea: String.raw`Entropy is a state function (pchem-3.2), so any reversible path from 0 K will do, and heating at constant pressure supplies $\mathrm{d}q_{\text{rev}} = C_p\,\mathrm{d}T$ (pchem-2.5). The third law (pchem-3.8) removes the integration constant; the Debye extrapolation covers the range where calorimeters cannot reach, and is accurate because lattice vibrations are phonons of low frequency there. Calorimetry determines entropy differences; a residual integration constant must be supplied separately rather than inferred from the heat-capacity integral.`,
      caption: String.raw`A model of argon, built from its transition data. Left: $C_p$ against $\ln T$; the shaded areas are the entropy contributions (solid from a Debye model, liquid, gas). Right: the running entropy with the jumps at melting and boiling, compared with the independently tabulated $S^\circ$, which the model need not reach. Slide the Debye temperature and the extra solid heat capacity to see how much each piece matters, and where the Debye-only model falls short.`,
      deps: ['pchem-3.8', 'pchem-2.5'],
      refs: ['Arovas §2.7.7 Eq. (2.139); §5.6.3 Eqs. (5.118)–(5.123)', 'Air Liquide Argon: phase-change properties', 'NIST WebBook Ar CODATA entropy'],
      tags: ['absolute entropy', 'Debye law', 'calorimetry'],
      credit: 'Calorimetric entropy and Debye model: Arovas §§2.7.7, 5.6.3',
      scope: String.raw`Illustrative argon reconstruction, not original calorimetry. Air Liquide gives $T_m=83.78$ K, $T_b=87.30$ K, latent heats 29.588 and 161.14 kJ/kg and mass 39.948 g/mol at nominal 1.013 bar; these are converted explicitly to molar units. NIST/CODATA comparison entropy is 154.846±0.003 J/(mol K) at 298.15 K, 1 bar. The adjustable $\theta_D$ (default 92 K), constant liquid $C_p=44.6$ J/(mol K), and extra solid heat capacity are chosen model parameters, not claimed measurements or a fitted argon equation of state. The extra profile is $e(T/T_m)^7$, with entropy $e(T/T_m)^7/7$, so it preserves the leading low-temperature $T^3$ term. Ideal-gas pressure correction $R\ln(1.013)$ is applied only to a gaseous endpoint. Model mismatch is not assigned an unverified experimental uncertainty or unique physical cause.`,
      verify: false,
      viz(v) {
        const th = v.slider('Debye temperature $\\theta_D$', 60, 130, 92, { step: 1, fmt: (x) => `${x.toFixed(0)} K` });
        const ex = v.slider('illustrative extra solid $C_p$ at $T_m$', 0, 15, 0, { step: 0.1, fmt: (x) => `${x.toFixed(1)} J/(K mol)` });
        const te = v.slider('upper temperature', 50, 298.15, 298.15, { step: 0.05, fmt: (x) => `${x.toFixed(2)} K` });
        const s1 = v.stage({ x: [1, 320], y: [0, 50], xlog: true, axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$C_p$ / (J K⁻¹ mol⁻¹)', height: 340, title: 'area under $C_p$ against $\\ln T$ = entropy' });
        const s2 = v.stage({ x: [0, 310], y: [0, 170], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$S(T)$ / (J K⁻¹ mol⁻¹)', height: 340, title: 'running entropy of argon' });
        const cpOfT=(T,theta,e)=>argonCp(theta,e,T);
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
          push(Math.min(AR.Tm,T1));
          pts.unshift([0,0]);
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
              const g = []; for (let T = AR.Tb; T <= T1; T += 1) g.push([T, afterVap + AR.CpG * Math.log(T / AR.Tb)]); g.push([T1, afterVap + AR.CpG * Math.log(T1 / AR.Tb) + R * Math.log(AR.Ppath)]);
              s2.path(g, { color: 'teal', width: 2.5 });
            }
          }
          s2.hline(AR.S298, { color: 'green', dash: true, width: 1.5 }); s2.text('tabulated $S^\\circ$ = 154.85', 8, AR.S298, { align: 'left', dy: -9, size: 11, color: 'green' });
          s2.vline(T1, { color: 'gold', width: 2 }); s2.dot(T1, pAt(T1), { r: 6, color: 'gold' });
        });
        v.legend([['blue', 'solid (Debye model)', { area: true }], ['orange', 'liquid', { area: true }], ['teal', 'gas', { area: true }]]);
        v.readout(() => {
          const p = argonParts(th.value, ex.value, te.value);
          return `up to ${v.fix(te.value, 0)} K: solid $${v.fix(p.sol, 2)}$ + fusion $${v.fix(p.fus, 2)}$ + liquid $${v.fix(p.liq, 2)}$ + vaporization $${v.fix(p.vap, 2)}$ + gas $${v.fix(p.gas, 2)}$ = $${v.fix(p.total, 2)}$ J/(K mol)\n${te.value > 298 ? `tabulated $S^\\circ(298.15\\ \\mathrm{K})=154.85$: the model is ${v.fix(Math.abs(AR.S298 - p.total), 2)} J/(K mol) ${p.total < AR.S298 ? 'short' : 'over'} (illustrative heat capacities and omitted real-fluid effects; no unique cause is inferred)` : 'raise the upper temperature to 298 K to compare with the tabulated value'}`;
        });
      },
    },
    {
      num: '3.10', kind: 'Definition', name: 'Helmholtz and Gibbs energies',
      statement: String.raw`The Helmholtz energy $A = U - TS$ and the Gibbs energy $G = H - TS = U + pV - TS$ are state functions of the system alone. For a closed system exchanging heat with a single bath at fixed $T>0$, with equilibrium endpoints at that temperature, at constant volume with no non-expansion work, $\Delta S_{\text{total}} = \Delta S - \Delta U/T = -\Delta A/T$, and at fixed external pressure matching the endpoints, with only expansion work $\Delta S_{\text{total}} = \Delta S - \Delta H/T = -\Delta G/T$. Hence a spontaneous change has $\Delta A\le 0$ (at constant $T,V$) or $\Delta G\le0$ (at constant $T,p$), and equilibrium is a minimum of the corresponding function.`,
      idea: String.raw`Constant $T$ puts the surroundings in a thermal reservoir, whose entropy change is its heat gain divided by its fixed temperature: $q_{\text{surr}} = -q_{\text{sys}}$, which equals $-\Delta U$ at constant volume and $-\Delta H$ at constant pressure (pchem-2.3, pchem-2.5). Then the second law (pchem-3.4) $\Delta S+\Delta S_{\text{surr}}\ge0$ becomes a statement about the system alone, after multiplying by $-T$. The two functions are Legendre transforms of $U$ and $H$ with respect to $S$ (mech-12.1 states the transform), which is why $T$ is their natural variable.`,
      caption: String.raw`Choose a constraint and hypothetical process parameters: $\Delta H$ is constant and $\Delta S_{\rm ref}$ is its entropy difference at 298.15 K. At fixed pressure the model keeps $\Delta S=\Delta S_{\rm ref}$; at fixed volume it uses the consistent ideal-gas correction $\Delta U=\Delta H-\Delta nRT$ and $\Delta S=\Delta S_{\rm ref}-\Delta nR\ln[T/(298.15\,\mathrm K)]$. The zero crossings are computed for the selected constraint; the direction of spontaneity depends on the parameters. Bars split system and reservoir entropy and verify $-\Delta G/T$ or $-\Delta A/T$. These are separate illustrative families with the specified reference entropy, not a measured ice model.`,
      deps: ['pchem-3.4', 'mech-12.1', 'thermo-3.9'],
      refs: ['Arovas §§2.8.2–2.8.4, Eqs. (2.144)–(2.156)'],
      tags: ['Gibbs energy', 'Helmholtz energy', 'spontaneity'],
      credit: 'Helmholtz and Gibbs potentials; proof: Arovas §2.8',
      scope: String.raw`No electrical or other non-expansion work, one heat reservoir, and pressure-volume work against the stated external pressure. Equilibrium minima concern allowed variations under fixed constraints; metastable local minima need not be the global equilibrium. Parameters are illustrative. The constant-pressure family has $\Delta C_p=0$; the constant-volume family has $\Delta C_V=-\Delta nR$, so its entropy correction follows by integration. Reference entropy differences for the two constraints are independently set to the chosen value at 298.15 K.`,
      verify: false,
      viz(v) {
        const cons = v.select('constraint', [{ value: 'p', label: 'constant $T, p$ → $G$' }, { value: 'V', label: 'constant $T, V$ → $A$' }], 'p');
        const dH = v.slider('$\\Delta H$', -80, 80, 6.01, { step: 0.01, fmt: (x) => `${x.toFixed(2)} kJ/mol` });
        const dS = v.slider('$\\Delta S_{\\rm ref}$ at 298.15 K', -200, 200, 22, { step: 0.5, fmt: (x) => `${x.toFixed(1)} J/(K mol)` });
        const dn = v.slider('$\\Delta n_{\\mathrm{gas}}$', -3, 3, 0, { int: true });
        const s1 = v.stage({ x: [100, 600], y: [-1, 1], axes: 'box', gutter: true, xlabel: '$T$ / K', ylabel: '$\\Delta S_{\\mathrm{total}}$ / (J K⁻¹ mol⁻¹)', height: 330, title: 'total entropy change against temperature' });
        const s2 = v.stage({ x: [0.3, 4.7], y: [-1, 1], axes: 'box', gutter: true, ylabel: 'entropy change / (J K⁻¹ mol⁻¹)', height: 330, title: 'system + surroundings', xticks: [[1, 'system'], [2, 'surroundings'], [3, 'total'], [4, '−ΔG/T']] });
        const hT = s1.handle(298.15, 0, { color: 'gold', label: 'T', constrain: (x) => [Math.min(600, Math.max(100, x)), 0] });
        const calc=T=>entropyBalance(T,dH.value*1000,dS.value,dn.value,cons.value);
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
          for(const Tst of zeros(T=>calc(T).Stot,100,600,cons.value==='V'&&dn.value!==0?[dH.value*1000/(dn.value*RG)]:[])){s1.dot(Tst,0,{r:5,color:'ink'});s1.text('$T^*$ = '+v.fix(Tst,0)+' K',Tst,0,{dy:18,size:12});}
          s1.corner(c.Stot===0?'neutral: zero total entropy change':c.Stot>0?'spontaneous':'not spontaneous', 'tr', { color: c.Stot >= 0 ? 'green' : 'red', plate: true });
          const vals = [c.Stot - c.Ssur, c.Ssur, c.Stot, -c.dF / hT.x], cols = ['accent', 'orange', c.Stot >= 0 ? 'green' : 'red', 'purple'];
          const m = Math.max(5, ...vals.map(Math.abs)) * 1.25;
          s2.setView([0.3, 4.7], [-m, m]); s2.hline(0, { color: 'muted' });
          vals.forEach((h, i) => { s2.rect(i + 0.65, 0, i + 1.35, h, { fill: cols[i], fillAlpha: 0.65, color: cols[i] }); s2.text(v.fix(h, 2), i + 1, h, { dy: h >= 0 ? -10 : 13, size: 12 }); });
          s2.setTicks([[1, 'system'], [2, 'surroundings'], [3, 'total'], [4, `−Δ${lab}/T`]], null);
        });
        v.readout(() => {
          const c = calc(hT.x), lab = cons.value === 'p' ? 'G' : 'A';
          return `$T=${v.fix(hT.x, 1)}$ K: $q_{\\text{sys}}=${v.fix(c.q / 1000, 2)}$ kJ/mol, $\\Delta S_{\\text{sys}}=${v.fix(c.deltaS,2)}$, $\\Delta S_{\\text{surr}}=-q/T=${v.fix(c.Ssur, 2)}$, $\\Delta S_{\\text{total}}=${v.fix(c.Stot, 2)}$ J/(K mol)\n$\\Delta ${lab} = ${cons.value === 'p' ? '\\Delta H' : '\\Delta U'} - T\\Delta S = ${v.fix(c.dF / 1000, 3)}$ kJ/mol, so $-\\Delta ${lab}/T=${v.fix(-c.dF / hT.x, 2)}$ J/(K mol) $=\\Delta S_{\\text{total}}$`;
        });
      },
    },
    {
      num: '3.11', kind: 'Theorem', name: 'Maximum non-expansion work equals −ΔG',
      statement: String.raw`At constant temperature and pressure, the maximum non-expansion work (electrical, for example) that a system can deliver is $w_{\text{e,max}} = -\Delta G$, attained only in a reversible process; any real process delivers $w_e \le -\Delta G$, and the shortfall, $-\Delta G - w_e$, is dissipated as extra heat. For a cell that transfers $n$ moles of electrons per mole of reaction at reversible voltage $E$ this is $\Delta G = -nFE$.`,
      idea: String.raw`Combining the first law at constant $p$ ($\Delta H=q-w_e$ with $q$ absorbed by the system and $w_e$ delivered to the surroundings) with the second law ($q\le T\Delta S$, pchem-3.4) gives $w_e\le T\Delta S-\Delta H=-\Delta G$ for work delivered by the system; equality for reversible heat exchange. A fuel cell run slowly converts the free-energy part of the reaction enthalpy to work, and the rest, $-T\Delta S$, must leave as heat; run faster, overpotentials turn more of the free energy into heat and the voltage sags below its reversible value.`,
      caption: String.raw`A hydrogen–oxygen fuel cell, $\mathrm{H_2}+\tfrac12\mathrm{O_2}\to\mathrm{H_2O(l)}$. Drag the current density along the polarization curve (illustrative model, not a measured curve). The stacked bar splits the reaction enthalpy, 285.8 kJ per mole of $\mathrm{H_2}$, into electrical work, the unavoidable reversible heat $-T\Delta S$ and the dissipated extra heat. At vanishing current the work reaches $-\Delta G$.`,
      deps: ['pchem-3.10'],
      refs: ['Arovas §2.8.4, Eq. (2.154)', 'NIST–JANAF H-063, 298.15 K row'],
      tags: ['Gibbs energy', 'maximum work', 'fuel cell'],
      credit: 'Maximum non-expansion work: Arovas §2.8.4; reference water thermochemistry: NIST–JANAF',
      scope: String.raw`Constant $T$ and $p$, reaction to liquid water at 298.15 K with $\Delta_rH^\circ=-285.83$ kJ/mol and $\Delta_rG^\circ=-237.141$ kJ/mol ($E^\circ=1.229$ V; thermoneutral voltage $-\Delta H/2F=1.481$ V). The polarization curve $V=E^\circ - b\ln(1+j/j_0) - r j$ with $b=0.05$ V, $j_0=0.01$ A cm⁻², and a slider resistance $r$ is an illustrative model, not data for any real cell. Standard thermochemistry: NIST–JANAF liquid-water table H-063, 298.15 K, 0.1 MPa. The reversible work/heat ratio refers to this specified reaction and standard states, not a universal fuel-cell efficiency. Kinetic/potential energy changes are neglected.`,
      verify: false,
      viz(v) {
        const Fc = CELL.F, dG = CELL.G, dH = CELL.H, E0 = -dG / (2 * Fc), Eth = -dH / (2 * Fc);
        const rr = v.slider('cell resistance $r$', 0, 0.6, 0.2, { step: 0.01, fmt: (x) => `${x.toFixed(2)} Ω cm²` });
        const Vj = j=>fuelCell(j,rr.value).V;
        const s1 = v.stage({ x: [0, 1.5], y: [0, 1.7], axes: 'box', gutter: true, xlabel: 'current density $j$ / (A cm⁻²)', ylabel: 'cell voltage / V', height: 340, title: 'polarization curve (illustrative model)' });
        const s2 = v.stage({ x: [0, 3], y: [0, 300], axes: 'box', gutter: true, ylabel: 'energy per mole of H₂ / kJ', height: 340, title: 'where the reaction enthalpy goes', xticks: [[0.8, 'reversible'], [2.2, 'at this current']] });
        const h = s1.handle(0.5, 0.8, { color: 'gold', label: '', constrain: (x) => { const j = Math.min(1.5, Math.max(0, x)); return [j, Vj(j)]; } });
        v.render(() => {
          s1.fn(Vj, { color: 'accent', width: 3, domain: [0, 1.5], n: 300 });
          s1.hline(E0, { color: 'green', dash: true }); s1.text('reversible voltage $E^\\circ=-\\Delta G/2F$ = ' + v.fix(E0, 3) + ' V', 1.48, E0, { align: 'right', dy: -10, size: 11, color: 'green' });
          s1.hline(Eth, { color: 'muted', dash: true }); s1.text('thermoneutral $-\\Delta H/2F$ = ' + v.fix(Eth, 3) + ' V', 1.48, Eth, { align: 'right', dy: -10, size: 11, color: 'muted' });
          const j = h.x, V = Vj(j); h.set(j, V);
          s1.between(() => 0, (x) => Vj(x), 0, j, { fill: 'blue', fillAlpha: 0.1 });
          const bar = (x0, wk) => { const th = -dH / 1000, rev = (dG - dH) / 1000; let y = 0; [[wk, 'blue'], [rev, 'orange'], [Math.max(0, th - wk - rev), 'red']].forEach(([hh, c]) => { s2.rect(x0 - 0.5, y, x0 + 0.5, y + hh, { fill: c, fillAlpha: 0.65, color: c }); if (hh > 12) s2.text(v.fix(hh, 1), x0, y + hh / 2, { size: 12 }); y += hh; }); };
          bar(0.8, -dG / 1000); bar(2.2, 2 * Fc * V / 1000);
          s2.hline(-dH / 1000, { color: 'muted', dash: true }); s2.text('$-\\Delta H$ = 285.8', 2.95, -dH / 1000, { align: 'right', dy: -9, size: 11, color: 'muted' });
        });
        v.legend([['blue', 'electrical work $w_e$', { area: true }], ['orange', 'reversible heat $-T\\Delta S$', { area: true }], ['red', 'dissipated heat', { area: true }]]);
        v.readout(() => {
          const j = h.x, V = Vj(j), we = 2 * Fc * V / 1000, lost = -dG / 1000 - we;
          return `$j=${v.fix(j, 3)}$ A/cm²: $V=${v.fix(V, 3)}$ V, work $w_e=2FV=${v.fix(we, 1)}$ kJ/mol against $-\\Delta G=237.1$ kJ/mol, so ${v.fix(lost, 1)} kJ/mol is dissipated ($w_e\\le-\\Delta G$ ✓)\nentropy produced $=${v.fix(lost * 1000 / 298.15, 1)}$ J/(K mol); efficiency $w_e/(-\\Delta H)=${v.fix(we / 285.83, 3)}$ (ceiling $\\Delta G/\\Delta H=${v.fix((-dG)/(-dH), 3)}$)`;
        });
      },
    },
    {
      num: '3.12', kind: 'Theorem', name: 'Fundamental equation and Maxwell relations',
      statement: String.raw`For equilibrium states of a simple compressible system of fixed amount and composition, with twice continuously differentiable potentials on a single phase branch, the combined first and second laws give the fundamental equation $\mathrm{d}U = T\,\mathrm{d}S - p\,\mathrm{d}V$, and its Legendre transforms
$$\mathrm{d}H = T\,\mathrm{d}S + V\,\mathrm{d}p,\qquad \mathrm{d}A = -S\,\mathrm{d}T - p\,\mathrm{d}V,\qquad \mathrm{d}G = -S\,\mathrm{d}T + V\,\mathrm{d}p.$$
Where each natural-variable map is nonsingular, equality of mixed second derivatives yields the four Maxwell relations
$$\Big(\tfrac{\partial T}{\partial V}\Big)_S = -\Big(\tfrac{\partial p}{\partial S}\Big)_V,\quad \Big(\tfrac{\partial T}{\partial p}\Big)_S = \Big(\tfrac{\partial V}{\partial S}\Big)_p,\quad \Big(\tfrac{\partial S}{\partial V}\Big)_T = \Big(\tfrac{\partial p}{\partial T}\Big)_V,\quad \Big(\tfrac{\partial S}{\partial p}\Big)_T = -\Big(\tfrac{\partial V}{\partial T}\Big)_p.$$`,
      idea: String.raw`Write $\mathrm{d}U = T\,\mathrm{d}S - p\,\mathrm{d}V$ (pchem-3.2 for the heat term, pchem-2.1 for the work term). Each potential is a function of a natural pair of variables, with $T,p,V,S$ as its first partial derivatives; since mixed second partials of a smooth function commute (pma-9.41), differentiating each first derivative with respect to the other variable gives the relations. The point of the right-hand sides is that they are measurable ($p,V,T$ from an equation of state) while the left-hand sides involve $S$.`,
      caption: String.raw`Choose a potential with the control to highlight it in the square (rows: $S$ or $T$; columns: $V$ or $p$) to see its relation, and drag the state point on the $(T,V)$ plane of a van der Waals gas. The two bars give the two sides of the relation, each computed by finite differences of the van der Waals pressure and entropy through the Jacobian ratio $(\partial f/\partial g)_h$; they agree to rounding error. Switching to the ideal gas changes the numbers but not the agreement.`,
      deps: ['pchem-3.10', 'pma-9.41', 'thermo-3.12'],
      refs: ['Arovas §§2.8–2.9, Eqs. (2.164), (2.169), (2.174), (2.179)'],
      tags: ['Maxwell relations', 'fundamental equation', 'state functions'],
      credit: 'Maxwell relations; full derivation: Arovas §2.9',
      scope: String.raw`Closed system, one component, expansion work only. The numerical test uses a van der Waals gas with constants computed from critical constants and a temperature-independent $C_V$; the relations hold for thermodynamically consistent smooth single-phase potentials, so the test checks the arithmetic, not the physics. Smooth analytic continuation is distinguished from mechanically stable positive-pressure branches; no equilibrium coexistence construction is included. Natural-variable singularities are reported instead of plotting divergent bars (relative Jacobian cancellation guard 10⁻⁶). Constant positive C_V and a,b are illustrative parameter choices, not measured equations of state.`,
      verify: false,
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
          const g=gas.value==='ideal'?{a:0,b:0}:GASES[gas.value],cv=gas.value==='ideal'?1.5*R:CVM[gas.value],ref=maxwellReference(g,cv,hs.x,hs.y,pot.value);
          if(ref.singular){sb.setView([0,3],[-1,1]);sb.corner('natural variables singular here','tl',{color:'red'});return;}
          const [l, r] = sides(hs.x, hs.y), m = Math.max(1e-9, Math.abs(l), Math.abs(r)) * 1.35;
          sb.setView([0, 3], [-m, m]); sb.hline(0, { color: 'muted' });
          [[0.8, l, 'accent'], [2.2, r, 'green']].forEach(([x, h, c]) => { sb.rect(x - 0.5, 0, x + 0.5, h, { fill: c, fillAlpha: 0.6, color: c }); sb.text('$' + v.sci(h, 2) + '$', x, h, { dy: h >= 0 ? -12 : 14, size: 12, align:'center' }); });
          sb.setLabels(undefined, REL[pot.value].unit);
        });
        v.legend([['orange', 'isentropes (S = const)'], ['blue', 'isobars (p / bar)']]);
        v.readout(() => {
          const g=gas.value==='ideal'?{a:0,b:0}:GASES[gas.value],cv=gas.value==='ideal'?1.5*R:CVM[gas.value],ref=maxwellReference(g,cv,hs.x,hs.y,pot.value);
          if(ref.singular)return 'Natural-variable Jacobian is singular or numerically ill-conditioned (relative cancellation ≤10⁻⁶); the selected partial derivatives cannot be plotted as finite values.';
          const [l, r] = sides(hs.x, hs.y);
          return `$${REL[pot.value].tex}$\nat $T=${v.fix(hs.x, 0)}$ K, $V=${v.fix(hs.y, 3)}$ L/mol: left $=${v.sci(l, 6)}$, right $=${v.sci(r, 6)}$ ${REL[pot.value].unit}; relative difference $${v.sci(Math.abs(l - r) / Math.max(1e-30, Math.abs(l)), 2)}$ · ${ref.stable?'positive-pressure mechanically stable branch (local test only)':'formal analytic branch: mechanically unstable or nonpositive pressure; not equilibrium gas'}`;
        });
      },
    },
    {
      num: '3.13', kind: 'Theorem', name: 'Gibbs–Helmholtz equation',
      statement: String.raw`At constant pressure the temperature dependence of the Gibbs energy is
$$\Big(\frac{\partial (G/T)}{\partial T}\Big)_p = -\frac{H}{T^2},\qquad\text{equivalently}\qquad \Big(\frac{\partial (G/T)}{\partial (1/T)}\Big)_p = H,$$
and for a change of state or reaction $\Big(\partial(\Delta G/T)/\partial(1/T)\Big)_p=\Delta H$. If $\Delta H$ is nearly constant between $T_1$ and $T_2$, then $\Delta G(T_2)/T_2 \approx \Delta G(T_1)/T_1 + \Delta H\,(1/T_2 - 1/T_1)$.`,
      idea: String.raw`From $G = H - TS$ and $(\partial G/\partial T)_p = -S$ (pchem-3.12, the $\mathrm{d}G$ relation), $(\partial (G/T)/\partial T)_p = \frac1T(\partial G/\partial T)_p - \frac{G}{T^2} = -\frac{S}{T} - \frac{H-TS}{T^2} = -\frac{H}{T^2}$. The substitution $u = 1/T$ turns this into a slope, so a plot of $\Delta G/T$ against $1/T$ has slope $\Delta H$: a straight line only if $\Delta H$ is constant, and a curve of slowly changing slope, set by $\Delta C_p$ (Kirchhoff, pchem-2.11), otherwise.`,
      caption: String.raw`Choose a reaction. The curve is $\Delta G^\circ/T$ against $1000/T$, built from one consistent set of NIST–JANAF formation enthalpies, standard entropies and piecewise-linear $C_p(T)$ values. Drag the point along the curve: the tangent's slope is $\Delta H^\circ(T)$ in kJ/mol. Set a second temperature $T_2$ with the slider and compare the constant-$\Delta H$ extrapolation (open circle) with the temperature-dependent model (filled); the right panel shows the error across the temperature range.`,
      deps: ['pchem-3.12'],
      refs: ['Arovas §2.8.4, Eqs. (2.153), (2.156)', 'NIST–JANAF N-023, H-050, H-083, C-093, C-095, H-064, O-029'],
      tags: ['Gibbs–Helmholtz', 'temperature dependence', 'extrapolation'],
      credit: 'Gibbs–Helmholtz identity; thermodynamic derivation from Arovas §2.8.4',
      scope: String.raw`Ideal-gas standard-state reaction quantities at 1 bar, not equilibrium mixture yields. All seven species use their actual official JANAF 298.15 K rows and tabulated heat capacities through 1000 K, archived with hashes in the source report. Linear interpolation of $C_p$ is analytically integrated for both $H$ and $S$, preserving $dH/dT=C_p=T\,dS/dT$; it is an approximation to the tables, not a claim of exact experimental accuracy. The archival JANAF NH$_3$ formation enthalpy is −45.898 kJ/mol at 298.15 K, distinct from other compilations and from its 300 K value −45.939; no temperatures or data sets are mixed. Plot/control range is 300–1000 K. Curves may represent hypothetical ideal-gas standard states where the stable pure substance would condense.`,
      verify: false,
      viz(v) {
        const rx = v.select('reaction', Object.keys(RXN).map((k) => ({ value: k, label: `$${RXN[k].tex}$` })), 'haber');
        const T2 = v.slider('target temperature $T_2$', 300, 1000, 700, { step: 5, fmt: (x) => `${x.toFixed(0)} K` });
        const s1 = v.stage({ x: [1, 10/3], y: [-400, 100], axes: 'box', gutter: true, xlabel: '$1000\\,\\mathrm{K}/T$', ylabel: '$\\Delta G^\\circ/T$ / (J K⁻¹ mol⁻¹)', height: 340, title: '$\\Delta G/T$ against $1/T$' });
        const s2 = v.stage({ x: [300, 1000], y: [-30, 30], axes: 'box', gutter: true, xlabel: '$T_2$ / K', ylabel: 'error in $\\Delta G(T_2)$ / kJ mol⁻¹', height: 340, title: 'constant-$\\Delta H$ extrapolation minus temperature-dependent model' });
        const f = (x) => rxnG(RXN[rx.value], 1000 / x) / (1000 / x);
        const h = s1.handle(2.2, 0, { color: 'gold', label: '', constrain: (x) => { const xx = Math.min(10/3, Math.max(1, x)); return [xx, f(xx)]; } });
        v.render(() => {
          const r = RXN[rx.value];
          const ys = []; for (let x = 1; x <= 10/3; x += 0.05) ys.push(f(x));
          const xbase=h.x,Tbase=1000/xbase,ybase=f(xbase),slope=rxnH(r,Tbase)/1000;
          ys.push(f(10/3),ybase+slope*(1-xbase),ybase+slope*(10/3-xbase),ybase+slope*(1000/T2.value-xbase));
          const lo=Math.min(0,...ys),hi=Math.max(0,...ys),pad=(hi-lo)*.12+5;
          s1.setView([1, 10/3], [lo - pad, hi + pad]);
          s1.fn(f, { color: 'accent', width: 3, domain: [1, 10/3], n: 200 });
          s1.hline(0, { color: 'muted', dash: true });
          const x1 = h.x, T1 = 1000 / x1, y1 = f(x1); h.set(x1, y1);
          const dH = rxnH(r, T1) / 1000;
          s1.line(1, y1 + dH * (1 - x1), 10/3, y1 + dH * (10/3 - x1), { color: 'orange', width: 1.8 });
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
        v.legend([['accent', 'interpolated-$C_p$ $\\Delta G^\\circ/T$'], ['orange', 'tangent: slope $\\Delta H^\\circ(T_1)$'], ['green', 'temperature-dependent model at $T_2$', { dot: true }]]);
        v.readout(() => {
          const r = RXN[rx.value], x1 = h.x, T1 = 1000 / x1, y1 = f(x1), dH = rxnH(r, T1) / 1000, xx = 1000 / T2.value, pred = (y1 + dH * (xx - x1)) * T2.value / 1000, exact = f(xx) * T2.value / 1000;
          return `at $T_1=${v.fix(T1, 0)}$ K: $\\Delta G^\\circ=${v.fix(y1 * T1 / 1000, 1)}$ kJ/mol, slope $\\Delta H^\\circ(T_1)=${v.fix(dH, 1)}$ kJ/mol (Kirchhoff)\nat $T_2=${v.fix(T2.value, 0)}$ K: Gibbs–Helmholtz with constant $\\Delta H$ gives $\\Delta G=${v.fix(pred, 1)}$ kJ/mol; temperature-dependent model $${v.fix(exact, 1)}$ kJ/mol; error $${v.fix(pred - exact, 2)}$ kJ/mol`;
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
      statement: String.raw`For smooth equilibrium states of a simple compressible closed system of fixed amount and composition, the dependence of internal energy on volume at constant temperature (the internal pressure) is fixed by the equation of state:
$$\pi_T \equiv \Big(\frac{\partial U}{\partial V}\Big)_T = T\Big(\frac{\partial p}{\partial T}\Big)_V - p.$$
It vanishes for a perfect gas and equals $a/V_m^2$ for a van der Waals gas. Consequently a gas with $\pi_T>0$ cools when it expands freely into vacuum (no heat, no work, $U$ constant): $\Delta T \approx -\dfrac{\pi_T}{C_V}\,\Delta V$ for a small expansion, and for van der Waals gas exactly $\Delta T = -\dfrac{a}{C_V}\Big(\dfrac1{V_1}-\dfrac1{V_2}\Big)$ if $C_V>0$ is constant, all units are consistent and the chosen homogeneous phase description remains applicable. The plotted variable is molar volume, so the corresponding energy and heat capacity are molar.`,
      idea: String.raw`Start from $\mathrm{d}U = T\,\mathrm{d}S - p\,\mathrm{d}V$ (pchem-3.12), divide by $\mathrm{d}V$ at constant $T$ and replace $(\partial S/\partial V)_T$ by the Maxwell relation $(\partial p/\partial T)_V$. The result converts an unmeasurable derivative into one from the equation of state, and it proves for the perfect gas $p = nRT/V$ that $U$ is independent of volume, as also follows from the ideal-gas partition function. For the van der Waals gas the attractive term makes $\pi_T=a/V_m^2>0$: pulling the molecules apart costs energy, taken from kinetic energy.`,
      caption: String.raw`Left: $\pi_T$ computed from the van der Waals pressure by a numerical derivative (solid) against $a/V_m^2$ (dashed); the perfect gas gives zero. Right: a gas expands freely from a small chamber into a larger one when you press play. Its temperature falls for the homogeneous van der Waals model and stays constant for the perfect gas; the particles are illustrative, while the temperature change is computed from the homogeneous model formula above. Its displayed stability status must be checked; no condensation or phase-equilibrium calculation is included.`,
      deps: ['pchem-3.12'],
      refs: ['Arovas §2.11.5, Eqs. (2.260)–(2.263); §7.2.1, Eqs. (7.8)–(7.9)'],
      tags: ['internal pressure', 'equation of state', 'Joule expansion'],
      credit: 'Thermodynamic internal-pressure identity; proof: Arovas §2.11.5',
      scope: String.raw`Closed systems of one component; the temperature change uses $C_V$ constant and the van der Waals equation, with constants computed from critical constants (CO₂, N₂, Ar) and $C_V$ at 298 K from the chapter-2 $C_p$ table (Ar: $\tfrac32R$). The expansion is adiabatic into vacuum. The animation is a schematic interpolation, not a transient solution; its chamber widths do not encode the selected volume ratio. Low-temperature/dense examples may leave the stable gas branch or enter coexistence; the homogeneous formula then is only formal continuation, not a physical gas prediction. The local stability check is necessary but does not exclude metastability. Stored critical constants set approximate model scales, not a precision fit.`,
      verify: false,
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
          const Tcur = T1.value + (real ? dT(g, cv, V1.value, fac.value) * xi : 0);
          const speed = Math.sqrt(Tcur / 300);
          pts.forEach(([a, b, ph], i) => { const spread = 1 + 1.2 * xi * (i % 2 ? 1 : 0.55 + 0.45 * ((i * 7) % 5) / 4), x = (a * spread) % (1 + xi * 1.2); const wob = 0.02 * speed * Math.sin(t * 6 * speed + ph); sb.dot(Math.min(2.15, 0.04 + x * 0.96) + wob, 0.04 + 0.92 * b + wob, { r: 4, color: real ? 'blue' : 'teal' }); });
          sb.line(1, 0, 1, 1, { color: 'red', width: 3, alpha: 1 - xi });
          const audit=freeExpansion(g,cv,T1.value,V1.value,fac.value);
          sb.corner(real&&!audit.physical?'formal unstable model; see readout':'schematic; volumes not to scale','bl',{color:real&&!audit.physical?'red':'muted',size:10});
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
          const { g, cv } = info(), V = V1.value, audit=freeExpansion(g,cv,T1.value,V,fac.value), pi = (g.a / V ** 2), d = dT(g, cv, V, fac.value);
          return `${gas.value === 'CO2' ? '$\\mathrm{CO_2}$' : gas.value === 'N2' ? '$\\mathrm{N_2}$' : 'Ar'} at $V_1=${v.fix(V, 3)}$ L/mol: $\\pi_T=a/V_1^2=${v.fix(pi, 1)}$ bar (numerical derivative agrees, see the solid curve); $C_V=${v.fix(cv, 1)}$ J/(K mol)\nfree expansion to $V_2=${v.fix(fac.value, 1)}V_1$: van der Waals $\\Delta T=-\\tfrac{a}{C_V}(1/V_1-1/V_2)=${v.fix(d, 2)}$ K; perfect gas $\\Delta T=0$ · ${audit.physical?'sampled homogeneous path passes local pressure/compressibility checks; coexistence still not excluded':'formal homogeneous continuation crosses unstable/nonpositive-pressure states; not a stable-gas prediction'}`;
        });
      },
    },
  ],
};
