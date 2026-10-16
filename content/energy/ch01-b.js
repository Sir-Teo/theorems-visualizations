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
//     and ranges 164–199 (EU), 239–357 (US), 509–622 (China), 561–746 (India); the picture uses the midpoints of the ranges (each range spans the IEA STEPS and SDS scenarios; the midpoint is a simplification of this page, not an ICCT figure).
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
//     capita rose 15-fold. Direct rebound in road transport: Dimitropoulos, Oueslati & Sintek, Energy Economics 75: 163–179 (2018): about
//     10–12% in the short run and 26–29% in the long run (meta-analysis of 74 studies; the 12%/32% figures belong to the 2016 OECD working-paper version).
//     Fouquet & Pearson page range is given as 139–177 by most catalogues (one repository lists 138–178).
//   1.10 EIA "U.S. Field Production of Crude Oil" (MCRFPUS2), annual 1900–2024 including Alaska; Hubbert, "Nuclear Energy and the
//     Fossil Fuels", API Drilling and Production Practice, Spring Meeting, San Antonio (1956): ultimate US recovery (48 states incl. offshore;
//     150 = about 130 onshore + 20 offshore) of 150 billion barrels with peak about 1965, or 200 billion with peak about 1970 (checked against the text, October 2026).
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
      scope: String.raw`Values are for the 2021 European lower-medium car segment (ICCT); other segments, countries and years differ, and the grid mix changes during a car's life (the ICCT numbers are lifetime averages for cars registered in 2021). Grid intensities include the construction of power plants and grid losses; "midpoint" presets are midpoints of ICCT's ranges, which span two IEA scenarios (stated policies and sustainable development); the midpoint is a simplification, not an ICCT result.`,
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
        const zoom = v.select('horizontal axis', [{ value: 'life', label: 'whole life' }, { value: 'zoom', label: 'first 60 000 km' }], 'life');
        const sA = v.stage({ x: [0, 400], y: [0, 100], axes: 'box', gutter: true, height: 350, weight: 1.6, minWidth: 340, xlabel: 'distance driven (1000 km)', ylabel: 'cumulative emissions (t CO₂e)' });
        const sB = v.stage({ x: [0, 3.2], y: [0, 120], axes: 'box', gutter: true, height: 350, weight: 1, minWidth: 260, xlabel: 'whole life', ylabel: 'g CO₂e per km', xticks: [[0.8, 'petrol'], [2.2, 'battery']] });
        const m = () => {
          const mE = M_GLIDER_EV + bat.value * KGKWH_BATT / 1, eI = KG_L * ice.value / 100, eE = ev.value / 100 * grid.value / 1000; // t, kg/km, kg/km
          const mEV = mE, d = eI > eE ? (mEV - M_ICE) * 1000 / (eI - eE) : Infinity; // km
          return { mEV, eI, eE, d, batt: bat.value * KGKWH_BATT };
        };
        v.render(() => {
          const c = m(), L = life.value, X1 = zoom.value === 'zoom' ? 60 : Math.max(L * 1.15, 60);
          const petrol = (k) => M_ICE + c.eI * k;       // k in 1000 km → t (kg/km × 1000 km = t)
          const evl = (k) => c.mEV + c.eE * k;
          sA.setView([0, X1], [0, Math.max(petrol(X1), evl(X1), c.mEV) * 1.12]);
          if (L < X1) { sA.vband(L, X1, { color: 'muted', alpha: 0.08 }); sA.vline(L, { color: 'muted', width: 1.4, dash: true }); sA.textPx('car life', sA.X(L) + 5, sA.Y(0) - 12, { size: 10.5, color: 'muted', align: 'left' }); }
          sA.fn(petrol, { color: 'orange', width: 3, domain: [0, X1] }); sA.fn(evl, { color: 'green', width: 3, domain: [0, X1] });
          sA.dot(0, M_ICE, { r: 5, color: 'orange' }); sA.dot(0, c.mEV, { r: 5, color: 'green' });
          sA.textPx('petrol car', sA.X(X1) - 8, sA.Y(petrol(X1)) + 16, { size: 12, weight: 700, color: 'orange', align: 'right' });
          sA.textPx('battery car', sA.X(X1) - 8, sA.Y(evl(X1)) - 12, { size: 12, weight: 700, color: 'green', align: 'right' });
          const k = c.d / 1000;
          if (isFinite(k) && k < X1) { sA.dot(k, petrol(k), { r: 7, color: 'ink' }); sA.textPx(`break-even ${grp(c.d)} km`, sA.X(k) + 12, sA.Y(petrol(k)) - 20, { size: 12, weight: 700, color: 'ink', align: 'left', plate: true }); }
          else sA.textPx(isFinite(k) ? `break-even at ${grp(c.d)} km (off the chart)` : 'never breaks even', sA.X(X1) - 8, sA.Y(petrol(X1 * 0.35)) - 10, { size: 12, weight: 700, color: 'red', align: 'right', plate: true });
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
          return `Per km: petrol ${v.fix(c.eI * 1000, 0)} g, battery car ${v.fix(c.eE * 1000, 0)} g at ${v.fix(grid.value, 0)} g/kWh. Production: petrol ${v.fix(M_ICE, 1)} t, battery car ${v.fix(c.mEV, 1)} t. Break-even: **${isFinite(c.d) ? grp(c.d) + ' km' : 'never'}**. Over ${grp(L)} km the petrol car emits **${v.fix(tp, 1)} t** and the battery car **${v.fix(te, 1)} t** (${te < tp ? v.fix(100 * (1 - te / tp), 0) + '% less' : v.fix(100 * (te / tp - 1), 0) + '% more'}); the battery's ${v.fix(c.batt, 1)} t is ${v.fix(100 * c.batt / te, 0)}% of the electric car's total.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.8
    {
      num: '1.8', kind: 'Law', name: 'The Kaya identity',
      statement: String.raw`Carbon-dioxide emissions from energy are, by definition, the product of four factors:
$$\underbrace{\text{CO}_2}_{\text{emissions}} \;=\; \underbrace{P}_{\text{population}} \times \underbrace{\frac{\text{GDP}}{P}}_{\text{affluence}} \times \underbrace{\frac{E}{\text{GDP}}}_{\text{energy intensity}} \times \underbrace{\frac{\text{CO}_2}{E}}_{\text{carbon intensity}},$$
where $E$ is primary energy. Taking logarithms and time derivatives turns the product into a sum, so the growth rate of emissions is the sum of the four growth rates, and to cut emissions by a given factor the factors must change by a combined factor of that size. Between 1990 and 2022 the world's population grew by 51%, GDP per person by 101%, energy per unit of GDP fell by 42% and carbon per unit of energy by 6%: the product is a 65% increase in fossil-fuel CO$_2$ (from 22.7 to 37.5 Gt). The same factors explain differences between countries: average power use per person ranges from about 0.1 kW to over 10 kW and rises roughly in step with income.`,
      idea: String.raw`The identity is an accounting trick — multiply and divide by the same quantities — and so it holds exactly for any region and any year; its value is that each factor is a *separate lever* with a different owner: demographers (population), economists and societies (affluence), engineers and efficiency policy (energy per GDP), and the energy supply mix (carbon per energy). Its limit is just as important: the factors are not independent. Richer people use more energy, so affluence and energy intensity are linked, and a policy that cuts one factor by pricing carbon moves the others too. The picture below therefore never claims causality; it asks which combinations of multipliers on the four factors would halve emissions.`,
      caption: String.raw`**Kaya factors, world:** the four factors and their product as indices (1990 = 100) on a log axis, from real data; every change in emissions is the sum of the four lines' changes. **Scenario:** set a multiplier for each factor between 2022 and a future date (bars on a log scale; the black bar is their product, the emissions multiplier) — the buttons repeat the 1990–2022 trend or solve for the carbon intensity needed to halve emissions with the other factors unchanged. **Countries:** average power use per person against income or the Human Development Index, one dot per country (click one).`,
      deps: ['energy-1.1'],
      refs: ['Tester ch. 1'],
      tags: ['Kaya identity', 'emissions', 'decomposition'],
      credit: 'Y. Kaya, 1990',
      scope: String.raw`An identity: exact whenever the four quantities are measured consistently. Its use for projection assumes the factors can be set independently, which they cannot. World GDP is in 2011 international dollars (purchasing-power parity, Maddison Project 2023); energy is primary energy by the substitution method, and CO$_2$ is from fossil fuels and cement only.`,
      viz(v) {
        const view = v.select('picture', [{ value: 'world', label: 'world factors 1990–2022' }, { value: 'scn', label: 'scenario multipliers' }, { value: 'cty', label: 'countries (power per person)' }], 'world', { onChange: () => show() });
        const mP = v.slider('population ×', 0.7, 1.6, 1, { step: 0.01, fmt: (x) => '×' + v.fix(x, 2) });
        const mG = v.slider('GDP per person ×', 0.5, 4, 1, { log: true, sig: 3, fmt: (x) => '×' + v.fix(x, 2) });
        const mE = v.slider('energy per GDP ×', 0.1, 1.5, 1, { log: true, sig: 3, fmt: (x) => '×' + v.fix(x, 2) });
        const mC = v.slider('carbon per energy ×', 0.02, 1.5, 1, { log: true, sig: 3, fmt: (x) => '×' + v.fix(x, 2) });
        const b1 = v.button('Repeat 1990–2022 trends (28 years)', () => { const f = 28 / 32, r = tr(); mP.set(r.P ** f); mG.set(r.G ** f); mE.set(r.E ** f); mC.set(r.C ** f); });
        const b2 = v.button('Halve emissions with carbon intensity alone', () => { mP.set(1); mG.set(1); mE.set(1); mC.set(0.5); });
        const b3 = v.button('Reset', () => { mP.set(1); mG.set(1); mE.set(1); mC.set(1); });
        const xs = v.select('x axis', [{ value: 'gdp', label: 'GDP per person' }, { value: 'hdi', label: 'Human Development Index' }], 'gdp');
        const sW = v.stage({ x: [1990, 2037], y: [40, 260], ylog: true, axes: 'box', gutter: true, height: 400, full: true, xlabel: 'year (points are the years with GDP data)', ylabel: 'index, 1990 = 100', xticks: [1990, 2000, 2010, 2022], yticks: [[50, '50'], [100, '100'], [150, '150'], [200, '200']] });
        const sS = v.stage({ x: [0.4, 5.6], y: [0.04, 4], ylog: true, axes: 'box', gutter: true, height: 400, full: true, ylabel: 'multiplier relative to 2022', xticks: [[1, 'population'], [2, 'GDP per person'], [3, 'energy per GDP'], [4, 'carbon per energy'], [5, 'CO₂ emissions']], yticks: [[0.05, '×0.05'], [0.1, '×0.1'], [0.2, '×0.2'], [0.5, '×0.5'], [1, '×1'], [2, '×2'], [4, '×4']] });
        const sC = v.stage({ x: [400, 150000], y: [0.04, 16], xlog: true, ylog: true, axes: 'box', gutter: true, height: 440, full: true, xlabel: 'GDP per person (2011 int. $, PPP), 2022', ylabel: 'primary power per person (kW)', hover: false, yticks: [[0.1, '0.1 kW'], [0.2, '0.2'], [0.5, '0.5'], [1, '1 kW'], [2, '2'], [5, '5'], [10, '10 kW']], xticks: [[500, '500'], [1000, '1,000'], [2000, '2,000'], [5000, '5,000'], [10000, '10,000'], [20000, '20,000'], [50000, '50,000'], [100000, '100,000']] });
        const show = () => { const k = view.value; sW.el.hidden = k !== 'world'; sS.el.hidden = k !== 'scn'; sC.el.hidden = k !== 'cty'; [mP, mG, mE, mC].forEach((c) => (c.el.hidden = k !== 'scn')); [b1, b2, b3].forEach((b) => (b.hidden = k !== 'scn')); xs.el.hidden = k !== 'cty'; };
        show();
        // world factors
        const F = KAYA.map(([y, P, G, E, C]) => ({ y, P, g: G * 1e9 / (P * 1e6), e: E * 1e12 / (G * 1e9), c: C * 1e6 / (E * 1e12), C }));
        const F0 = F[0], FN = F[F.length - 1];
        const tr = () => ({ P: FN.P / F0.P, G: FN.g / F0.g, E: FN.e / F0.e, C: FN.c / F0.c });
        const trendNow = () => { const f = 28 / 32, r = tr(); mP.set(r.P ** f); mG.set(r.G ** f); mE.set(r.E ** f); mC.set(r.C ** f); };
        trendNow();
        const world = [['P', 'population', 'green', (f) => f.P], ['g', 'GDP per person', 'orange', (f) => f.g], ['e', 'energy per GDP', 'teal', (f) => f.e], ['c', 'carbon per energy', 'purple', (f) => f.c]];
        const idx = (f, get) => 100 * get(f) / get(F0);
        // countries
        const WORLD_KW = (KAYA[KAYA.length - 1][3] * 1e12) / (KAYA[KAYA.length - 1][1] * 1e6) / 8766 / 1000;
        const cls = (h) => (h >= 0.8 ? 'accent' : h >= 0.7 ? 'teal' : h >= 0.55 ? 'orange' : 'red');
        const rows = CS22.map(([n, iso, kwh, gdp, hdi, pop]) => ({ n, iso, kwh, kw: kwh / 8766, gdp, hdi, pop }));
        let pick = 'United States';
        sC.onClick((x, y) => {
          let best = null, bd = 22; for (const r of rows) { const X = xs.value === 'gdp' ? sC.X(r.gdp) : sC.X(r.hdi), d = Math.hypot(X - sC.X(x), sC.Y(r.kw) - sC.Y(y)); if (d < bd) { bd = d; best = r; } }
          if (best) pick = best.n;
        });
        v.render(() => {
          const k = view.value;
          if (k === 'world') {
            for (const [, name, col, get] of world) { const pts = F.map((f) => [f.y, idx(f, get)]); sW.path(pts, { color: col, width: 2.2 }); sW.dots(pts, { r: 3.4, color: col }); }
            const co = F.map((f) => [f.y, 100 * f.C / F0.C]); sW.path(co, { color: 'ink', width: 3.4 }); sW.dots(co, { r: 4, color: 'ink' });
            sW.hline(100, { color: 'faint', width: 1.2, dash: true });
            const ends = [...world.map(([, name, col, get]) => ({ y: idx(FN, get), t: name, col })), { y: 100 * FN.C / F0.C, t: 'CO₂ emissions', col: 'ink' }].sort((a, b) => a.y - b.y);
            const ds = [...ends].sort((a, b) => a.y - b.y); let prev = 1e9; for (const e of ds) { e.Y = Math.min(sW.Y(e.y), prev - 14); prev = e.Y; }
            for (const e of ds) sW.textPx(`${e.t} ${v.fix(e.y, 0)}`, sW.X(2022) + 10, e.Y, { size: 12, weight: 700, color: e.col, align: 'left' });
            v.legend([['green', 'population', {}], ['orange', 'GDP per person', {}], ['teal', 'energy per GDP', {}], ['purple', 'carbon per energy', {}], ['ink', 'CO₂ emissions = product of the four', {}]]);
          } else if (k === 'scn') {
            const vals = [mP.value, mG.value, mE.value, mC.value]; const prod = vals.reduce((a, b) => a * b, 1);
            const cols = ['green', 'orange', 'teal', 'purple'];
            vals.forEach((x, i) => { sS.rect(i + 1 - 0.32, 1, i + 1 + 0.32, x, { fill: cols[i], fillAlpha: 0.6, color: cols[i], width: 1.4 }); sS.textPx('×' + v.fix(x, x < 0.1 ? 3 : 2), sS.X(i + 1), sS.Y(x) + (x >= 1 ? -12 : 14), { size: 12, weight: 700, color: cols[i], align: 'center' }); });
            sS.rect(5 - 0.32, 1, 5 + 0.32, prod, { fill: prod <= 0.5 ? 'green' : 'ink', fillAlpha: 0.65, color: prod <= 0.5 ? 'green' : 'ink', width: 1.8 });
            sS.textPx('×' + v.fix(prod, prod < 0.1 ? 3 : 2), sS.X(5), sS.Y(prod) + (prod >= 1 ? -12 : 14), { size: 13, weight: 800, color: prod <= 0.5 ? 'green' : 'ink', align: 'center' });
            sS.hline(1, { color: 'ink', width: 1.4 }); sS.hline(0.5, { color: 'red', width: 1.6, dash: true });
            sS.textPx('half of today’s emissions', sS.X(5.6) - 6, sS.Y(0.5) - 9, { size: 11.5, weight: 650, color: 'red', align: 'right' });
          } else {
            const gdp = xs.value === 'gdp';
            sC.setScale({ xlog: gdp, x: gdp ? [400, 150000] : [0.35, 1.02] }); sC.setLabels(gdp ? 'GDP per person (2011 int. $, PPP), 2022' : 'Human Development Index (UNDP), 2022', undefined); sC.setTicks(gdp ? [[500, '500'], [1000, '1,000'], [2000, '2,000'], [5000, '5,000'], [10000, '10,000'], [20000, '20,000'], [50000, '50,000'], [100000, '100,000']] : [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], undefined);
            const X = (r) => (gdp ? r.gdp : r.hdi);
            sC.hline(WORLD_KW, { color: 'muted', width: 1.4, dash: true });
            sC.textPx(`world average ${v.fix(WORLD_KW, 1)} kW`, sC.X(gdp ? 150000 : 1.02) - 8, sC.Y(WORLD_KW) - 9, { size: 11, color: 'muted', align: 'right' });
            for (const r of [...rows].sort((a, b) => b.pop - a.pop)) sC.dot(X(r), r.kw, { r: clamp(3 + Math.sqrt(r.pop) / 3.2, 3, 9), color: cls(r.hdi), ring: false });
            const sel = rows.find((r) => r.n === pick);
            const big = [...rows].sort((a, b) => b.pop - a.pop).slice(0, 9).map((r) => r.n);
            const labs = rows.filter((r) => big.includes(r.n) || r.n === pick || ['Qatar', 'Iceland', 'Canada', 'Norway', 'Singapore'].includes(r.n)).map((r) => ({ x: X(r), y: r.kw, text: r.n === 'United States' ? 'USA' : r.n === 'United Kingdom' ? 'UK' : r.n === 'Democratic Republic of Congo' ? 'DR Congo' : r.n, color: r.n === pick ? 'ink' : 'muted', size: r.n === pick ? 12.5 : 10.5, weight: r.n === pick ? 800 : 500, r: clamp(3 + Math.sqrt(r.pop) / 3.2, 3, 9) }));
            placeLabels(v, sC, labs);
            if (sel) sC.dot(X(sel), sel.kw, { r: clamp(3 + Math.sqrt(sel.pop) / 3.2, 3, 9) + 3, hollow: true, color: 'ink' });
            v.legend([['red', 'HDI < 0.55', { dot: true }], ['orange', '0.55–0.70', { dot: true }], ['teal', '0.70–0.80', { dot: true }], ['accent', '≥ 0.80', { dot: true }]]);
          }
        });
        v.readout(() => {
          const k = view.value;
          if (k === 'world') {
            const g = (a) => 100 * (a - 1), t = tr(), pr = t.P * t.G * t.E * t.C;
            return `1990 → 2022: population ${g(t.P) >= 0 ? '+' : '−'}${v.fix(Math.abs(g(t.P)), 0)}%, GDP per person +${v.fix(g(t.G), 0)}%, energy per GDP −${v.fix(-g(t.E), 0)}%, carbon per energy −${v.fix(-g(t.C), 0)}%. Product ${v.fix(pr, 3)} = emissions ratio ${v.fix(FN.C / F0.C, 3)} (${v.fix(F0.C / 1e3, 1)} → ${v.fix(FN.C / 1e3, 1)} Gt CO₂). Per year: ${world.map(([, n, , get]) => `${n} ${v.fix(100 * ((get(FN) / get(F0)) ** (1 / 32) - 1), 2)}%`).join(', ')}.`;
          }
          if (k === 'scn') {
            const prod = mP.value * mG.value * mE.value * mC.value, E = FN.C / 1e3 * prod;
            return `Combined multiplier **×${v.fix(prod, 3)}** → ${v.fix(E, 1)} Gt CO₂ a year (2022: ${v.fix(FN.C / 1e3, 1)}). ${prod <= 0.5 ? 'That halves emissions.' : `To halve emissions the product must be 0.5; with the other three as set, carbon intensity would have to be ×${v.fix(0.5 / (mP.value * mG.value * mE.value), 3)}.`} For scale: from 1990 to 2022 the product of the four rose to ×${v.fix(FN.C / F0.C, 2)}.`;
          }
          const r = rows.find((q) => q.n === pick);
          const lx = rows.map((q) => Math.log(xs.value === 'gdp' ? q.gdp : q.hdi)), ly = rows.map((q) => Math.log(q.kw)), fit = v.M.linreg(xs.value === 'gdp' ? lx : rows.map((q) => q.hdi), ly);
          return `**${r.n}**: ${grp(r.kwh)} kWh of primary energy per person per year = **${v.fix(r.kw, 2)} kW** (${v.fix(r.kwh / 365.25, 0)} kWh/day), GDP per person ${grp(r.gdp)} \\$, HDI ${v.fix(r.hdi, 3)}; ${v.fix(r.kw / WORLD_KW, 2)}× the world average. Across the ${rows.length} countries ${xs.value === 'gdp' ? `power per person scales as GDP per person to the power ${v.fix(fit.slope, 2)}` : `ln(power) rises by ${v.fix(fit.slope * 0.1, 2)} for every 0.1 of HDI`} (R² = ${v.fix(fit.r2, 2)}).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.9
    {
      num: '1.9', kind: 'Paradox', name: 'Jevons paradox (the rebound effect)',
      statement: String.raw`Making a machine more efficient lowers the energy needed per unit of service (per kilometre, per lumen-hour), and so lowers the *price* of that service — and cheaper service is used more. Let efficiency rise by a factor $f$, let energy be a share $\alpha$ of the cost of the service, and let demand for the service have constant price elasticity $\varepsilon$. The service price falls to $p/p_0 = (1-\alpha) + \alpha/f$, demand rises to $S/S_0 = (p/p_0)^{-\varepsilon}$ and the energy used becomes
$$\frac{E}{E_0} = \frac{1}{f}\,\frac{S}{S_0}, \qquad \text{so for } \alpha = 1:\ \ \frac{E}{E_0} = f^{\,\varepsilon-1}.$$
The **rebound effect** is the fraction of the expected saving $1 - 1/f$ that is lost to extra use. If $\varepsilon < 1$ the saving is partly eaten (rebound below 100%); if $\varepsilon > 1$ total energy use *rises* — **backfire**, the paradox William Stanley Jevons described for British coal in 1865. Measured direct rebound is modest for mature services (a meta-analysis of road transport finds about 10–12% in the short run and 26–29% in the long run), but historic lighting shows how demand can explode: from 1800 to 2000 the price of lighting in the UK fell below a three-thousandth while per-capita use rose 6,500-fold.`,
      idea: String.raw`The paradox is just the arithmetic of a product: energy $=$ (energy per unit service) $\times$ (units of service). Efficiency shrinks the first factor by $1/f$; if the second grows faster than $f$, the product grows. Whether it does depends on how much unmet appetite there is for the service (elasticity) and how much of the cost is energy (the share $\alpha$ — for services where energy is a small part of the cost, a cheaper-energy effect is diluted). Satiated services (heating a room to a comfortable temperature, a refrigerator) have elasticities near zero and the rebound is small; services far from saturation (light in 1800, computing, flying) can have elasticities above one. Fouquet and Pearson's numbers imply $\ln 6500/\ln 3000 \approx 1.1$, though income grew fifteenfold too, so this is an upper bound for the price effect alone.`,
      caption: String.raw`Left: energy use after an efficiency gain $f$ (log axis) for several demand elasticities; the dashed line is what engineers would predict with no rebound, $1/f$. Set your own $\varepsilon$ and energy cost share, or pick a case, and drag $f$. Right: the demand curve (service used against how many times cheaper it became) with the UK lighting record of 1800–2000: its straight line has slope about 1.1.`,
      deps: ['energy-1.8'],
      refs: ['MacKay ch. 19'],
      tags: ['rebound', 'efficiency', 'Jevons'],
      credit: 'W. S. Jevons, The Coal Question, 1865',
      scope: String.raw`A partial-equilibrium, constant-elasticity model of the *direct* rebound for one service. It ignores indirect rebound (money saved is spent on other energy-using goods), economy-wide effects and saturation, so real elasticities fall as demand saturates; the lighting point mixes the price effect with a fifteenfold rise in income.`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Jevons_paradox' },
      viz(v) {
        const CASES = { sat: ['saturated service (ε = 0)', 0], car1: ['car travel, short run (rebound ≈ 10–12%)', 0.11], car2: ['car travel, long run (≈ 26–29%)', 0.28], unit: ['unit elasticity (ε = 1)', 1], light: ['lighting 1800–2000 (ε ≈ 1.1)', Math.log(6500) / Math.log(3000)] };
        const cs = v.select('case', [...Object.entries(CASES).map(([k, c]) => ({ value: k, label: c[0] })), { value: 'free', label: 'free' }], 'car2', { onChange: (k) => { if (CASES[k]) eps.set(CASES[k][1]); } });
        const f = v.slider('efficiency gain f', 1, 10, 2, { log: true, sig: 3, fmt: (x) => '×' + v.fix(x, 2) });
        const eps = v.slider('demand elasticity ε', 0, 1.6, 0.28, { step: 0.01, fmt: (x) => v.fix(x, 2), onChange: () => { const m = Object.entries(CASES).find(([, c]) => Math.abs(c[1] - eps.value) < 0.006); cs.set(m ? m[0] : 'free'); } });
        const al = v.slider('energy share of service cost α', 0.1, 1, 1, { step: 0.05, fmt: (x) => v.fix(100 * x, 0) + ' %' });
        const sA = v.stage({ x: [1, 10], y: [0.05, 3], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1.1, minWidth: 320, xlabel: 'efficiency gain f', ylabel: 'energy used ÷ energy before', xticks: [[1, '×1'], [2, '×2'], [3, '×3'], [5, '×5'], [10, '×10']], yticks: [[0.1, '0.1'], [0.2, '0.2'], [0.5, '0.5'], [1, '1'], [2, '2']] });
        const sB = v.stage({ x: [1, 10000], y: [1, 30000], xlog: true, ylog: true, axes: 'box', gutter: true, height: 380, weight: 1, minWidth: 300, xlabel: 'how many times cheaper the service became', ylabel: 'how many times more is used', xticks: [[1, '1'], [10, '10'], [100, '100'], [1000, '1,000'], [10000, '10⁴']], yticks: [[1, '1'], [10, '10'], [100, '100'], [1000, '1,000'], [10000, '10⁴']] });
        const model = (ff, e, a) => { const p = (1 - a) + a / ff, S = p ** -e, E = S / ff, R = ff > 1 ? 1 - (1 - E) / (1 - 1 / ff) : 0; return { p, S, E, R }; };
        v.render(() => {
          const e0 = eps.value, a = al.value;
          sA.hline(1, { color: 'ink', width: 1.2 });
          sA.fn((x) => 1 / x, { color: 'muted', width: 1.8, dash: true, domain: [1, 10] });
          sA.textPx('no rebound: 1/f', sA.X(10) - 6, sA.Y(0.1) + 14, { size: 11, color: 'muted', align: 'right' });
          for (const e of [0, 0.5, 1, 1.5]) { sA.fn((x) => model(x, e, a).E, { color: 'faint', width: 1.4, domain: [1, 10] }); sA.textPx(`ε = ${e}`, sA.X(10) - 5, sA.Y(model(10, e, a).E) - 9, { size: 10.5, color: 'muted', align: 'right' }); }
          sA.fn((x) => model(x, e0, a).E, { color: model(f.value, e0, a).E > 1 ? 'red' : 'accent', width: 3.2, domain: [1, 10] });
          const m = model(f.value, e0, a);
          sA.dot(f.value, m.E, { r: 7, color: m.E > 1 ? 'red' : 'accent' });
          sA.dot(f.value, 1 / f.value, { r: 5, color: 'muted', hollow: true });
          sA.vband(1, 10, { color: m.E > 1 ? 'red' : 'green', alpha: 0.0 });
          sA.text(m.E > 1 ? 'backfire: more energy than before' : 'net energy saving', 1.12, m.E > 1 ? 2.4 : 0.07, { size: 11.5, weight: 700, color: m.E > 1 ? 'red' : 'green', align: 'left' });
          // demand curve
          sB.fn((x) => x ** e0, { color: 'accent', width: 3, domain: [1, 10000] });
          const ei = Math.log(6500) / Math.log(3000);
          sB.line(1, 1, 3000, 6500, { color: 'orange', width: 2, dash: true });
          sB.dot(3000, 6500, { r: 7, color: 'orange', label: 'UK lighting, 1800 → 2000', labelPos: 'nw' });
          sB.textPx(`slope ${v.fix(ei, 2)}`, sB.X(30), sB.Y(30 ** ei) - 10, { size: 11.5, weight: 650, color: 'orange', align: 'left' });
          sB.textPx(`ε = ${v.fix(e0, 2)}`, sB.X(10000) - 8, sB.Y(10000 ** e0) - 10, { size: 11.5, weight: 700, color: 'accent', align: 'right' });
          v.legend([['accent', 'energy use / demand curve for your ε', {}], ['muted', 'savings expected without rebound', { dash: true }], ['orange', 'UK lighting record (Fouquet & Pearson 2006)', { dash: true }]]);
        });
        v.readout(() => {
          const m = model(f.value, eps.value, al.value);
          return `Efficiency ×${v.fix(f.value, 2)}: price of the service ×${v.fix(m.p, 2)}, use of the service ×${v.fix(m.S, 2)}, **energy ×${v.fix(m.E, 2)}** (no rebound would give ×${v.fix(1 / f.value, 2)}). Rebound **${v.fix(100 * m.R, 0)}%** of the expected saving${m.E > 1 ? ' — more than 100%: backfire, the Jevons paradox' : ''}.${eps.value > 1 && al.value === 1 ? '' : ' With α = 100% and ε > 1 the energy used would rise with every efficiency gain.'}`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.10
    {
      num: '1.10', kind: 'Model', name: 'Hubbert curve of resource depletion',
      statement: String.raw`M. King Hubbert modelled the extraction of a finite resource as a **logistic** growth of the cumulative production $Q(t)$ towards the ultimately recoverable resource $Q_\infty$:
$$Q(t) = \frac{Q_\infty}{1 + e^{-k(t - t_m)}}, \qquad P(t) = \frac{dQ}{dt} = k\,Q\Bigl(1 - \frac{Q}{Q_\infty}\Bigr),$$
so the yearly production $P(t)$ is a symmetric bell, with its peak $P_{\max} = kQ_\infty/4$ in the year $t_m$ when half of the resource has been produced. A graph of $P/Q$ against $Q$ is then a straight line from $k$ down to zero at $Q_\infty$ (the "Hubbert linearisation"). In 1956 Hubbert applied this with a resource estimate of 150–200 billion barrels for the lower 48 US states and predicted that US oil production would peak between 1965 and 1970. It peaked in 1970 at 9.6 million barrels a day (EIA, including Alaska) and fell for 38 years — and then, after 2008, rose to a new record of 13.3 million barrels a day in 2024 from shale (tight) oil, a resource that was not in the original estimate.`,
      idea: String.raw`The logistic equation says production is proportional both to what has been found and exploited so far (infrastructure, knowledge: the factor $Q$) and to what is left (the factor $1 - Q/Q_\infty$): early on production grows exponentially, later it must decline because the easiest oil is gone. Because the curve is the derivative of a logistic function, the peak falls at the half-way point and the rise and the fall mirror each other. The model's prediction is only as good as its input $Q_\infty$ — Hubbert took it from geological estimates — and the hypothesis that $Q_\infty$ is fixed. A new technology or higher prices can change what counts as recoverable, which is exactly what happened with horizontal drilling and hydraulic fracturing.`,
      caption: String.raw`Dots are US crude oil production by year (EIA); bright dots are the data the fit may use, grey ones are the "future". Drag the **data cut-off year** (1956 is Hubbert's) and choose how the curve is set: with a **fixed** ultimate resource (his method — try 150 and 200 Gb) the slider fits the peak year and steepness to the data so far; with **fitted** all three parameters are found from the data. Move the cut-off to 1975 or 2008 and then to 2024 and watch the prediction collapse. The right panel is the Hubbert linearisation: a straight line means a logistic.`,
      deps: ['ode-1.6'],
      refs: ['Tester ch. 2'],
      tags: ['depletion', 'logistic', 'peak oil'],
      credit: 'M. K. Hubbert, 1956',
      scope: String.raw`Applies to a single finite, homogeneous resource with a fixed recoverable total and production limited by depletion rather than by demand, policy or technology. The data are US production including Alaska and offshore (EIA), whereas Hubbert's 1956 estimate concerned the United States as it then was (the 48 states with offshore areas, before Alaskan oil); cumulative production before 1900 (under 1 Gb) is ignored.`,
      links: { eia: 'https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=MCRFPUS2&f=A' },
      viz(v) {
        const yrs = CRUDE.map((r) => r[0]), mbd = CRUDE.map((r) => r[1] / 1000), gb = mbd.map((x) => x * 365.25 / 1000);
        const Q = []; gb.reduce((a, g, i) => (Q[i] = a + g), 0);
        const t0 = 1900, tN = 2024;
        const cut = v.slider('data cut-off year', 1930, 2024, 1956, { step: 1, int: true, fmt: (x) => String(x) });
        const mode = v.select('ultimate resource', [{ value: 'fixed', label: 'fixed (Hubbert’s method)' }, { value: 'fit', label: 'fitted to the data' }], 'fixed');
        const urr = v.slider('ultimate recovery Q∞ (Gb)', 100, 500, 200, { step: 5, fmt: (x) => grp(x) + ' Gb' });
        const b1 = v.button('Hubbert 1956: 150 Gb', () => { cut.set(1956); mode.set('fixed'); urr.set(150); });
        const b2 = v.button('Hubbert 1956: 200 Gb', () => { cut.set(1956); mode.set('fixed'); urr.set(200); });
        const sA = v.stage({ x: [1900, 2070], y: [0, 15], axes: 'box', gutter: true, height: 400, weight: 1.5, minWidth: 340, xlabel: 'year', ylabel: 'US crude oil production (million barrels per day)' });
        const sB = v.stage({ x: [0, 500], y: [0, 0.14], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 300, xlabel: 'cumulative production Q (Gb)', ylabel: 'P / Q (per year)', xticks: [0, 100, 200, 300, 400, 500], yticks: [[0, '0'], [0.04, '4%'], [0.08, '8%'], [0.12, '12%']] });
        const model = (t, U, tm, k) => { const e = Math.exp(-k * (t - tm)); return U * k * e / (1 + e) ** 2 * 1000 / 365.25; }; // Mb/d
        const cache = new Map();
        const fit = (c, U, free) => {
          const key = `${c}|${free ? 'f' : U}`; if (cache.has(key)) return cache.get(key);
          const n = c - t0 + 1, Qc = Q[n - 1];
          const sse = (x) => {
            const Uu = free ? Math.exp(x[0]) : U, tm = free ? x[1] : x[0], k = Math.exp(free ? x[2] : x[1]);
            if (Uu < Qc * 0.999 || k > 0.5) return 1e9; let s = 0; for (let i = 0; i < n; i++) { const d = model(yrs[i] + 0.5, Uu, tm, k) - mbd[i]; s += d * d; } return s + (free ? 0 : 0);
          };
          let best = null;
          for (const dt of [0, 15, 40]) for (const kk of [0.04, 0.09]) {
            const x0 = free ? [Math.log(Math.max(Qc * 1.6, 120)), c + dt, Math.log(kk)] : [c + dt, Math.log(kk)];
            const r = v.M.nelderMead(sse, x0, { step: free ? [0.3, 8, 0.3] : [8, 0.3], maxIt: 1200, tol: 1e-12 });
            if (!best || r.fx < best.fx) best = r;
          }
          const out = free ? { U: Math.exp(best.x[0]), tm: best.x[1], k: Math.exp(best.x[2]), ok: best.fx < 1e8 } : { U, tm: best.x[0], k: Math.exp(best.x[1]), ok: best.fx < 1e8 };
          cache.set(key, out); return out;
        };
        const cur = () => { const c = cut.value, free = mode.value === 'fit'; urr.el.hidden = free; const f = fit(c, urr.value, free); return { c, f, Qc: Q[c - t0] }; };
        v.render(() => {
          const { c, f, Qc } = cur();
          // data
          const past = [], fut = [];
          yrs.forEach((y, i) => (y <= c ? past : fut).push([y + 0.5, mbd[i]]));
          sA.vline(c + 0.5, { color: 'muted', width: 1.2, dash: true });
          if (f.ok) { const pts = []; for (let t = 1900; t <= 2070; t += 1) pts.push([t, model(t, f.U, f.tm, f.k)]); sA.path(pts, { color: 'accent', width: 3 }); }
          sA.dots(fut, { r: 3, color: 'faint' }); sA.dots(past, { r: 3.6, color: 'ink' });
          if (f.ok) { const pk = f.k * f.U / 4 * 1000 / 365.25; sA.dot(f.tm, pk, { r: 6, color: 'accent', hollow: true }); sA.textPx(`predicted peak ${v.fix(pk, 1)} Mb/d in ${v.fix(f.tm, 0)}`, sA.X(f.tm) + 12, sA.Y(pk) - 4, { size: 11.5, weight: 700, color: 'accent', align: f.tm > 2020 ? 'right' : 'left', plate: true }); }
          sA.textPx('data used', sA.X(c + 0.5) - 6, sA.Y(14.2), { size: 11, color: 'ink', align: 'right' }); sA.textPx('"future"', sA.X(c + 0.5) + 6, sA.Y(14.2), { size: 11, color: 'muted', align: 'left' });
          // linearisation
          const lp = [], lf = []; yrs.forEach((y, i) => { if (y >= 1920) (y <= c ? lp : lf).push([Q[i], gb[i] / Q[i]]); });
          sB.dots(lf, { r: 3, color: 'faint' }); sB.dots(lp, { r: 3.6, color: 'ink' });
          if (f.ok) { sB.line(0, f.k, f.U, 0, { color: 'accent', width: 3 }); sB.dot(f.U, 0, { r: 6, color: 'accent', label: `Q∞ = ${grp(f.U)} Gb`, labelPos: 'ne' }); sB.vline(Qc, { color: 'muted', width: 1.2, dash: true }); }
          v.legend([['ink', 'data up to the cut-off', { dot: true }], ['faint', 'later data (not used)', { dot: true }], ['accent', 'Hubbert curve / line', {}]]);
        });
        v.readout(() => {
          const { c, f, Qc } = cur(); const act = mbd.reduce((b, x, i) => (yrs[i] <= c && x > b[0] ? [x, yrs[i]] : b), [0, 0]);
          if (!f.ok) return `No logistic with Q∞ ≥ the ${v.fix(Qc, 0)} Gb already produced fits these data: raise Q∞.`;
          const pk = f.k * f.U / 4 * 1000 / 365.25;
          return `Produced by ${c}: **${v.fix(Qc, 0)} Gb**; fit: Q∞ = ${grp(f.U)} Gb, peak in **${v.fix(f.tm, 0)}** at ${v.fix(pk, 1)} Mb/d, k = ${v.fix(f.k, 3)}/yr (the half-resource point is ${f.U / 2 > Qc ? 'still ahead' : 'passed'}). Highest production so far in the data: ${v.fix(act[0], 1)} Mb/d in ${act[1]}. Actual: peak 9.6 Mb/d in 1970, new record ${v.fix(mbd[mbd.length - 1], 1)} Mb/d in 2024; the whole 1900–2024 total is ${v.fix(Q[Q.length - 1], 0)} Gb, already ${Q[Q.length - 1] > 200 ? 'above' : 'near'} Hubbert's high estimate for the lower 48 plus Alaska.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.11
    {
      num: '1.11', kind: 'Law', name: 'Learning curves (Wright’s and Swanson’s laws)',
      statement: String.raw`**Wright's law** (T. P. Wright, 1936, who found it in the labour needed per aircraft) says that the unit cost of a manufactured product falls by a constant fraction, the **learning rate** $\text{LR}$, every time the cumulative number of units produced doubles:
$$C(Q) = C_0\left(\frac{Q}{Q_0}\right)^{-b}, \qquad \text{LR} = 1 - 2^{-b}.$$
On log–log axes it is a straight line of slope $-b$. **Swanson's law** (named after SunPower's founder Richard Swanson, who showed such curves for years before the name appeared around 2012; Wright's law applied to solar) is the same statement for solar photovoltaic modules, with a rule of thumb of about 20% per doubling of cumulative shipments. For the world's solar module price (in 2025 dollars) between 1975 and 2024 the data give a price that fell from about \$132 to \$0.27 per watt (a factor of nearly 500) while cumulative capacity grew from about 0.5 MW to 1.9 TW — roughly 22 doublings — a fitted learning rate of about 23%. Extrapolating a learning curve is an assumption about the future, not a law of nature: the learning rate is not constant and the fit says nothing about *why* prices fell.`,
      idea: String.raw`Cost falls as a firm and an industry learn by doing — better processes, yields, materials, designs — as scale lowers fixed costs per unit, and as research is paid for by volume. If each doubling of experience removes the same fraction of cost, then the cost is a power of cumulative output, $C \propto Q^{-b}$, and the number $b$ (or LR) summarises how fast a technology learns. Doubling takes ever more units, so a fixed learning rate means ever slower price fall in calendar time unless the market keeps growing exponentially, as solar did. The statistical caveat is that cumulative production and time both rise steadily, so a straight line in price against cumulative output cannot by itself prove learning-by-doing; it is nevertheless the best simple forecasting tool known for technology costs.`,
      caption: String.raw`Dots are the world solar module price against cumulative installed capacity (OWID: Nemet 2009, Farmer & Lafond 2016, IRENA). Choose the **fit window** with the two year sliders to read off the learning rate, or pick a **manual** rate, and extend the line to the cumulative capacity you set: the readout gives the predicted module price. The lower chart shows the learning rate measured over every 10-year window, to see how stable "about 20% per doubling" really is.`,
      deps: ['energy-1.1'],
      refs: ['Tester ch. 5'],
      tags: ['learning curve', 'cost', 'solar'],
      credit: 'T. P. Wright, 1936',
      scope: String.raw`An empirical regularity, not a law of physics: it describes past price decline as a function of cumulative production for many manufactured goods, with learning rates from a few per cent to 30% or more. Extrapolation fails when the technology nears its material or physical floor, when learning stops, or when price is set by something other than cost (the 2005–2008 bump in module prices is visible in the data).`,
      links: { wikipedia: 'https://en.wikipedia.org/wiki/Experience_curve_effects' },
      viz(v) {
        const D = SOLAR_PV.filter((r) => r[1] > 0), N = D.length, Y0 = D[0][0], Y1 = D[N - 1][0];
        const y0 = v.slider('fit window: from year', 1975, 2015, 1975, { step: 1, int: true, fmt: (x) => String(x) });
        const y1 = v.slider('to year', 1990, 2024, 2024, { step: 1, int: true, fmt: (x) => String(x) });
        const src = v.select('line for the extrapolation', [{ value: 'fit', label: 'fitted learning rate' }, { value: 'man', label: 'manual' }], 'fit');
        const lr = v.slider('manual learning rate', 0.05, 0.4, 0.2, { step: 0.005, fmt: (x) => v.fix(100 * x, 1) + ' %' });
        const tgt = v.slider('cumulative capacity to reach', 2e6, 1e8, 1e7, { log: true, sig: 2, fmt: (x) => (x >= 1e6 ? v.fix(x / 1e6, x < 1e7 ? 1 : 0) + ' TW' : v.fix(x / 1e3, 0) + ' GW') });
        const sA = v.stage({ x: [0.5, 2e8], y: [0.1, 250], xlog: true, ylog: true, axes: 'box', gutter: true, height: 400, weight: 1.3, minWidth: 340, xlabel: 'cumulative installed capacity', ylabel: 'module price (2025 $ per watt)', xticks: [[1, '1 MW'], [10, '10'], [100, '100'], [1e3, '1 GW'], [1e4, '10'], [1e5, '100'], [1e6, '1 TW'], [1e7, '10'], [1e8, '100 TW']], yticks: [[0.1, '0.1'], [0.2, '0.2'], [0.5, '0.5'], [1, '1'], [2, '2'], [5, '5'], [10, '10'], [20, '20'], [50, '50'], [100, '100']] });
        const sB = v.stage({ x: [1985, 2024], y: [0, 0.5], axes: 'box', gutter: true, height: 400, weight: 1, minWidth: 300, xlabel: 'end year of the 10-year window', ylabel: 'learning rate per doubling', yticks: [[0, '0'], [0.1, '10%'], [0.2, '20%'], [0.3, '30%'], [0.4, '40%'], [0.5, '50%']] });
        const reg = (a, b) => { const rows = D.filter((r) => r[0] >= a && r[0] <= b); if (rows.length < 3) return null; const f = v.M.linreg(rows.map((r) => Math.log2(r[2])), rows.map((r) => Math.log2(r[1]))); return { slope: f.slope, icpt: f.intercept, r2: f.r2, LR: 1 - 2 ** f.slope, n: rows.length }; };
        const roll = []; for (let Y = 1985; Y <= Y1; Y++) { const f = reg(Y - 9, Y); if (f) roll.push([Y, f.LR]); }
        const cur = () => { const a = Math.min(y0.value, y1.value - 3), f = reg(a, y1.value); return { a, f }; };
        v.render(() => {
          const { a, f } = cur(), last = D[N - 1];
          const inW = D.filter((r) => r[0] >= a && r[0] <= y1.value), out = D.filter((r) => r[0] < a || r[0] > y1.value);
          if (f) {
            const line = (q) => 2 ** (f.icpt + f.slope * Math.log2(q));
            const qa = inW[0][2], qb = inW[inW.length - 1][2];
            sA.path([[0.5, line(0.5)], [2e8, line(2e8)]], { color: 'accent', width: 1.4, dash: true, alpha: 0.6 });
            sA.path([[qa, line(qa)], [qb, line(qb)]], { color: 'accent', width: 3.4 });
            // extrapolation from the last data point
            const b = src.value === 'fit' ? f.slope : Math.log2(1 - lr.value), p = (q) => last[1] * (q / last[2]) ** b;
            sA.path([[last[2], last[1]], [2e8, p(2e8)]], { color: 'orange', width: 2.6, dash: true });
            const pt = p(tgt.value); sA.dot(tgt.value, pt, { r: 7, color: 'orange', label: `${pt < 0.1 ? v.fix(pt, 3) : v.fix(pt, 2)} $/W`, labelPos: 'nw' }); sA.vline(tgt.value, { color: 'orange', width: 1, dash: true, alpha: 0.6 });
          }
          sA.dots(out.map((r) => [r[2], r[1]]), { r: 3.4, color: 'faint' }); sA.dots(inW.map((r) => [r[2], r[1]]), { r: 4, color: 'ink' });
          const lab = [1975, 1990, 2005, 2010, 2024].map((y) => D.find((r) => r[0] === y)).filter(Boolean).map((r) => ({ x: r[2], y: r[1], text: String(r[0]), color: 'muted', size: 11, r: 4 }));
          placeLabels(v, sA, lab);
          // rolling learning rate
          sB.hline(0.2, { color: 'faint', width: 1.4, dash: true }); sB.textPx('“20% per doubling”', sB.X(2024) - 6, sB.Y(0.2) + 11, { size: 11, color: 'muted', align: 'right' });
          sB.path(roll, { color: 'teal', width: 3 }); sB.dots(roll, { r: 3, color: 'teal' });
          if (f) { sB.hline(f.LR, { color: 'accent', width: 1.8 }); sB.textPx(`your window: ${v.fix(100 * f.LR, 0)}%`, sB.X(2024) - 6, sB.Y(f.LR) - 9, { size: 11.5, weight: 700, color: 'accent', align: 'right' }); }
          sB.textPx('each point: 10 years of data ending that year', sB.X(2024) - 6, sB.Y(0.02), { size: 10.5, color: 'muted', align: 'right' });
          v.legend([['ink', 'prices in the fit window', { dot: true }], ['faint', 'other years', { dot: true }], ['accent', 'fitted learning curve', {}], ['orange', 'extrapolation from 2024', { dash: true }]]);
        });
        v.readout(() => {
          const { a, f } = cur(), last = D[N - 1];
          if (!f) return 'Choose a window of at least four years.';
          const b = src.value === 'fit' ? f.slope : Math.log2(1 - lr.value), pt = last[1] * (tgt.value / last[2]) ** b, nd = Math.log2(tgt.value / last[2]);
          const all = reg(Y0, Y1), full = Math.log2(D[N - 1][2] / D[0][2]);
          return `Window ${a}–${y1.value}: learning rate **${v.fix(100 * f.LR, 1)}%** per doubling (price ∝ capacity^${v.fix(f.slope, 3)}, R² = ${v.fix(f.r2, 3)}, ${f.n} years). Whole record ${Y0}–${Y1}: ${v.fix(100 * all.LR, 1)}% over ${v.fix(full, 1)} doublings (${v.fix(D[0][1], 0)} → ${v.fix(last[1], 2)} \\$/W). Extrapolating with ${src.value === 'fit' ? 'the fitted' : 'the manual'} ${v.fix(100 * (1 - 2 ** b), 1)}%: ${v.fix(nd, 1)} more doublings (${v.fix(tgt.value / 1e6, 1)} TW cumulative) would bring modules to **${pt < 0.1 ? v.fix(pt, 3) : v.fix(pt, 2)} \\$/W**.`;
        });
      },
    },
  ],
};
