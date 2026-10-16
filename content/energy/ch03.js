// Energy Systems — Chapter 3: Fuels and nuclear energy (items 3.1–3.5)
//
// SOURCES AND PROVENANCE (checked October 2026 unless marked "from memory")
//   3.1 Heats of formation (kJ/mol): CO2(g) −393.51 (CODATA, NIST WebBook), H2O(g) −241.826 (CODATA, NIST WebBook), CH4(g) −74.6 (Manion 2002, NIST WebBook),
//     n-octane(l) −250.2 (mean of the two NIST-listed values −250.3 and −250.0), C3H8(g) −104.7 (from memory; it reproduces the 50.33 MJ/kg HHV tabulated by Wikipedia).
//     H2O(l) −285.83 = H2O(g) − 44.0 kJ/mol (enthalpy of vaporisation at 298 K; NIST Antoine data give ≈44 kJ/mol). Tabulated check values (Wikipedia "Heat of
//     combustion"): H2 141.79 / 119.96, CH4 55.52 / 50.00, C3H8 50.33 / 46.35 MJ/kg. Coal and wood rows use HHV 32.5 (anthracite) and 21.7 (moisture- and ash-free wood)
//     from the same table; their hydrogen contents (3 % and 6 %) are TYPICAL round numbers from memory, not measurements of a particular sample.
//   3.2 IPCC 2006 Guidelines default CO2 emission factors (kg/GJ, net calorific basis): natural gas 56.1, motor gasoline 69.3, gas/diesel oil 74.1, residual fuel oil 77.4,
//     other bituminous coal 94.6 (confirmed from a reproduction of the default table; the crude-oil value was not confirmed and is left out).
//   3.3 Regeneration duty of a 30 wt% MEA solvent: published values lie between about 3.0 and 4.2 GJ/t CO2 (3.6 is the usual benchmark); the 3.6 default is that benchmark.
//     The plant efficiency 40 %, the steam-to-electricity worth 0.22 and the compressor efficiency 0.75 are ILLUSTRATIVE round numbers; the flue-gas CO2 fractions
//     (coal ≈ 13 %, gas turbine ≈ 4 %) are typical values from memory. The thermodynamic minimum work is computed, not looked up.
//   3.4 Energy densities as tabulated in Wikipedia "Energy density" (petrol 46.4 MJ/kg, 34.2 MJ/L; diesel 45.6 and 38.6; hydrogen LHV 119.93 MJ/kg, 8.49 MJ/L liquid and
//     4.5 MJ/L at 681 atm; Li-ion 0.36–0.875 MJ/kg and 0.9–2.63 MJ/L; lead-acid 0.17 and 0.56, a row the article does not source). Uranium rows are computed:
//     200 MeV per fission of U-235 (Wikipedia "Nuclear fission": 202.8 MeV mean, about 200 MeV recoverable), metal density 19.05 g/cm³ and, as an ILLUSTRATIVE
//     fuel-cycle point, 50 GWd per tonne of heavy metal with 9.2 kg of uranium per litre of pellets (from memory). Efficiencies of 25 % and 85 % are illustrative.
//   3.5 Binding energies: AME2020 (see ch03.shared.js). The 200 MeV total and ≈169 MeV fragment kinetic energy per U-235 fission are from Wikipedia "Nuclear fission".

import { clamp, lerp, BEA, NUC, MEV_U, LV, MH2O_PER_H, beaOf, bOf } from './ch03.shared.js';

const f1 = (v, x) => v.fix(x, 1), f2 = (v, x) => v.fix(x, 2);
const KJ_C = 393.51, KJ_W = 285.83; // kJ/mol of CO2 and liquid water formed

export default {
  collection: 'energy',
  chapter: 3,
  title: 'Fuels and nuclear energy',
  summary: String.raw`A fuel is a store of energy that can be released on demand, and its worth is set by the heat of combustion, the carbon it emits and the energy it packs into a kilogram or a litre. Chemical fuels give tens of megajoules per kilogram, batteries a few tenths, and nuclear fuel millions of times more, because nuclear binding energies are measured in megaelectronvolts instead of electronvolts. The binding-energy curve explains fission and fusion; the multiplication factor, delayed neutrons and point kinetics explain how a reactor is kept critical, decay heat explains why it must be cooled after shutdown, and the Lawson criterion says what fusion must achieve.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────── 3.1
    {
      num: '3.1', kind: 'Definition', name: 'Heating value of fuels (HHV and LHV)',
      statement: String.raw`The **heating value** of a fuel is the heat released when a unit mass of it burns completely in oxygen and the products are brought back to the starting temperature (usually $25^{\circ}$C). The **higher heating value** (HHV, gross) counts the water produced by combustion as condensed liquid, so it includes the latent heat of vaporisation; the **lower heating value** (LHV, net) leaves that water as vapour and does not count it. For a fuel that produces $m_w$ kilograms of water per kilogram,
$$\mathrm{HHV} = \mathrm{LHV} + L_v\, m_w,\qquad L_v \approx 2.44\ \mathrm{MJ/kg}\ (25^{\circ}\mathrm C),$$
and for a fuel with hydrogen mass fraction $h$ (dry, ash-free), $m_w \approx 8.94\,h$ plus any moisture the fuel carries.`,
      idea: String.raw`Combustion is a chemical reaction, so the heat released is the difference of the enthalpies of formation of products and reactants (Hess's law, from the standard enthalpies of formation): $\Delta_cH = \sum \Delta_fH(\text{products}) - \sum\Delta_fH(\text{reactants})$. Whether the water is liquid or vapour changes its formation enthalpy by the enthalpy of vaporisation, $44$ kJ/mol, so the two heating values differ by exactly the latent heat of the water formed. Hydrogen-rich fuels (hydrogen, methane) therefore have a large gap between HHV and LHV, carbon has none, and wet wood loses extra heat just boiling its own moisture.`,
      caption: String.raw`The bars are computed from formation enthalpies (the first four fuels) or taken from tabulated HHV (coal, wood), and the orange part of each bar is the latent heat of its water. Choose a fuel to see the mass balance of the burner, flip the toggle to count the latent heat or not, and slide the wood moisture: at 50 % moisture a kilogram of wood delivers less than half of its dry value.`,
      deps: ['pchem-2.10'],
      refs: ['Tester ch. 8'],
      tags: ['heating value', 'combustion'],
      scope: String.raw`Complete combustion at 25 °C and 1 atm. Pure-compound values are computed from NIST/CODATA formation enthalpies and reproduce the tabulated 141.79/119.96 (H$_2$), 55.52/50.00 (CH$_4$) and 50.33/46.35 MJ/kg (C$_3$H$_8$). The hydrogen content of the coal and wood rows (3 % and 6 %) is a typical round number, so their LHV is indicative only.`,
      verify: true,
      viz(v) {
        const fuels = [
          { key: 'H2', label: 'hydrogen H₂', M: 2.01588, nC: 0, nW: 1, dHf: 0 },
          { key: 'CH4', label: 'methane CH₄', M: 16.043, nC: 1, nW: 2, dHf: -74.6 },
          { key: 'C3H8', label: 'propane C₃H₈', M: 44.097, nC: 3, nW: 4, dHf: -104.7 },
          { key: 'C8H18', label: 'octane C₈H₁₈ (petrol)', M: 114.23, nC: 8, nW: 9, dHf: -250.2 },
          { key: 'coal', label: 'anthracite (3 % H)', hhv: 32.5, h: 0.03, c: 0.9 },
          { key: 'wood', label: 'wood (6 % H, wet)', hhv: 21.7, h: 0.06, c: 0.5 },
        ];
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 360, full: true, minWidth: 340 });
        const sM = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 200, full: true, minWidth: 340 });
        const sel = v.select('fuel', fuels.map((f) => ({ value: f.key, label: f.label })), 'CH4');
        const moist = v.slider('wood moisture (wet basis)', 0, 0.6, 0.2, { step: 0.01 });
        const eff = v.slider('boiler efficiency on an HHV basis', 0.6, 1, 0.9, { step: 0.01 });
        const cond = v.toggle('count the latent heat (condense the water)', true);
        const calc = (f) => {
          if (f.M) { // Hess's law from formation enthalpies of the compound
            const hhv = (f.nC * KJ_C + f.nW * KJ_W + f.dHf) / f.M, mw = f.nW * 18.015 / f.M;
            return { hhv, mw, lhv: hhv - LV * mw, co2: f.nC * 44.01 / f.M, o2: 0 };
          }
          if (f.key === 'wood') {
            const M = moist.value, hhv = f.hhv * (1 - M), mw = M + MH2O_PER_H * f.h * (1 - M);
            return { hhv, mw, lhv: hhv - LV * mw, co2: 3.664 * f.c * (1 - M) };
          }
          const mw = MH2O_PER_H * f.h; return { hhv: f.hhv, mw, lhv: f.hhv - LV * mw, co2: 3.664 * f.c };
        };
        let cur = null;
        v.render(() => {
          const c = s.ctx, W = s.width, H = s.height, L = 150, R = W - 18, top = 44, rowH = (H - top - 40) / fuels.length;
          const xs = (mj) => L + (R - L) * mj / 150;
          for (const t of [0, 25, 50, 75, 100, 125, 150]) {
            s.ctx.strokeStyle = v.color('grid'); c.beginPath(); c.moveTo(xs(t), top - 6); c.lineTo(xs(t), H - 34); c.stroke();
            s.textPx(String(t), xs(t), H - 24, { size: 11, color: 'muted', align: 'center' });
          }
          s.textPx('heating value, MJ per kg of fuel as burnt', (L + R) / 2, H - 8, { size: 11.5, color: 'muted', align: 'center' });
          s.textPx(cond.value ? 'the calorimeter counts the latent heat: HHV' : 'exhaust leaves hot, water stays steam: LHV', (L + R) / 2, 16, { size: 13, weight: 700, color: cond.value ? 'orange' : 'accent', align: 'center' });
          fuels.forEach((f, i) => {
            const r = calc(f), y = top + i * rowH + rowH / 2, bh = Math.min(26, rowH * 0.6), on = f.key === sel.value;
            if (on) { c.fillStyle = v.color('gold', 0.12); c.fillRect(4, y - rowH / 2 + 2, W - 8, rowH - 4); }
            s.textPx(f.label, L - 8, y, { size: 12, weight: on ? 700 : 500, color: on ? 'ink' : 'muted', align: 'right', halo: false });
            c.fillStyle = v.color('accent', cond.value ? 0.45 : 0.9); c.fillRect(xs(0), y - bh / 2, xs(r.lhv) - xs(0), bh);
            c.fillStyle = v.color('orange', cond.value ? 0.9 : 0.25); c.fillRect(xs(r.lhv), y - bh / 2, xs(r.hhv) - xs(r.lhv), bh);
            c.strokeStyle = v.color('ink'); c.lineWidth = 1.2; c.strokeRect(xs(0), y - bh / 2, xs(cond.value ? r.hhv : r.lhv) - xs(0), bh);
            s.textPx(`${f1(v, cond.value ? r.hhv : r.lhv)}`, xs(r.hhv) + 6, y, { size: 12, weight: 700, color: 'ink', align: 'left', halo: false });
            if (on) cur = { f, r };
          });
          if (!cur || cur.f.key !== sel.value) cur = { f: fuels.find((q) => q.key === sel.value), r: calc(fuels.find((q) => q.key === sel.value)) };
        });
        v.legend([['accent', 'LHV (water left as vapour)', { area: true }], ['orange', 'latent heat of the water, $L_v m_w$', { area: true }]]);
        // mass balance of the chosen fuel
        v.render(() => {
          const f = fuels.find((q) => q.key === sel.value), r = calc(f), c = sM.ctx, W = sM.width, H = sM.height;
          const o2 = f.M ? (f.nC + f.nW / 2) * 32 / f.M : (r.co2 * 32 / 44.01 + (r.mw - (f.key === 'wood' ? moist.value : 0)) * 16 / 18.015 - (f.key === 'wood' ? 0.4 * (1 - moist.value) : 0.02));
          const items = [['1 kg fuel', 1, 'gold'], ['+ O₂', Math.max(o2, 0), 'muted'], ['→ CO₂', r.co2, 'purple'], ['+ H₂O', r.mw, 'accent']];
          const k = (W - 40) / Math.max(1 + Math.max(o2, 0), r.co2 + r.mw, 1.5) / 1.0;
          const row = (labs, y0) => { let x = 20; labs.forEach(([lab, m, col]) => { const w = Math.max(m * k, 2); c.fillStyle = v.color(col, 0.5); c.fillRect(x, y0, w, 34); c.strokeStyle = v.color(col); c.strokeRect(x, y0, w, 34); sM.textPx(`${lab}  ${f2(v, m)} kg`, x + w / 2, y0 + 17, { size: 11.5, weight: 600, color: 'ink', align: 'center', halo: false }); x += w + 2; }); };
          sM.textPx('mass balance of the burner (per kg of fuel; oxygen from the air)', 20, 14, { size: 12, weight: 650, color: 'muted', align: 'left' });
          row(items.slice(0, 2), 30); row(items.slice(2), 78);
          sM.textPx(f.M ? `water formed: ${f2(v, r.mw)} kg/kg × ${f2(v, LV)} MJ/kg of latent heat = ${f2(v, LV * r.mw)} MJ` : `water: ${f2(v, r.mw)} kg/kg (from hydrogen${f.key === 'wood' ? ' and moisture' : ''}) × ${f2(v, LV)} MJ/kg = ${f2(v, LV * r.mw)} MJ`, 20, 140, { size: 12.5, weight: 650, color: 'orange', align: 'left' });
          sM.textPx(`HHV − LHV = ${f2(v, r.hhv - r.lhv)} MJ/kg  (${f1(v, 100 * (r.hhv / r.lhv - 1))} % of the LHV)`, 20, 164, { size: 12.5, weight: 650, color: 'ink', align: 'left' });
        });
        v.readout(() => {
          const f = fuels.find((q) => q.key === sel.value), r = calc(f);
          return `${f.label}: HHV $= ${f2(v, r.hhv)}$ MJ/kg, LHV $= ${f2(v, r.lhv)}$ MJ/kg, $m_w = ${f2(v, r.mw)}$ kg/kg, so $\\mathrm{HHV}-\\mathrm{LHV} = L_v m_w = ${f2(v, LV * r.mw)}$ MJ/kg.\nA boiler that is ${f1(v, 100 * eff.value)} % efficient on the HHV basis is ${f1(v, 100 * eff.value * r.hhv / r.lhv)} % efficient on the LHV basis: **above 100 % on LHV is not a violation**, only a sign that a condensing boiler recovers latent heat the LHV never counted.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.2
    {
      num: '3.2', kind: 'Proposition', name: 'Carbon intensity of fuels',
      statement: String.raw`Burning a hydrocarbon of hydrogen-to-carbon atom ratio $x$, written $\mathrm{CH}_x$, follows
$$\mathrm{CH}_x + \bigl(1+\tfrac x4\bigr)\mathrm{O}_2 \to \mathrm{CO}_2 + \tfrac x2\,\mathrm{H}_2\mathrm{O},$$
so each carbon atom gives exactly one CO$_2$ molecule, $44.01/12.011 = 3.664$ kg of CO$_2$ per kg of carbon. The CO$_2$ emitted **per unit of heat** is therefore $\mathrm{CI} = 3.664\,w_C/\mathrm{LHV}$ ($w_C$ = carbon mass fraction), and it falls as $x$ rises, because hydrogen burns to water, which carries away no carbon, while releasing about three and a half times more heat per kilogram than carbon does.`,
      idea: String.raw`The carbon balance is exact stoichiometry. What makes the intensity fall with $x$ is the heat: per kilogram of oxygen consumed, hydrocarbons release a nearly constant 13.7–13.9 MJ (checked below with the formation enthalpies of 3.1), and a hydrogen-rich fuel needs more oxygen per carbon, so more heat per carbon atom. Carbon (graphite) gives about 112 kg CO$_2$/GJ, methane 55, and hydrogen none. Natural gas, mostly methane, therefore emits roughly 40 % less CO$_2$ per unit of fuel heat than coal; per kilowatt-hour of electricity the gap is larger still, because gas plants are also more efficient.`,
      caption: String.raw`Drag the handle along the $\mathrm{CH}_x$ curve: the balanced equation, the heating value and the CO$_2$ per gigajoule update. Dots are computed from formation enthalpies (graphite, methane, propane, octane). On the right, bars give the IPCC default factors for real fuels; set the power-plant efficiencies to turn them into kilograms of CO$_2$ per megawatt-hour.`,
      deps: ['energy-3.1'],
      refs: ['Tester ch. 4'],
      tags: ['emissions', 'carbon intensity'],
      scope: String.raw`Complete combustion; intensity per unit of LHV (net calorific value). The curve assumes the heat released is about 13.8 MJ per kg of O$_2$ consumed, a good rule for hydrocarbons with $x\gtrsim 1.5$ (dashed below) and not for carbon itself. Real fuels carry sulphur, moisture and ash, so tabulated defaults differ slightly. Upstream (mining, venting) emissions are not included.`,
      credit: 'IPCC default emission factors, 2006 Guidelines',
      viz(v) {
        const O2MJ = 13.8; // MJ per kg of O2, fitted below
                const prop = (x) => { // x = H/C
          const M = 12.011 + 1.008 * x, o2 = 32 * (1 + x / 4) / M, hhv = O2MJ * o2, mw = (x / 2 * 18.015) / M, lhv = hhv - LV * mw;
          return { M, o2, hhv, mw, lhv, ci: 1000 * 44.01 / M / lhv, wC: 12.011 / M };
        };
        const pts = [ // exact compounds from Hess's law, as in 3.1
          { lab: 'graphite', x: 0, hhv: 393.51 / 12.011, mw: 0, M: 12.011, nC: 1 },
          { lab: 'octane', x: 18 / 8, hhv: (8 * KJ_C + 9 * KJ_W - 250.2) / 114.23, mw: 9 * 18.015 / 114.23, M: 114.23, nC: 8 },
          { lab: 'propane', x: 8 / 3, hhv: (3 * KJ_C + 4 * KJ_W - 104.7) / 44.097, mw: 4 * 18.015 / 44.097, M: 44.097, nC: 3 },
          { lab: 'methane', x: 4, hhv: (KJ_C + 2 * KJ_W - 74.6) / 16.043, mw: 2 * 18.015 / 16.043, M: 16.043, nC: 1 },
        ].map((p) => { const lhv = p.hhv - LV * p.mw; return { ...p, lhv, ci: 1000 * p.nC * 44.01 / p.M / lhv, o2mj: p.x === 0 ? p.hhv / (32 / 12.011) : p.hhv * p.M / (32 * p.nC * (1 + p.x / 4)) }; });
        const s = v.stage({ x: [0, 4.6], y: [40, 125], axes: 'box', gutter: true, height: 340, xlabel: 'H/C atom ratio  x', ylabel: 'kg CO₂ per GJ (LHV)', minWidth: 330 });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 340, minWidth: 330 });
        const hx = s.handle(4, prop(4).ci, { color: 'gold', label: 'CHₓ', constrain: (x) => { x = clamp(x, 0.3, 4.4); return [x, prop(x).ci]; } });
        const etaG = v.slider('gas plant efficiency', 0.3, 0.65, 0.55, { step: 0.01 });
        const etaC = v.slider('coal plant efficiency', 0.25, 0.5, 0.38, { step: 0.01 });
        const ipcc = [['natural gas', 56.1, 'green'], ['motor gasoline', 69.3, 'orange'], ['diesel (gas/diesel oil)', 74.1, 'orange'], ['residual fuel oil', 77.4, 'red'], ['bituminous coal', 94.6, 'ink']];
        v.render(() => {
          s.fn((x) => prop(x).ci, { domain: [1.5, 4.5], color: 'accent', width: 2.5 });
          s.fn((x) => prop(x).ci, { domain: [0.3, 1.5], color: 'accent', width: 2, dash: true, alpha: 0.6 });
          for (const p of pts) s.dot(p.x, p.ci, { r: 5, color: 'purple', label: p.lab, labelPos: p.lab === 'graphite' ? 'ne' : p.lab === 'methane' ? 'sw' : 'ne' });
          const P = prop(hx.x);
          s.vline(hx.x, { color: 'gold', alpha: 0.5, dash: true });
          // bars
          const c = sB.ctx, W = sB.width, H = sB.height, L = 140, R = W - 16, top = 34, rh = (H - top - 54) / ipcc.length, xs = (k) => L + (R - L) * k / 110;
          sB.textPx('IPCC default CO₂ factors, kg per GJ of fuel', 10, 16, { size: 12.5, weight: 700, color: 'ink', align: 'left' });
          ipcc.forEach(([n, val, col], i) => { const y = top + i * rh + rh / 2; c.fillStyle = v.color(col, 0.55); c.fillRect(xs(0), y - 13, xs(val) - xs(0), 26); sB.textPx(n, L - 6, y, { size: 12, color: 'muted', align: 'right', halo: false }); sB.textPx(f1(v, val), xs(val) + 5, y, { size: 12, weight: 700, color: 'ink', align: 'left', halo: false }); });
          const yx = (k) => top + ipcc.length * rh + 22;
          sB.textPx(`per MWh of electricity: gas ${Math.round(3.6 * 56.1 / etaG.value)} kg, coal ${Math.round(3.6 * 94.6 / etaC.value)} kg of CO₂`, 10, yx() , { size: 12.5, weight: 650, color: 'accent', align: 'left' });
          sB.textPx(`(= 3.6 GJ × factor ÷ efficiency; gas ÷ coal = ${f2(v, (56.1 / etaG.value) / (94.6 / etaC.value))})`, 10, yx() + 20, { size: 12, color: 'muted', align: 'left' });
        });
        v.legend([['accent', 'CH$_x$ model: 13.8 MJ per kg O$_2$'], ['purple', 'computed from formation enthalpies', { dot: true }], ['gold', 'your fuel']]);
        v.readout(() => {
          const P = prop(hx.x), n = 1 + hx.x / 4;
          const lines = pts.map((p) => `${p.lab} ${v.fix(p.o2mj, 1)}`).join(', ');
          return `$\\mathrm{CH}_{${f2(v, hx.x)}} + ${f2(v, n)}\\,\\mathrm{O_2} \\to \\mathrm{CO_2} + ${f2(v, hx.x / 2)}\\,\\mathrm{H_2O}$: carbon fraction ${f1(v, 100 * P.wC)} % by mass, LHV $\\approx ${f1(v, P.lhv)}$ MJ/kg, so $\\mathrm{CI} = 3.664\\,w_C/\\mathrm{LHV} = ${f1(v, P.ci)}$ kg CO$_2$/GJ.\nCheck of the 13.8 MJ/kg-O$_2$ rule (HHV per kg of O$_2$ consumed, from 3.1's enthalpies): ${lines}; the three hydrocarbons agree within 1.5 %, graphite does not. Natural gas (56.1) emits ${f1(v, 100 * (1 - 56.1 / 94.6))} % less CO$_2$ per GJ than bituminous coal (94.6).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.3
    {
      num: '3.3', kind: 'Model', name: 'Carbon capture and its energy penalty',
      statement: String.raw`Capturing CO$_2$ from flue gas costs energy for two reasons. First, **thermodynamics**: separating a fraction $r$ of the CO$_2$ present at mole fraction $y$ into a pure stream is an unmixing process whose minimum work, per mole of flue gas at temperature $T$, is
$$W_{\min} = RT\Bigl[(1-ry)\,h(y') - h(y)\Bigr],\quad h(z)=z\ln z+(1-z)\ln(1-z),\quad y'=\frac{y(1-r)}{1-ry},$$
which for coal flue gas is around 0.15–0.2 GJ per tonne of CO$_2$, and larger the more dilute the stream. Second, **practice**: a solvent plant needs about 3–4 GJ of low-pressure steam per tonne captured to regenerate the solvent, and the CO$_2$ must then be compressed for transport. Both are paid for by electricity the plant can no longer sell, so the net efficiency falls by several percentage points.`,
      idea: String.raw`The minimum work is the Gibbs free energy of unmixing (the entropy of mixing of ideal gases) — an application of the exergy idea of 2.9: concentrating a dilute component costs work proportional to $RT\ln(1/y)$. A real solvent plant uses heat, not work, at a temperature near 120 °C, so each gigajoule of steam diverted from the turbine costs only about 0.2 GJ of electricity, but 3.6 GJ of steam per tonne is still more than twenty times the thermodynamic minimum in heat terms, and about five times in electricity terms: the process is far from reversible, and that gap is where research on better solvents works.`,
      caption: String.raw`The top bar compares the plant without and with capture per unit of fuel; the dark sliver inside the red steam slice is the thermodynamic minimum. Slide the solvent's regeneration duty and the steam-to-electricity worth to see the penalty move. The right panel shows the minimum work against the CO$_2$ fraction of the gas: a gas turbine's flue gas is more dilute than coal's, and air is far more dilute still.`,
      deps: ['energy-3.2', 'energy-2.9'],
      refs: ['Tester ch. 8'],
      tags: ['carbon capture', 'exergy', 'second law'],
      scope: String.raw`A schematic coal plant with 90 % post-combustion capture on an amine solvent. The minimum work uses ideal gases at $T = 40^{\circ}$C and is exact for that assumption; the regeneration duty (3.0–4.2 GJ/t is the published range for monoethanolamine, 3.6 the usual benchmark), the steam worth, the compressor efficiency and the 40 % plant efficiency are illustrative round numbers. Published net penalties vary with solvent, integration and plant, so treat the result as an order of magnitude, not a forecast.`,
      verify: true,
      viz(v) {
        const R = 8.314, T = 313.15, MC = 44.01;
        // J per mol of flue gas, divided by (r y) mol of CO2 and 44.01 g/mol gives J/g = MJ/t; /1000 → GJ/t
        const wmin = (y, r) => { const h = (z) => (z <= 0 || z >= 1 ? 0 : z * Math.log(z) + (1 - z) * Math.log(1 - z)); const yp = y * (1 - r) / (1 - r * y); return R * T * ((1 - r * y) * h(yp) - h(y)) / (r * y) / MC / 1000; };
        const s = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 260, full: true });
        const sP = v.stage({ x: [0.0003, 0.3], y: [0.05, 2], axes: 'box', gutter: true, xlog: true, ylog: true, height: 320, xlabel: 'CO₂ mole fraction in the gas', ylabel: 'minimum work, GJ per t CO₂', minWidth: 330 });
        const y = v.slider('CO₂ in flue gas, $y$', 0.02, 0.2, 0.13, { step: 0.005 });
        const r = v.slider('capture fraction $r$', 0.5, 0.99, 0.9, { step: 0.01 });
        const q = v.slider('solvent regeneration duty (GJ steam per t CO₂)', 2.5, 4.5, 3.6, { step: 0.05 });
        const kap = v.slider('electricity lost per GJ of steam taken', 0.12, 0.35, 0.22, { step: 0.01 });
        const eta = v.slider('plant efficiency without capture', 0.3, 0.5, 0.4, { step: 0.01 });
        const ec = v.slider('compressor efficiency', 0.6, 0.9, 0.75, { step: 0.01 });
        const model = () => {
          const F = 3.6 / eta.value;                 // GJ fuel per MWh net without capture
          const t = F * 94.6 / 1000, cap = r.value * t; // t CO2 per MWh emitted / captured
          const wmGJ = wmin(y.value, r.value);          // GJ per t, minimum work
          const eMin = wmGJ * cap;
          const comp = R * 313.15 * Math.log(110) / MC / 1000 / ec.value; // GJ per t, isothermal compression 1 → 110 bar
          const eC = comp * cap, eS = kap.value * q.value * cap, tot = eS + eC;
          const net = 3.6 - tot;
          return { F, t, cap, wmGJ, eMin, eS, eC, tot, net, etaNew: net / F, pen: eta.value - net / F, fuelUp: 3.6 / net - 1, comp, sec: eMin / Math.max(tot, 1e-9) };
        };
        v.render(() => {
          const m = model(), c = s.ctx, W = s.width, H = s.height, L = 130, Rr = W - 16, xs = (g) => L + (Rr - L) * g / m.F;
          s.textPx('energy per net megawatt-hour (3.6 GJ) of electricity before capture, GJ of fuel', 10, 16, { size: 12, weight: 650, color: 'muted', align: 'left' });
          const bar = (yc, segs, lab) => { let x = 0; s.textPx(lab, L - 8, yc, { size: 12, weight: 650, color: 'ink', align: 'right', halo: false }); for (const [g, col, tx] of segs) { c.fillStyle = v.color(col, 0.6); c.fillRect(xs(x), yc - 22, xs(x + g) - xs(x), 44); c.strokeStyle = v.color(col); c.strokeRect(xs(x), yc - 22, xs(x + g) - xs(x), 44); if (tx && xs(x + g) - xs(x) > 34) s.textPx(tx, (xs(x) + xs(x + g)) / 2, yc, { size: 11, weight: 650, color: 'ink', align: 'center', halo: false }); x += g; } return x; };
          bar(70, [[3.6, 'green', 'net electricity'], [m.F - 3.6, 'faint', 'waste heat']], 'no capture');
          bar(140, [[Math.max(m.net, 0), 'green', 'net electricity'], [m.eC, 'orange', 'compress'], [m.eS - m.eMin, 'red', 'steam'], [m.eMin, 'ink', ''], [m.F - 3.6, 'faint', 'waste heat']], 'with capture');
          s.textPx(`same fuel (${f1(v, m.F)} GJ): net efficiency ${f1(v, 100 * eta.value)} % → ${f1(v, 100 * m.etaNew)} %`, 10, 196, { size: 13, weight: 700, color: 'red', align: 'left' });
          s.textPx(`dark sliver = thermodynamic minimum (${f2(v, m.eMin)} GJ of ${f2(v, m.tot)} GJ lost)`, 10, 218, { size: 12, color: 'muted', align: 'left' });
          sP.fn((z) => wmin(z, r.value), { domain: [0.0003, 0.3], color: 'accent', width: 2.5 });
          sP.hline(q.value * kap.value, { color: 'red', dash: true });
          sP.text('solvent plant (steam × worth)', 0.0004, q.value * kap.value * 1.12, { size: 11, color: 'red', align: 'left' });
          for (const [yy, lab, col] of [[0.0004, 'air', 'purple'], [0.04, 'gas turbine', 'teal'], [0.13, 'coal', 'gold']]) { sP.dot(yy, wmin(yy, r.value), { r: 5, color: col, label: lab, labelPos: yy < 0.001 ? 'ne' : 'sw' }); }
          sP.vline(y.value, { color: 'gold', alpha: 0.5, dash: true });
        });
        v.legend([['green', 'net electricity', { area: true }], ['orange', 'compression', { area: true }], ['red', 'regeneration steam (as electricity)', { area: true }], ['ink', 'thermodynamic minimum', { area: true }]]);
        v.readout(() => {
          const m = model();
          return `Minimum separation work at $y=${f2(v, y.value)}$, $r=${f2(v, r.value)}$: **${f2(v, m.wmGJ)} GJ/t** CO$_2$ (computed from the entropy of mixing). The solvent plant spends $${f2(v, q.value)}\\times${f2(v, kap.value)} = ${f2(v, q.value * kap.value)}$ GJ of electricity-equivalent per tonne, so its second-law efficiency is about ${f1(v, 100 * m.wmGJ / (q.value * kap.value + m.comp))} % (counting compression).\nPer MWh: ${f2(v, m.cap)} t CO$_2$ captured costs ${f2(v, m.tot)} GJ of electricity: net efficiency falls by ${f1(v, 100 * m.pen)} points, and the plant burns ${f1(v, 100 * m.fuelUp)} % more fuel per MWh delivered.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.4
    {
      num: '3.4', kind: 'Concept', name: 'Energy density: fuels versus batteries',
      statement: String.raw`Two numbers decide whether an energy store suits a vehicle: the **specific energy** (megajoules per kilogram) and the **energy density** (megajoules per litre). Liquid hydrocarbons store about 46 MJ/kg and 34–39 MJ/L; hydrogen has the highest mass density of any chemical fuel (120 MJ/kg, lower heating value) but low volume density even when liquefied or compressed to several hundred bar; lithium-ion cells store a few tenths of a MJ/kg and 1–3 MJ/L; lead-acid batteries less. Nuclear fuel is a different order of magnitude, millions of megajoules per kilogram, because the energy per event is megaelectronvolts rather than electronvolts.`,
      idea: String.raw`Chemical energy is of order an electronvolt per atom rearranged; with atoms weighing 1–200 u that fixes the scale at tens of MJ/kg. A fuel gets the oxygen free from the air, while a battery must carry both its reactants and the structure that holds them, which costs it a factor of 50–100 in specific energy. Nuclear reactions (3.5) release about 200 MeV per fission, a factor of $10^{7}$ more per atom than combustion. Energy density is not the whole story, since an electric drivetrain wastes much less of the stored energy than a combustion engine, narrowing the gap in useful distance.`,
      caption: String.raw`Left: every store on log axes of MJ/kg against MJ/L; diagonal lines are constant density in kg per litre. Right: the same stored energy as a fuel tank, a battery pack, hydrogen and uranium, with areas proportional to volume. Move the energy slider, and switch on the drivetrain-efficiency toggle to compare *useful* energy instead.`,
      deps: ['energy-3.1'],
      refs: ['MacKay ch. 26'],
      tags: ['energy density', 'batteries'],
      scope: String.raw`Cell-level or fuel-level values, with no packaging: a car's battery pack is perhaps half as good as the cell, a tank adds a little mass and a hydrogen tank much more. Lithium-ion values span a range because chemistries differ (the box). Uranium: 200 MeV per fission of pure U-235, and an illustrative light-water-reactor fuel point at 50 GWd per tonne of heavy metal. The drivetrain efficiencies (25 % and 85 %) are illustrative round numbers.`,
      verify: true,
      viz(v) {
        const items = [
          { n: 'petrol', kg: 46.4, L: 34.2, col: 'orange' },
          { n: 'diesel', kg: 45.6, L: 38.6, col: 'orange' },
          { n: 'H₂ liquid', kg: 119.93, L: 8.491, col: 'teal' },
          { n: 'H₂ 681 atm', kg: 119.93, L: 4.5, col: 'teal' },
          { n: 'lead-acid', kg: 0.17, L: 0.56, col: 'purple' },
          { n: 'Li-ion (mid)', kg: 0.62, L: 1.77, col: 'green', box: [0.36, 0.875, 0.9, 2.63] },
          { n: 'U-235 fully fissioned', kg: 200 * 1.602176634e-13 * 6.02214076e23 / 0.235 / 1e6, L: 0, col: 'red' },
          { n: 'LWR fuel, 50 GWd/t', kg: 50e9 * 86400 / 1e3 / 1e6, L: 50e9 * 86400 / 1e3 / 1e6 * 9.2, col: 'red' },
        ];
        items[6].L = items[6].kg * 19.05; items[7].L = items[7].kg * 9.2;
        const s = v.stage({ x: [0.05, 3e8], y: [0.2, 1e10], xlog: true, ylog: true, axes: 'box', gutter: true, height: 430, xlabel: 'specific energy, MJ/kg', ylabel: 'energy density, MJ/L', minWidth: 340 });
        const sB = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 430, minWidth: 340 });
        const E = v.slider('stored energy (MJ)', 100, 5000, 1000, { step: 50, log: true });
        const usef = v.toggle('compare useful energy (engine vs electric drivetrain)', false);
        const e1 = v.slider('engine efficiency', 0.15, 0.4, 0.25, { step: 0.01 });
        const e2 = v.slider('battery drivetrain efficiency', 0.7, 0.95, 0.85, { step: 0.01 });
        const tankSet = ['petrol', 'H₂ 681 atm', 'Li-ion (mid)', 'lead-acid', 'LWR fuel, 50 GWd/t'];
        v.render(() => {
          for (const rho of [0.1, 1, 10]) s.path([[0.05, 0.05 * rho], [3e8, 3e8 * rho]].filter((p) => p[1] >= 0.2 && p[1] <= 1e10), { color: 'faint', dash: true, width: 1 });
          for (const it of items) {
            if (it.box) s.rect(it.box[0], it.box[2], it.box[1], it.box[3], { color: it.col, fill: it.col, fillAlpha: 0.2 });
            s.dot(it.kg, it.L, { r: 6, color: it.col, label: it.n, labelPos: ({ diesel: 'ne', petrol: 'nw', 'H₂ 681 atm': 'e', 'H₂ liquid': 'ne', 'lead-acid': 'n', 'Li-ion (mid)': 'se', 'U-235 fully fissioned': 'sw' })[it.n] || 'ne' });
          }
          s.textPx('1 kg/L', s.X(2e3), s.Y(2e3) - 10, { size: 10.5, color: 'faint', align: 'right', halo: false });
          // equal-energy squares
          const c = sB.ctx, W = sB.width, H = sB.height, Ej = E.value;
          const ids = tankSet.map((n) => items.find((i) => i.n === n));
          const eff = (it) => (!usef.value ? 1 : it.col === 'orange' ? e1.value : it.col === 'green' || it.col === 'purple' ? e2.value : it.col === 'teal' ? 0.5 : 1);
          // use useful energy = E (target): required stored energy = E/eff, with eff only applied if toggled
          const data = ids.map((it) => { const Es = Ej / eff(it), kg = Es / it.kg, L = Es / it.L; return { it, Es, kg, L }; });
          const Lmax = Math.max(...data.map((d) => d.L)), S0 = Math.min(W / 2.5, 170), side = (L) => Math.sqrt(L / Lmax) * S0;
          sB.textPx(usef.value ? `to deliver ${Math.round(Ej)} MJ of useful energy` : `to store ${Math.round(Ej)} MJ (${f1(v, Ej / 3.6)} kWh)`, 10, 16, { size: 13, weight: 700, color: 'ink', align: 'left' });
          sB.textPx('square areas are proportional to volume', 10, 36, { size: 11, color: 'muted', align: 'left' });
          let x0 = 14; const base = 60 + S0;
          data.slice().sort((a, b) => b.L - a.L).forEach((d) => { const sd = Math.max(side(d.L), 2); c.fillStyle = v.color(d.it.col, 0.5); c.fillRect(x0, base - sd, sd, sd); c.strokeStyle = v.color(d.it.col); c.strokeRect(x0, base - sd, sd, sd); x0 += sd + 8; });
          let yy = base + 28;
          data.forEach((d) => { c.fillStyle = v.color(d.it.col, 0.6); c.fillRect(14, yy - 8, 14, 14);
            const mass = d.kg >= 1 ? `${d.kg >= 100 ? Math.round(d.kg) : f1(v, d.kg)} kg` : `${v.fmt(d.kg * 1000, 2)} g`, vol = d.L >= 1 ? `${d.L >= 100 ? Math.round(d.L) : f1(v, d.L)} L` : `${v.fmt(d.L * 1000, 2)} mL`;
            sB.textPx(`${d.it.n}: ${mass}, ${vol}`, 36, yy, { size: 12, weight: 600, color: 'ink', align: 'left', halo: false }); yy += 26; });
        });
        v.legend([['orange', 'hydrocarbons', { dot: true }], ['teal', 'hydrogen', { dot: true }], ['green', 'Li-ion (box = range)', { dot: true }], ['purple', 'lead-acid', { dot: true }], ['red', 'uranium', { dot: true }]]);
        v.readout(() => {
          const p = items[0], li = items[5], u = items[6];
          return `Petrol holds ${f1(v, p.kg / li.kg)} times more energy per kilogram than a mid-range Li-ion cell (${f1(v, p.L / li.L)} times per litre); fully fissioned U-235 holds $${v.sci(u.kg / p.kg, 2)}$ times more than petrol per kilogram. At 25 % versus 85 % drivetrain efficiency the useful-energy gap shrinks by a factor ${f1(v, 0.85 / 0.25)}.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────── 3.5
    {
      num: '3.5', kind: 'Law', name: 'Nuclear binding energy and the energy of fission',
      statement: String.raw`The nucleus of mass number $A$ has mass $M(Z,A) = Z m_p + (A-Z)m_n - B/c^2$, where $B$ is the **binding energy**. The binding energy per nucleon $B/A$ rises steeply from about 1 MeV (deuterium) through 7.07 MeV ($^4$He) to a broad maximum near 8.8 MeV at $A\approx 56$–$62$ (the most bound measured nuclide is $^{62}$Ni, with $^{58}$Fe and $^{56}$Fe within 0.01 MeV), then falls slowly to 7.6 MeV for uranium. Any reaction that moves nucleons toward the maximum releases the difference of total binding energies,
$$Q = \sum_{\text{products}} B - \sum_{\text{reactants}} B = \Delta m\,c^2,$$
about 17.6 MeV for fusion of deuterium and tritium and about 170–200 MeV for the fission of $^{235}$U (the 200 MeV figure counts the later decays of the fragments).`,
      idea: String.raw`Mass–energy equivalence (rel-4.4) converts the mass defect of a nucleus (rel-4.11) into energy. The curve has its shape from a competition: the strong force binds each nucleon to its few neighbours (a roughly constant $B/A$), surface nucleons are less bound (lowering $B/A$ for light nuclei), and the electric repulsion of protons grows as $Z^2$ (lowering it for heavy ones). Light nuclei gain by fusing, heavy ones by splitting; iron-group nuclei can do neither.`,
      caption: String.raw`The curve is the measured binding energy per nucleon of the most bound known nuclide at each $A$ (AME2020). Choose a reaction, or drag the fragment handle to choose how $^{236}$U splits: the arrow shows the move along the curve, and the gain in total $B$ is the energy released, and the readout converts it to mass defect and energy per kilogram.`,
      deps: ['rel-4.11', 'rel-4.4'],
      refs: ['Tester ch. 9'],
      tags: ['binding energy', 'fission', 'fusion'],
      scope: String.raw`Total binding energies from the Atomic Mass Evaluation 2020 (measured values). For the freely dragged fission split, products are the most bound isobars at their mass numbers, which slightly overstates $Q$ (real fragments are neutron rich); the named reactions use the exact nuclides. Fission energy appears as fragment kinetic energy (about 169 MeV), neutrons, gammas and later beta decays; neutrinos carry off about 3 %.`,
      credit: 'Atomic Mass Evaluation 2020 (Huang, Wang, Kondev, Audi, Naimi)',
      viz(v) {
        const s = v.stage({ x: [0, 250], y: [0, 10.2], axes: 'box', gutter: true, height: 360, xlabel: 'mass number A', ylabel: 'binding energy per nucleon (MeV)', minWidth: 340 });
        const mode = v.select('reaction', [{ value: 'fis', label: 'U-235 fission (drag)' }, { value: 'ba', label: 'U-235 → Ba-141 + Kr-92' }, { value: 'dt', label: 'D + T fusion' }, { value: 'pp', label: '4 H → He-4' }, { value: 'ccc', label: '3 He-4 → C-12' }], 'fis');
        const n = v.slider('neutrons released', 2, 3, 2, { step: 1, int: true });
        const h = s.handle(95, beaOf(95), { color: 'gold', label: 'fragment A₁', constrain: (x) => { x = clamp(Math.round(x), 70, 118); return [x, beaOf(x)]; } });
        const U = NUC.U235, ME = (k) => NUC[k][2], BT = (k) => NUC[k][3];
        const reaction = () => {
          const m = mode.value;
          if (m === 'fis') { const nn = n.value, A1 = Math.round(h.x), A2 = 236 - nn - A1; return { Q: bOf(A1) + bOf(A2) - NUC.U235[3] / 1000, lhs: [[235, 'U-235']], rhs: [[A1, `A=${A1}`], [A2, `A=${A2}`]], from: [235], to: [A1, A2], kgA: 236, label: `U-235 + n → A=${A1} + A=${A2} + ${nn}n` }; }
          if (m === 'ba') return { Q: (ME('U235') + ME('n') - ME('Ba141') - ME('Kr92') - 3 * ME('n')) / 1000, from: [235], to: [141, 92], kgA: 236, label: 'U-235 + n → Ba-141 + Kr-92 + 3n' };
          if (m === 'dt') return { Q: (ME('H2') + ME('H3') - ME('He4') - ME('n')) / 1000, from: [2, 3], to: [4], kgA: 5, label: 'D + T → He-4 + n' };
          if (m === 'pp') return { Q: (4 * ME('H1') - ME('He4')) / 1000, from: [1, 1, 1, 1], to: [4], kgA: 4, label: '4 H-1 → He-4 (+ 2 e⁺ + 2 ν)' };
          return { Q: (3 * ME('He4') - ME('C12')) / 1000, from: [4, 4, 4], to: [12], kgA: 12, label: '3 He-4 → C-12' };
        };
        let R = null;
        v.render(() => {
          h.visible = mode.value === 'fis'; n.el.hidden = mode.value !== 'fis';
          s.path(BEA.map((r) => [r[0], r[2] / 1000]), { color: 'accent', width: 1.6, alpha: 0.5 });
          s.dots(BEA.map((r) => [r[0], r[2] / 1000]), { r: 2.2, color: 'accent' });
          const lab = [[4, 'He-4'], [12, 'C-12'], [56, 'Fe-56'], [62, 'Ni-62'], [238, 'U-238']];
          s.dot(62, 8.7946, { r: 5, color: 'green', label: 'Ni-62 8.795', labelPos: 'n' });
          s.dot(4, 7.074, { r: 4, color: 'purple', label: 'He-4', labelPos: 'n' }); s.dot(12, 7.680, { r: 4, color: 'purple', label: 'C-12', labelPos: 'se' });
          s.dot(238, 7.570, { r: 4, color: 'purple', label: 'U-238', labelPos: 's' });
          R = reaction();
          const bm = (A) => (A === 1 ? 0 : beaOf(A));
          const eb = (A) => (mode.value === 'fis' || mode.value === 'ba' ? beaOf(A) : ({ 1: 0, 2: 1.1123, 3: 2.8273, 4: 7.0739, 5: 7.0739, 12: 7.6801 })[A] ?? beaOf(A));
          for (const a of R.from) s.dot(a, eb(a), { r: 6, color: 'red', hollow: true });
          for (const a of R.to) s.dot(a, eb(a), { r: 6, color: 'green', hollow: true });
          const a0 = R.from[0], a1 = R.to[0];
          s.arrow(a0, eb(a0) + 0.35, a1, eb(a1) + 0.35, { color: 'gold', width: 2 });
          s.corner(`Q = ${f1(v, R.Q)} MeV`, 'br', { color: 'green', weight: 700, plate: true });
        });
        v.legend([['accent', 'most bound nuclide at each $A$ (AME2020)', { dot: true }], ['red', 'reactants', { dot: true }], ['green', 'products', { dot: true }]]);
        v.readout(() => {
          const Q = R.Q, dm = Q / MEV_U, per = Q * 1.602176634e-13 * 6.02214076e23 / (R.kgA / 1000) / 1e12;
          return `${R.label}: $Q = ${f1(v, Q)}$ MeV, i.e. a mass defect $\\Delta m = Q/c^2 = ${v.fix(dm, 4)}$ u (${v.fix(100 * dm / R.kgA, 3)} % of the reacting mass).\nPer kilogram of reactants that is ${v.fix(per, 1)} TJ, about $${v.sci(per * 1e6 / 32.5, 2)}$ times the heat of a kilogram of anthracite (32.5 MJ/kg). ${mode.value === 'fis' ? 'The dragged split uses the most bound isobars, so it is an upper bound (real fragments are neutron rich: the Ba-141 + Kr-92 button gives the exact 173 MeV). About 200 MeV per fission is released once later decays are counted; the fragments\' prompt kinetic energy is about 169 MeV.' : ''}`;
        });
      },
    },
  ],
};
