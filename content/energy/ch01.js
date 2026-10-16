// Energy Systems — Chapter 1: Energy, power and scale (items 1.1–1.6; 1.7–1.11 are in ch01-b.js)
//
// Sources (all checked October 2026; shared data and its provenance are described at the top of ch01.shared.js):
//   1.1 Unit definitions: kWh = 3.6 MJ and the thermochemical calorie 4.184 J are exact; Btu(IT) = 1055.05585262 J; 1 toe =
//     41.868 GJ (10 Gcal; Energy Institute / IEA convention); 1 boe = 5.8 million Btu (a convention; EIA's crude oil average is
//     about 5.7); 1 quad = 10^15 Btu. EIA "British thermal units (Btu)" page: 1 kWh = 3,412 Btu, 1 gallon motor gasoline =
//     120,214 Btu (higher heating value). Solar constant 1361 W/m² (Kopp & Lean 2011) × Earth's cross-section π(6371 km)².
//     Power station ratings: Three Gorges 22.5 GW (32 × 700 MW + 2 × 50 MW); Hoover Dam 2.08 GW; EIA/Sargent & Lundy "Capital
//     Cost and Performance Characteristic Estimates for Utility Scale Electric Power Generating Technologies" (Dec 2023):
//     2 × AP1000 = 2,156 MW net, onshore wind reference turbine 2.8 MW. Country and world primary power: OWID energy data
//     (Energy Institute 2025, substitution method) ÷ 8766 h/yr. Hiroshima: 15 kt TNT ≈ 6.3×10¹³ J (conventional yield estimate).
//     EV battery 45 kWh: ICCT 2021 (lower-medium segment, Table 2.4). American's 2022 primary energy: 77,628 kWh (OWID/EI).
//   1.2 LLNL energy flow chart, United States 2024 (July 2026; DOE/EIA SEDS 2026), all link values read from the chart: total
//     94.6 quads, rejected energy 62.27, energy services 32.34; end-use efficiencies 65% residential, 65% commercial, 49%
//     industrial, 21% transportation; non-combustible renewables counted at 3,412 Btu/kWh (captured-energy method). World mix:
//     OWID energy data (Energy Institute Statistical Review 2025), substitution method, 1965–2024.
//   1.3 Median spatial power densities: J. K. Nøland, J. Auxepaules, A. Rousset, B. Perney, G. Falletti, "Spatial energy
//     density of large-scale electricity generation from power sources worldwide", Scientific Reports 12: 21280 (2022),
//     doi:10.1038/s41598-022-25341-9, Tables of median W/m² (nuclear incl. safety area 587; natural gas incl. pipelines and
//     pads 350; solar PV 9.1; onshore wind 1.5; hydro (reservoir surface) 4.3; geothermal 5.6; offshore wind 3.8; CSP 14.5;
//     biomass 0.08, from van Zalk & Behrens 2018). Land area: World Bank AG.LND.TOTL.K2 (2021); demand: OWID/EI 2024.
//   1.4 Capacity factors: hourly 2023 French generation (Energy-Charts / RTE) and the US annual averages of EIA Electric Power
//     Monthly tables 6.07.A/B (released 24 Sep 2026): 2025 nuclear 91.0%, wind 34.2%, utility solar PV 24.4%, coal 48.7%,
//     gas combined cycle 58.4%, hydro 35.3% (2024: 90.8, 34.3, 23.2, 42.6, 60.5, 34.6).
//   1.5 EROI: Brockway, Owen, Brand-Correa & Hardt, Nature Energy 4: 612–621 (2019), Table 1 (published estimates, primary
//     versus final stage) and their global results (fossil primary-stage EROI 37 → 29 and final-stage ≈ 6.8 → 6 over 1995–2011;
//     electricity from fossil fuels ≈ 3); net EROI = gross − 1 (their eq. 1); the net-energy cliff below about 5:1 after
//     Hall, Balogh & Murphy, Energies 2: 25–47 (2009) and Lambert et al. (2013, UK DFID report).
//   1.6 Costs: EIA/Sargent & Lundy overnight capital costs (2023 $/kW), fixed and variable O&M, heat rates (Table 1-2, Dec 2023);
//     EIA Electric Power Monthly capacity factors (tables 6.07.A/B, 2025) and fuel costs (table 4.2: coal delivered to
//     electric utilities $2.49/MMBtu in 2025). Natural gas $3.5/MMBtu and nuclear fuel $0.5/MMBtu are ILLUSTRATIVE inputs.
//     Lazard LCOE+ (June 2025) unsubsidised ranges for comparison: solar PV 38–78 (utility), onshore wind 37–86, gas CC 48–109,
//     coal 71–173, nuclear 141–220 $/MWh.

import { clamp, lerp, textW, sci, grp, ladder, placeLabels, sankey, trapz, EU, PU, YEAR_S, MIX, COUNTRIES, WORLD24, decodeCF, FR23 } from './ch01.shared.js';

export default {
  collection: 'energy',
  chapter: 1,
  title: 'Energy, power and scale',
  summary: String.raw`Thinking clearly about energy starts with units and orders of magnitude: kilowatt-hours per person per day, watts per square metre of land, the fraction of the year a plant actually runs. A few quantitative concepts — power density, capacity factor, energy return on investment, levelised cost and the Kaya identity — make it possible to compare wildly different technologies on one page, and classic results such as Jevons' paradox and Hubbert's curve warn against naive extrapolation.`,
  items: [
    // ───────────────────────────────────────────────────────────────────────────────────── 1.1
    {
      num: '1.1', kind: 'Definition', name: 'Energy and power units across scales',
      statement: String.raw`**Energy** is measured in joules (J); **power**, the rate at which energy is converted or delivered, in watts, $1\ \text{W} = 1\ \text{J/s}$, so that energy $=$ power $\times$ time. Every other unit in use is a fixed multiple of these:

- the **kilowatt-hour**, $1\ \text{kWh} = 3.6\ \text{MJ}$ exactly (electricity bills);
- the **food Calorie** (kilocalorie), $1\ \text{kcal} = 4184\ \text{J}$ exactly;
- the **British thermal unit**, $1\ \text{Btu} = 1055.06\ \text{J}$, and the **quad**, $10^{15}$ Btu $= 1.055\ \text{EJ}$ (US energy statistics);
- the **tonne of oil equivalent**, $1\ \text{toe} = 41.868\ \text{GJ}$, and the **barrel of oil equivalent**, $\approx 5.8$ million Btu $\approx 6.1\ \text{GJ}$ (oil and international statistics; both are conventions, not measurements).

Power is also quoted per day or per year: $1\ \text{kWh/day} = 41.7\ \text{W}$, $1\ \text{toe/yr} = 1.33\ \text{kW}$, $1\ \text{EJ/yr} = 31.7\ \text{GW}$. A kilowatt that runs all year uses $8766$ kWh. Real quantities span more than twenty decades, so comparisons are made on a **logarithmic axis**, where each tick is a factor of ten.`,
      idea: String.raw`Units grew up in separate trades — heat (calorie, Btu), electricity (kWh), oil (barrel, tonne) — and the modern ones are all defined as exact or conventional multiples of the joule, so a conversion is one multiplication. The only conceptual step is energy $=$ power $\times$ time, which turns any energy statistic per year into an average power and back; dividing a country's yearly energy by the hours in a year gives the gigawatts of power stations needed to supply it. Plotting on log axes puts a light bulb and a continent in the same picture.`,
      caption: String.raw`Type an amount (a formula such as 2000*4184 works), pick its unit, or drag the log slider: the readout converts it into every unit, and the gold line shows it on both axes — an energy is also shown as the average power it makes **if spent over one year**, a power as the energy it uses **in one year**. Switch between energy and power and watch a household, a car tank and a country land among the reference objects.`,
      deps: ['mech-3.1'],
      refs: ['MacKay ch. 2', 'Tester ch. 1'],
      tags: ['units', 'scale'],
      scope: String.raw`The kWh, kcal and Btu values are exact definitions; toe and boe are conventions (heating values of real oil vary by a few per cent), and "primary energy" totals depend on the accounting method (the world totals plotted here use the substitution method).`,
      viz(v) {
        const find = (T, id) => T.find((u) => u.id === id);
        const qty = v.select('quantity', [{ value: 'E', label: 'energy' }, { value: 'P', label: 'power' }], 'E', { onChange: (q) => { eu.el.hidden = q === 'P'; pu.el.hidden = q === 'E'; amt.set(q === 'E' ? '1' : '100'); (q === 'E' ? eu : pu).set(q === 'E' ? 'kWh' : 'kWh/d'); fix(); } });
        const eu = v.select('unit', EU.map((u) => ({ value: u.id, label: u.label })), 'kWh', { onChange: () => fix() });
        const pu = v.select('unit', PU.map((u) => ({ value: u.id, label: u.label })), 'kWh/d', { onChange: () => fix() });
        pu.el.hidden = true;
        const amt = v.input('amount', '1', { vars: [], width: 150, onChange: () => linkSlider() });
        const sl = v.slider('log scale', 1e-3, 1e12, 1, { log: true, sig: 3, fmt: (x) => sci(x, 3), onChange: (x) => amt.set(String(+x.toPrecision(3))) });
        const num = () => { const f = amt.fn; const x = f ? f() : NaN; return isFinite(x) && x > 0 ? x : NaN; };
        const linkSlider = () => { const x = num(); if (isFinite(x)) sl.set(clamp(x, 1e-3, 1e12)); };
        const fix = () => linkSlider();
        const unit = () => qty.value === 'E' ? find(EU, eu.value) : find(PU, pu.value);
        const SI = () => num() * unit().f; // joules or watts
        const sE = v.stage({ x: [0.3, 3e21], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 215, full: true, xlabel: 'energy', yticks: [], hover: false,
          xticks: [[1, '1 J'], [1e3, '1 kJ'], [1e6, '1 MJ'], [1e9, '1 GJ'], [1e12, '1 TJ'], [1e15, '1 PJ'], [1e18, '1 EJ'], [1e21, '1 ZJ']] });
        const sP = v.stage({ x: [0.02, 1e18], y: [0, 1], xlog: true, axes: 'box', gutter: true, height: 215, full: true, xlabel: 'power', yticks: [],
          xticks: [[0.1, '0.1 W'], [10, '10 W'], [1e3, '1 kW'], [1e6, '1 MW'], [1e9, '1 GW'], [1e12, '1 TW'], [1e15, '1 PW'], [1e18, '1 EW']] });
        const yrW = (kWh) => kWh * 1e12 / 8766;
        // [value in J, label, colour, note]
        const E = [
          [0.981, 'apple (100 g) lifted 1 m', 'teal', 'm g h = 0.1 kg × 9.81 m/s² × 1 m'],
          [4184, '1 kcal', 'teal', 'exact: thermochemical calorie'],
          [3.6e6, '1 kWh', 'accent', 'exact'],
          [8.37e6, 'a day of food (2000 kcal)', 'teal', '2000 × 4184 J'],
          [3.35e7, '1 litre of petrol', 'teal', 'EIA: 120,214 Btu per US gallon (higher heating value)'],
          [6.12e9, '1 barrel of oil equivalent', 'accent', '5.8 million Btu (convention)'],
          [1.62e8, 'EV battery, 45 kWh', 'teal', 'ICCT 2021 lower-medium car, Table 2.4'],
          [4.1868e10, '1 toe', 'accent', 'IEA/EI convention, 10 Gcal'],
          [2.795e11, 'an American, one year', 'orange', '77,628 kWh of primary energy per person in 2022 (OWID/EI, substitution method)'],
          [6.28e13, 'Hiroshima bomb (15 kt)', 'teal', '15,000 t × 4.184 GJ/t (conventional yield estimate)'],
          [1.055e18, '1 quad', 'accent', '10¹⁵ Btu'],
          [9.98e19, 'USA 2024: 94.6 quad', 'orange', 'LLNL flow chart, 2024'],
          [6.25e20, 'one hour of sunlight on Earth', 'gold', '1361 W/m² × π R⊕² × 3600 s'],
          [6.36e20, 'world primary energy, 1 year', 'orange', '176,737 TWh in 2024 (OWID/EI, substitution method)'],
        ];
        const P = [
          [10, 'LED bulb, 10 W', 'teal', 'typical'],
          [96.9, 'a person: 2000 kcal/day', 'teal', '2000 × 4184 J ÷ 86,400 s'],
          [745.7, '1 horsepower', 'accent', 'mechanical hp, 745.7 W'],
          [2990, 'electric kettle', 'teal', '13 A × 230 V (UK plug fuse limit)'],
          [1e5, 'car engine, 100 kW', 'teal', 'typical rating, ≈ 134 hp'],
          [2.8e6, 'wind turbine, 2.8 MW', 'teal', 'EIA/S&L reference onshore turbine'],
          [1.078e9, 'one AP1000 reactor, 1.1 GW', 'teal', 'EIA/S&L: 2 units = 2,156 MW net'],
          [2.08e9, 'Hoover Dam, 2.08 GW', 'teal', 'installed capacity'],
          [2.25e10, 'Three Gorges, 22.5 GW', 'teal', '32 × 700 MW + 2 × 50 MW'],
          [2.21e11, 'UK primary energy, 221 GW', 'orange', '1,937 TWh/yr ÷ 8766 h (OWID/EI, 2024)'],
          [3.64e11, 'Germany, 365 GW', 'orange', '3,195 TWh/yr ÷ 8766 h (2024)'],
          [3.02e12, 'USA, 3.0 TW', 'orange', '26,529 TWh/yr ÷ 8766 h (2024)'],
          [2.02e13, 'world, 20 TW', 'orange', '176,737 TWh/yr ÷ 8766 h (2024)'],
          [1.735e17, 'sunlight on Earth, 174 PW', 'gold', '1361 W/m² × π R⊕²'],
        ];
        const you = (s, x, text) => {
          if (!(x > s.view.x[0] && x < s.view.x[1])) { s.corner(`you: ${text} (off the scale)`, 'tr', { color: 'gold', weight: 650 }); return; }
          s.vline(x, { color: 'gold', width: 2.2 });
          const X = s.X(x), w = textW(s, text, 12, 700) + 12, L = X + 6 + w > s.W - 4 ? X - 6 - w : X + 6;
          s.textPx(text, L + 6, s.Y(s.view.y[1]) + 12, { size: 12, weight: 700, color: 'gold', plate: true, align: 'left' });
        };
        v.render(() => {
          const q = SI(), isE = qty.value === 'E';
          ladder(v, sE, E.map((e) => ({ x: e[0], text: e[1], color: e[2] })));
          ladder(v, sP, P.map((e) => ({ x: e[0], text: e[1], color: e[2] })));
          if (isFinite(q)) {
            you(sE, isE ? q : q * YEAR_S, isE ? `${sci(q)} J` : `${sci(q * YEAR_S)} J per year`);
            you(sP, isE ? q / YEAR_S : q, isE ? `${sci(q / YEAR_S)} W if spent over a year` : `${sci(q)} W`);
          }
          v.legend([['accent', 'unit definitions', { dot: true }], ['teal', 'everyday scale', { dot: true }], ['orange', 'countries & the world', { dot: true }], ['gold', 'sunlight / your amount', { dot: true }]]);
        });
        v.readout(() => {
          const q = SI(), isE = qty.value === 'E', T = isE ? EU : PU, u = unit();
          if (!isFinite(q)) return 'Type a positive number or a formula (for example 1.5e6/3.6).';
          const f = (x) => sci(x, 3);
          const line = T.filter((o) => o.id !== u.id && o.id !== 'J' && o.id !== 'W').map((o) => `${f(q / o.f)} ${o.label}`).join(' = ');
          const near = (isE ? E : P).reduce((b, e) => (Math.abs(Math.log(e[0] / q)) < Math.abs(Math.log(b[0] / q)) ? e : b));
          const r = q / near[0];
          const a = isE ? `Spent over one year it is ${f(q / YEAR_S)} W on average.` : `Running for one year it uses ${f(q * YEAR_S / 3.6e6)} kWh (${f(q * YEAR_S / 4.1868e10)} toe).`;
          return `**${amt.value} ${u.label}** = ${f(q)} ${isE ? 'J' : 'W'} = ${line}.\n${a} Nearest reference: **${near[1]}** — your amount is ${r >= 1 ? f(r) + '×' : '1/' + f(1 / r)} of it (${near[3]}).`;
        });
      },
    },
  ],
};
