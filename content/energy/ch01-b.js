// Energy Systems — Chapter 1: Energy, power and scale (part b: items 1.7–1.11)
//
// Sources (checked October 2026; shared data and provenance are at the top of ch01.shared.js):
//   1.7 Cars: ICCT white paper "A global comparison of the life-cycle greenhouse gas emissions of combustion engine and
//     electric passenger cars" (Bieker, July 2021), lower-medium segment in the EU and UK for cars registered in 2021:
//     production and recycling of glider and powertrain 7.2 t CO2e (gasoline ICEV) and 6.5 t (BEV without battery)
//     (Table A.1); battery 60 kg CO2e/kWh (Europe, US) × 45 kWh = 2.7 t (Tables 2.3–2.4); real-world consumption 7.1 L/100 km
//     of gasoline and 20.6 kWh/100 km for the BEV including charging losses (Table A.2, text of section 3); gasoline well-to-tank
//     0.68 + tank-to-wheel 2.24 kg CO2e/L (Table A.9); lifetime mileage 243,000 km (18 years at 13,500 km/yr, −5%/yr). Grid
//     intensities (g CO2e/kWh, cars registered in 2021, over their lifetime): Germany 303, UK 125, France 35, Italy 130, Spain 107,
//     and ranges 164–199 (EU), 239–357 (US), 509–622 (China), 561–746 (India); the picture uses the midpoints of the ranges.
//     Life-cycle emissions of electricity (g CO2e/kWh, medians): IPCC AR5 WG3 Annex III Table A.III.2 (Schlömer et al. 2014):
//     coal 820, gas combined cycle 490, nuclear 12, onshore wind 11, utility solar PV 48, hydropower 24, dedicated biomass 230.
//   1.8 World series (1990, 2000, 2010 and 2015–2022: the years with a GDP value): OWID co2-data (population, GDP in 2011
//     international $ from the Maddison Project Database 2023, primary energy TWh from EI/EIA, fossil-fuel and cement CO2 from the
//     Global Carbon Budget 2025). Countries: OWID energy dataset 2022 (energy per person, kWh), Maddison GDP per person, UNDP HDI 2022
//     (via OWID); 150 countries above one million people with all three values. Kaya: Y. Kaya, 1990 (IPCC Energy and Industry
//     Subgroup workshop paper), and Kaya & Yokobori 1997.
//   1.9 Jevons, The Coal Question (1865), ch. VII. Fouquet & Pearson, "Seven centuries of energy services: the price and use of
//     light in the United Kingdom (1300–2000)", The Energy Journal 27(1): 139–177 (2006): between 1800 and 2000 the price of
//     lighting fell to less than one three-thousandth, per-capita use rose 6,500-fold, total use 25,000-fold, while UK GDP per
//     capita rose 15-fold. Direct rebound in road transport: Dimitropoulos, Oueslati & Sintek, Energy Economics 75 (2018): about
//     12% in the short run and 32% in the long run (meta-analysis).
//   1.10 EIA "U.S. Field Production of Crude Oil" (MCRFPUS2), annual 1900–2024 including Alaska; Hubbert, "Nuclear Energy and the
//     Fossil Fuels", API Drilling and Production Practice, Spring Meeting, San Antonio (1956): Lower 48 ultimate recovery of
//     150–200 billion barrels, peak 1965–1970.
//   1.11 OWID "solar-pv-prices-vs-cumulative-capacity": module price in 2025 US$/W (Nemet 2009 for 1975–2003, Farmer & Lafond 2016
//     for 2004–2009, IRENA 2025 from 2010) and cumulative capacity in MW (Nemet 2009; IRENA 2026). T. P. Wright, "Factors affecting
//     the cost of airplanes", Journal of the Aeronautical Sciences 3(4): 122–128 (1936).

import { clamp, lerp, textW, sci, grp, placeLabels, trapz, MIX, KAYA, CS22, CRUDE, SOLAR_PV, YEAR_S } from './ch01.shared.js';

export default {
  collection: 'energy',
  chapter: 1,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.7
    {
      num: '1.7', kind: 'Concept', name: 'Life-cycle assessment',
      statement: String.raw`A **life-cycle assessment** (LCA) adds up an environmental burden — here greenhouse-gas emissions in CO$_2$-equivalents — over every stage of a product's life: extracting materials, manufacturing, operating, and disposing of or recycling it, and expresses the total per unit of service (per kilometre, per kWh). For energy systems it makes two points clear. Technologies that burn nothing still have emissions from the steel, silicon and concrete in them (utility solar PV about 48 g CO$_2$e per kWh and onshore wind about 11, against 490 for gas and 820 for coal, as IPCC medians). And a vehicle's emissions depend on the energy chain that feeds it: a battery car starts its life with a larger manufacturing debt than a petrol car (about 9.2 t against 7.2 t for a European compact, with a 45 kWh battery) and repays it kilometre by kilometre in proportion to how much cleaner its electricity is than petrol. The **break-even distance** is
$$d^{*} = \frac{M_{\text{EV}} - M_{\text{ICE}}}{e_{\text{ICE}} - e_{\text{EV}}}, \qquad e_{\text{EV}} = c_{\text{EV}}\,g_{\text{grid}},$$
finite only when the electric car emits less per kilometre than the petrol car.`,
      idea: String.raw`LCA is bookkeeping with a system boundary: each emission is a number of the form (quantity of something) × (emission factor), and the answer is the sum along the chain. A petrol car's use phase is well-to-wheel fuel emissions — 2.9 kg CO$_2$e for each litre, proportional to the 7.1 L it burns per 100 km; an electric car's is its 20.6 kWh per 100 km (charging losses included) times the grid's intensity. Both are straight lines in distance, with the manufacturing emissions as intercepts, so the comparison reduces to two lines crossing at $d^{*}$. The slope of the EV line is set by the grid (35 g/kWh in France, about 650 in India, 820 for coal power), which is why the same car can pay back in 15,000 km in one country and never in another.`,
      caption: String.raw`The lines are cumulative life-cycle emissions of a compact petrol car and a compact battery car (ICCT 2021 values for Europe) against distance driven; the dot is the break-even distance. Pick the carbon intensity of the electricity (country mix or generation technology) or drag its slider, and change the battery size, consumption and car life. The bars on the right split each car's emissions over its life into production, battery and fuel or electricity.`,
      deps: ['energy-1.5'],
      refs: ['Tester ch. 6'],
      tags: ['life-cycle assessment', 'emissions', 'electric vehicles'],
      scope: String.raw`Values are for the 2021 European lower-medium car segment (ICCT); other segments, countries and years differ, and the grid mix changes during a car's life (the ICCT numbers are lifetime averages for cars registered in 2021). Grid intensities include the construction of power plants and grid losses; "midpoint" presets are midpoints of the ICCT ranges.`,
      viz(v) {
        // ICCT 2021, lower-medium segment, EU+UK
        const M_ICE = 7.2, M_GLIDER_EV = 6.5, KG_L = 0.68 + 2.24, KGKWH_BATT = 0.060;
        const PRE = [['France', 35], ['Spain', 107], ['UK', 125], ['EU mix', 181.5], ['US', 298], ['Germany', 303], ['China', 565.5], ['India', 653.5], ['coal power', 820]];
        const sel = v.select('electricity', [...PRE.map(([n, g]) => ({ value: n, label: n })), { value: 'custom', label: 'slider' }], 'EU mix', { onChange: (k) => { const p = PRE.find((q) => q[0] === k); if (p) grid.set(p[1]); } });
        const grid = v.slider('grid intensity (g CO₂e/kWh)', 0, 1000, 181.5, { step: 1, fmt: (x) => v.fix(x, 0), onChange: () => { const p = PRE.find((q) => Math.abs(q[1] - grid.value) < 0.6); if (p) sel.set(p[0]); else sel.set('custom'); } });
        const bat = v.slider('battery (kWh)', 20, 120, 45, { step: 1, fmt: (x) => `${x} kWh` });
        const ice = v.slider('petrol use (L/100 km)', 3, 12, 7.1, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const ev = v.slider('EV use (kWh/100 km)', 12, 30, 20.6, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const life = v.slider('car life (1000 km)', 50, 400, 243, { step: 1, fmt: (x) => `${x} 000 km` });
        const sA = v.stage({ x: [0, 400], y: [0, 100], axes: 'box', gutter: true, height: 350, weight: 1.6, minWidth: 340, xlabel: 'distance driven (1000 km)', ylabel: 'cumulative emissions (t CO₂e)' });
        const sB = v.stage({ x: [0, 3.2], y: [0, 120], axes: 'box', gutter: true, height: 350, weight: 1, minWidth: 260, xlabel: 'whole life', ylabel: 'g CO₂e per km', xticks: [[0.8, 'petrol'], [2.2, 'battery']] });
        const m = () => {
          const mE = M_GLIDER_EV + bat.value * KGKWH_BATT / 1, eI = KG_L * ice.value / 100, eE = ev.value / 100 * grid.value / 1000; // t, kg/km, kg/km
          const mEV = mE, d = eI > eE ? (mEV - M_ICE) * 1000 / (eI - eE) : Infinity; // km
          return { mEV, eI, eE, d, batt: bat.value * KGKWH_BATT };
        };
        v.render(() => {
          const c = m(), L = life.value, top = Math.max(100, 1.1 * (M_ICE + c.eI * life.max * 0 + c.eI * 400 / 1000 * 1000 / 1000));
          const petrol = (k) => M_ICE + c.eI * k;       // k in 1000 km → t (kg/km × 1000 km = t)
          const evl = (k) => c.mEV + c.eE * k;
          sA.setView([0, 400], [0, Math.max(petrol(400), evl(400)) * 1.06]);
          sA.vband(L, 400, { color: 'muted', alpha: 0.08 }); sA.vline(L, { color: 'muted', width: 1.4, dash: true });
          sA.fn(petrol, { color: 'orange', width: 3, domain: [0, 400] }); sA.fn(evl, { color: 'green', width: 3, domain: [0, 400] });
          sA.dot(0, M_ICE, { r: 5, color: 'orange' }); sA.dot(0, c.mEV, { r: 5, color: 'green' });
          sA.textPx(`petrol car: ${v.fix(M_ICE, 1)} t to build`, sA.X(4), sA.Y(M_ICE) + 14, { size: 11, weight: 650, color: 'orange', align: 'left' });
          sA.textPx(`battery car: ${v.fix(c.mEV, 1)} t to build`, sA.X(4), sA.Y(c.mEV) - 11, { size: 11, weight: 650, color: 'green', align: 'left' });
          if (isFinite(c.d) && c.d / 1000 < 400) { const k = c.d / 1000; sA.dot(k, petrol(k), { r: 7, color: 'ink' }); sA.textPx(`break-even ${grp(c.d)} km`, sA.X(k) + 10, sA.Y(petrol(k)) + 16, { size: 12, weight: 700, color: 'ink', align: 'left', plate: true }); }
          else sA.textPx(isFinite(c.d) ? `break-even at ${grp(c.d)} km` : 'never breaks even', sA.X(398), sA.Y(petrol(200)) - 4, { size: 12, weight: 700, color: 'red', align: 'right', plate: true });
          sA.textPx('car life', sA.X(L) + 5, sA.Y(0) - 12, { size: 10.5, color: 'muted', align: 'left' });
          // bars of life-cycle g/km at the chosen life
          const km = L * 1000, parts = [[M_ICE * 1e6 / km, 'muted', 'production'], [0, 'purple', 'battery'], [c.eI * 1000, 'orange', 'petrol']], partsE = [[M_GLIDER_EV * 1e6 / km, 'muted', 'production'], [c.batt * 1e6 / km, 'purple', 'battery'], [c.eE * 1000, 'green', 'electricity']];
          let tp = 0, te = 0, y = 0;
          for (const [h, col] of parts) { sB.rect(0.35, y, 1.25, y + h, { fill: col, fillAlpha: 0.7, color: col, width: 1 }); y += h; } tp = y; y = 0;
          for (const [h, col] of partsE) { sB.rect(1.75, y, 2.65, y + h, { fill: col, fillAlpha: 0.7, color: col, width: 1 }); y += h; } te = y;
          sB.setView([0, 3], [0, Math.max(tp, te) * 1.18]);
          sB.textPx(`${v.fix(tp, 0)} g/km`, sB.X(0.8), sB.Y(tp) - 9, { size: 12, weight: 700, color: 'ink', align: 'center' });
          sB.textPx(`${v.fix(te, 0)} g/km`, sB.X(2.2), sB.Y(te) - 9, { size: 12, weight: 700, color: 'ink', align: 'center' });
          v.legend([['orange', 'petrol car', {}], ['green', 'battery car', {}], ['muted', 'production & recycling', { area: true }], ['purple', 'battery production', { area: true }]]);
        });
        v.readout(() => {
          const c = m(), L = life.value * 1000, tp = M_ICE + c.eI * L / 1000, te = c.mEV + c.eE * L / 1000;
          return `Per km: petrol ${v.fix(c.eI * 1000, 0)} g, battery car ${v.fix(c.eE * 1000, 0)} g at ${v.fix(grid.value, 0)} g/kWh. Break-even: **${isFinite(c.d) ? grp(c.d) + ' km' : 'never'}**. Over ${grp(L)} km the petrol car emits **${v.fix(tp, 1)} t** and the battery car **${v.fix(te, 1)} t** (${te < tp ? v.fix(100 * (1 - te / tp), 0) + '% less' : v.fix(100 * (te / tp - 1), 0) + '% more'}); the battery's ${v.fix(c.batt, 1)} t is ${v.fix(100 * c.batt / te, 0)}% of the electric car's total.`;
        });
      },
    },
  ],
};
