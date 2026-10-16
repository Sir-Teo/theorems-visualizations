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
    // ───────────────────────────────────────────────────────────────────────────────────── 1.2
    {
      num: '1.2', kind: 'Concept', name: 'Primary, final and useful energy: the Sankey diagram',
      statement: String.raw`Energy statistics count the same energy at three stages. **Primary energy** is what is extracted from nature — coal, oil, gas, uranium, sunlight captured, wind, falling water. **Final energy** is what reaches the consumer after refining, generating and distributing — petrol in the tank, electricity at the meter, gas in the pipe. **Useful energy** (or *energy services*) is what the end-use device actually delivers — motion, warmth, light — and everything else is **rejected energy**, almost all of it waste heat.

A **Sankey diagram** draws every flow as a band whose width is proportional to the amount, so that conservation is visible: at every node, the widths entering equal the widths leaving. For the United States in 2024, 94.6 quads of primary energy produced 32.3 quads of services, an overall efficiency of about 34%, and rejected 62.3 quads: 19.2 in power stations alone, and 22.4 in the engines of the transport sector.`,
      idea: String.raw`Each conversion step multiplies the flow by an efficiency below one (a thermal power plant about 35%, a petrol car about 21%, a gas furnace over 90%), and the efficiencies of successive steps multiply, so the overall figure is lower than any single step. Nothing is lost in the first-law sense: the rejected energy leaves as low-temperature heat, which by the second law (Carnot, chapter 2) cannot be turned back into work at the same rate. Counting methods matter too: wind, solar and hydro electricity have no fuel to waste, so under the "captured energy" convention used by the US statistics each kWh counts as 3,412 Btu of primary energy, while under the older fossil-fuel-equivalent convention it counted as about three times more.`,
      caption: String.raw`Hover over any band for its size. The sliders change the efficiency of one conversion while the **energy services delivered stay fixed**: the primary energy needed, and so every upstream band, shrinks or swells. Raise the power-plant efficiency to 60% or the car-and-truck efficiency to 60%, and see which one thins the rejected-energy band more. The second picture is the world's primary energy by source since 1965: drag the year.`,
      deps: ['energy-1.1'],
      refs: ['Tester ch. 1'],
      tags: ['energy flows', 'efficiency'],
      scope: String.raw`Flows are the US 2024 annual averages of the Lawrence Livermore National Laboratory chart (DOE/EIA data); end-use efficiencies are LLNL's estimates (65% residential and commercial, 49% industrial, 21% transportation), not measurements. The sliders keep the mix of fuels and the mix of electricity sources fixed and only rescale it — a simplification.`,
      links: { llnl: 'https://flowcharts.llnl.gov/commodities/energy' },
      viz(v) {
        const SRC = [['solar', 'Solar', 'gold'], ['nuclear', 'Nuclear', 'purple'], ['hydro', 'Hydro', 'teal'], ['wind', 'Wind', 'accent'], ['geo', 'Geothermal', 'red'], ['gas', 'Natural gas', 'blue'], ['coal', 'Coal', 'ink'], ['bio', 'Biomass', 'pink'], ['oil', 'Petroleum', 'orange']];
        const SEC = [['res', 'Residential'], ['com', 'Commercial'], ['ind', 'Industrial'], ['tra', 'Transportation']];
        // LLNL 2024, quads (values read from the published chart)
        const TO_ELEC = { solar: 0.75, nuclear: 8.17, hydro: 0.83, wind: 1.54, geo: 0.05, gas: 13.94, coal: 7.01, bio: 0.32, oil: 0.17 };
        const RETAIL = { res: 5.06, com: 4.95, ind: 3.53, tra: 0.02 };
        const DIRECT = { res: { solar: 0.26, geo: 0.04, gas: 4.58, oil: 0.92, bio: 0.37 }, com: { solar: 0.08, geo: 0.02, gas: 3.46, coal: 0.01, oil: 0.8, bio: 0.17 }, ind: { solar: 0.02, geo: 0.01, gas: 10.9, coal: 0.85, bio: 2.36, oil: 8.73 }, tra: { gas: 1.39, bio: 1.89, oil: 24.97 } };
        const ETA0 = { res: 0.65, com: 0.65, ind: 0.49, tra: 0.21 };
        const NONTH = ['solar', 'hydro', 'wind'];
        const tot0 = (k) => RETAIL[k] + Object.values(DIRECT[k]).reduce((a, b) => a + b, 0);
        const E0 = Object.values(RETAIL).reduce((a, b) => a + b, 0), NT0 = NONTH.reduce((a, k) => a + TO_ELEC[k], 0);
        const TH0 = Object.keys(TO_ELEC).filter((k) => !NONTH.includes(k)).reduce((a, k) => a + TO_ELEC[k], 0), ETH0 = (E0 - NT0) / TH0;
        const view = v.select('picture', [{ value: 'flow', label: 'US energy flow, 2024' }, { value: 'mix', label: 'world primary energy since 1965' }], 'flow', { onChange: () => show() });
        const eth = v.slider('thermal power plants', 0.2, 0.7, ETH0, { step: 0.005, fmt: (x) => v.fix(100 * x, 1) + ' %' });
        const etr = v.slider('transport', 0.1, 0.9, ETA0.tra, { step: 0.005, fmt: (x) => v.fix(100 * x, 0) + ' %' });
        const eind = v.slider('industry', 0.2, 0.95, ETA0.ind, { step: 0.005, fmt: (x) => v.fix(100 * x, 0) + ' %' });
        const ebld = v.slider('buildings', 0.3, 0.97, ETA0.res, { step: 0.005, fmt: (x) => v.fix(100 * x, 0) + ' %' });
        const reset = v.button('Reset to 2024', () => { eth.set(ETH0); etr.set(ETA0.tra); eind.set(ETA0.ind); ebld.set(ETA0.res); });
        const yr = v.slider('year', 1965, 2024, 2024, { step: 1, int: true, fmt: (x) => String(x) });
        const sF = v.stage({ x: [0, 1], y: [0, 1], axes: false, height: 540, full: true, hover: true });
        const sM = v.stage({ x: [1965, 2024], y: [0, 700], axes: 'box', gutter: true, height: 430, full: true, xlabel: 'year', ylabel: 'primary energy (EJ per year)' });
        const show = () => { const f = view.value === 'flow'; sF.el.hidden = !f; sM.el.hidden = f; [eth, etr, eind, ebld, reset].forEach((c) => { (c.el || c).hidden = !f; }); yr.el.hidden = f; };
        show();
        const model = () => {
          const eta = { res: ebld.value, com: ebld.value, ind: eind.value, tra: etr.value };
          const k = {}, S = {}; let E = 0;
          for (const [s] of SEC) { k[s] = ETA0[s] / eta[s]; S[s] = ETA0[s] * tot0(s); E += RETAIL[s] * k[s]; }
          const r = E / E0, NT = NT0 * r, TH = (E - NT) / eth.value, elecIn = NT + TH;
          const toE = {}; for (const key of Object.keys(TO_ELEC)) toE[key] = NONTH.includes(key) ? TO_ELEC[key] * r : TO_ELEC[key] * TH / TH0;
          const links = [];
          for (const [key] of SRC) links.push({ a: key, b: 'elec', v: toE[key] });
          for (const [s] of SEC) {
            links.push({ a: 'elec', b: s, v: RETAIL[s] * k[s], color: 'orange' });
            for (const [key, q] of Object.entries(DIRECT[s])) links.push({ a: key, b: s, v: q * k[s] });
            const T = tot0(s) * k[s]; links.push({ a: s, b: 'svc', v: S[s], color: 'green' }); links.push({ a: s, b: 'rej', v: T - S[s], color: 'gray' });
          }
          links.push({ a: 'elec', b: 'rej', v: elecIn - E, color: 'gray' });
          const prim = Object.values(toE).reduce((a, b) => a + b, 0) + SEC.reduce((a, [s]) => a + Object.values(DIRECT[s]).reduce((x, y) => x + y * k[s], 0), 0);
          const svc = Object.values(S).reduce((a, b) => a + b, 0);
          return { links, prim, svc, rej: prim - svc, elecRej: elecIn - E, E };
        };
        const BASE = (() => { const m = { prim: 0 }; return null; })();
        const fm = (x) => (x >= 10 ? v.fix(x, 1) : v.fix(x, 2));
        v.render(() => {
          if (view.value === 'mix') {
            const i = yr.value - 1965, rows = MIX, EJ = 0.0036;
            const order = [[1, 'Coal', 'ink'], [2, 'Oil', 'orange'], [3, 'Gas', 'blue'], [4, 'Nuclear', 'purple'], [5, 'Hydro', 'teal'], [8, 'Other renewables (incl. biofuels)', 'pink'], [6, 'Wind', 'accent'], [7, 'Solar', 'gold']];
            // stack bottom to top: coal, oil, gas, nuclear, hydro, other renewables, wind, solar
            const val = (r, idx) => (idx === 8 ? r[8] + r[9] : r[idx]) * EJ;
            let base = rows.map(() => 0);
            for (const [idx, , col] of order) {
              const top = rows.map((r, j) => base[j] + val(r, idx));
              const pts = rows.map((r, j) => [r[0], top[j]]).concat(rows.map((r, j) => [r[0], base[j]]).reverse());
              sM.poly(pts, { fill: col, fillAlpha: 0.72, color: col, width: 0.8 });
              base = top;
            }
            sM.vline(yr.value, { color: 'ink', width: 1.4, dash: true });
            v.legend(order.map(([, n, c]) => [c, n, { area: true }]));
            return;
          }
          const m = model();
          const W = sF.W, f = clamp(W / 920, 0.62, 1), lw = Math.round(112 * f), bw = Math.round(100 * f), rw = Math.round(98 * f), ew = Math.round(76 * f);
          const c3 = W - rw - 10, avail = c3 - lw, scale = (sF.H - 28 - 8 * 7 - 34) / 94.6;
          const nodes = {};
          for (const [id, name, col] of SRC) nodes[id] = { label: name, color: col, w: 12, force: true };
          nodes.elec = { label: 'Electricity\ngeneration', color: 'muted', box: true, w: ew, top: 10 };
          for (const [id, name] of SEC) nodes[id] = { label: name, color: 'muted', box: true, w: bw };
          nodes.rej = { label: 'Rejected\nenergy', color: 'gray', box: true, w: rw, top: 10 };
          nodes.svc = { label: 'Energy\nservices', color: 'green', box: true, w: rw };
          const R = sankey(v, sF, {
            cols: [SRC.map((x) => x[0]), ['elec'], SEC.map((x) => x[0]), ['rej', 'svc']], cx: [lw, lw + 0.27 * avail, lw + 0.62 * avail, c3], nodeW: 12, scale, gap: 7, top: 10, minPitch: [15, 0, 0, 0], nodes, links: m.links,
            side: ['l', 'r', 'r', 'r'], size: Math.round(11.5 * (0.9 + 0.1 * f) * 10) / 10, fmt: (x) => fm(x),
            tip: (l) => `${l.A.label.replace('\n', ' ')} → ${l.B.label.replace('\n', ' ')}: ${v.fix(l.v, 2)} quads (${v.fix(100 * l.v / m.prim, 1)}% of primary)`,
          });
          sF.textPx('quads of energy per year', sF.W - 10, sF.H - 8, { size: 11, color: 'muted', align: 'right' });
          sF.textPx(`total primary ${fm(m.prim)} quads`, 12, sF.H - 8, { size: 11.5, weight: 700, color: 'ink', align: 'left', halo: false });
        });
        v.readout(() => {
          if (view.value === 'mix') {
            const r = MIX[yr.value - 1965], tot = r[10], fossil = r[1] + r[2] + r[3], pct = (x) => v.fix(100 * x / tot, 0);
            return `**${yr.value}**: ${v.fix(tot * 0.0036, 0)} EJ in total (${v.fix(tot * 1e12 / 8766 / 1e12, 1)} TW of average power). Coal ${pct(r[1])}%, oil ${pct(r[2])}%, gas ${pct(r[3])}% — fossil fuels ${pct(fossil)}%; nuclear ${pct(r[4])}%, hydro ${pct(r[5])}%, wind and solar ${pct(r[6] + r[7])}%, other renewables ${pct(r[8] + r[9])}%.\nSubstitution method: hydro, nuclear, wind and solar are counted as the fossil fuel that would produce the same electricity; traditional biomass (firewood, dung) is not included.`;
          }
          const m = model(), b = 94.61, eff = m.svc / m.prim;
          return `Primary **${v.fix(m.prim, 1)} quads** → services **${v.fix(m.svc, 1)}** (always the same) + rejected **${v.fix(m.rej, 1)}** (${v.fix(100 * m.rej / m.prim, 0)}% of primary; power stations alone ${v.fix(m.elecRej, 1)}). Overall efficiency **${v.fix(100 * eff, 1)}%**; primary energy is ${m.prim < b - 0.05 ? v.fix(100 * (1 - m.prim / b), 0) + '% below' : m.prim > b + 0.05 ? v.fix(100 * (m.prim / b - 1), 0) + '% above' : 'equal to'} the 2024 value of 94.6.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.3
    {
      num: '1.3', kind: 'Concept', name: 'Power density of energy sources',
      statement: String.raw`The **power density** of an energy source is the average power it delivers per unit of land (or sea) it occupies, in W/m² (equivalently MW/km²). It converts a country's demand into an area: to supply a power $P$ from a source of density $\rho$ one needs
$$A = \frac{P}{\rho}.$$
Published medians span almost four orders of magnitude, from several hundred W/m² for nuclear and gas plants (counting their safety zones, pads and pipelines) through about 9 W/m² for utility-scale solar and 1.5 W/m² for onshore wind, to under 0.1 W/m² for biomass. A country's own **demand density** — its average primary power divided by its land area — is typically between 0.3 and 3 W/m². Where demand density is comparable to a source's supply density, that source would need most of the country.`,
      idea: String.raw`Concentrated sources (a fuel burned in a small boiler, a chain reaction in a small core) can deliver kilowatts through every square metre of the plant, and the land is dominated by safety zones and mining. Renewable flows are *spread out by nature*: sunlight reaches the ground at roughly a hundred or two watts per square metre on average and a cell turns a fraction of it into electricity; wind turbines must stand several rotor diameters apart or they steal each other's wind (chapter 5); photosynthesis stores well under 1% of the sunlight as biomass. So the land needed scales as $P/\rho$ and is set by physics and engineering, not by how many machines are built. Densities depend strongly on the boundary drawn around a site, which is why the published ranges are wide.`,
      caption: String.raw`The left panel shows the median power density of each source on a log axis, with the chosen country's average demand density as a gold line. The right panel draws, to scale and **concentrically**, the square of land each source alone would need to supply the chosen share of that country's primary energy, inside a square of the country's own area (dashed). Squares that spill out of the view are labelled with how many times the country they would cover. Change the country and the share: for the Netherlands even wind farms cannot fit.`,
      deps: ['energy-1.1'],
      refs: ['MacKay ch. 18'],
      tags: ['power density', 'land use'],
      scope: String.raw`Power densities are medians of published studies compiled by Nøland et al. (2022) and depend on the area boundary used (nuclear and gas including safety areas and pipelines; solar PV including the spacing between panels; hydro on reservoir surface). The picture compares the *thermal-equivalent primary energy* of a country with the *electricity* each source would produce, so it overstates the areas for sources that would also replace the losses of fossil heat engines (chapter 1.2). Offshore wind uses sea, not land.`,
      viz(v) {
        const SRC = [['Nuclear', 587.17, 'purple'], ['Natural gas', 350.37, 'blue'], ['Solar thermal (CSP)', 14.45, 'orange'], ['Solar PV (utility)', 9.13, 'gold'], ['Geothermal', 5.56, 'red'], ['Hydro (reservoir)', 4.26, 'teal'], ['Offshore wind', 3.84, 'accent'], ['Onshore wind', 1.49, 'green'], ['Biomass', 0.08, 'pink']];
        const C = Object.fromEntries(COUNTRIES.map((c) => [c[0], c]));
        const NAMES = ['United Kingdom', 'Germany', 'Netherlands', 'Japan', 'United States', 'China', 'India'];
        const ctry = v.select('country', NAMES.map((n) => ({ value: n, label: n.replace('United Kingdom', 'UK').replace('United States', 'USA') })), 'United Kingdom');
        const share = v.slider('share of primary energy supplied', 0.05, 1, 1, { step: 0.05, fmt: (x) => v.fix(100 * x, 0) + ' %' });
        const s1 = v.stage({ x: [0.04, 6000], y: [-0.2, 9.2], xlog: true, axes: 'box', gutter: true, height: 430, weight: 1, minWidth: 300, xlabel: 'median power density (W/m²)', yticks: [], xticks: [[0.1, '0.1'], [1, '1'], [10, '10'], [100, '100'], [1000, '1000']] });
        const s2 = v.stage({ x: [-1, 1], y: [-1, 1], equal: true, axes: false, height: 430, weight: 1.15, minWidth: 320 });
        const geo = () => { const c = C[ctry.value]; const P = c[3] * 1e12 / 8766, A = c[5] * 1e6; return { P, A, km2: c[5], d: P / A, name: ctry.value, year: c[2] }; };
        const need = (g, rho) => share.value * g.P / rho / 1e6; // km²
        v.render(() => {
          const g = geo();
          SRC.forEach(([name, rho, col], i) => {
            const y = 8 - i;
            s1.rect(0.04, y - 0.34, rho, y + 0.34, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
            s1.textPx(`${name}  ${rho >= 10 ? v.fix(rho, 0) : rho >= 1 ? v.fix(rho, 1) : v.fix(rho, 2)}`, s1.X(rho) + 7, s1.Y(y), { size: 11.5, weight: 600, color: 'ink', align: 'left' });
          });
          s1.vline(g.d, { color: 'gold', width: 2.2, dash: true });
          s1.textPx(`${g.name === 'United Kingdom' ? 'UK' : g.name === 'United States' ? 'USA' : g.name} demand ${v.fix(g.d, 2)} W/m²`, s1.X(g.d) + 6, s1.Y(-0.2) - 12, { size: 11.5, weight: 700, color: 'gold', align: 'left', plate: true });
          // squares, concentric, in km
          const half = Math.sqrt(g.km2) * 0.85;
          s2.setView([-half, half], [-half, half]);
          const sides = SRC.map(([name, rho, col]) => ({ name, col, a: need(g, rho), s: Math.sqrt(need(g, rho)) })).sort((p, q) => q.s - p.s);
          s2.clip(() => {
            for (const q of sides) s2.rect(-q.s / 2, -q.s / 2, q.s / 2, q.s / 2, { fill: q.col, fillAlpha: 0.13, color: q.col, width: 1.8 });
          });
          const cs = Math.sqrt(g.km2);
          s2.rect(-cs / 2, -cs / 2, cs / 2, cs / 2, { color: 'ink', width: 2.2, dash: true, stroke: true });
          s2.text(`${g.name}: ${grp(g.km2)} km²`, -half * 0.97, half * 0.93, { size: 12, weight: 700, color: 'ink', align: 'left' });
          let yPx = s2.Y(half) + 38;
          for (const q of sides) {
            const inside = q.s / 2 < half * 0.98, mult = q.a / g.km2;
            const txt = `${q.name}: ${q.a >= 100 ? grp(q.a) : v.fix(q.a, 1)} km²  (${mult >= 10 ? v.fix(mult, 0) : mult >= 1 ? v.fix(mult, 1) : v.fix(100 * mult, mult < 0.01 ? 2 : 1) + ' %'}${mult >= 1 ? '× the country' : ' of the country'})`;
            const x = inside ? s2.X(-q.s / 2) + 6 : s2.X(-half) + 8, top = inside ? s2.Y(q.s / 2) + 11 : 0;
            yPx = Math.max(yPx + 0, top, yPx);
            s2.textPx(txt, s2.W - 10, yPx + 14, { size: 11, weight: 600, color: q.col === 'gold' ? 'gold' : q.col, align: 'right' });
            yPx += 15;
          }
        });
        v.legend([['gold', 'average demand density', { dash: true }], ['ink', 'country (same area)', { dash: true }]]);
        v.readout(() => {
          const g = geo(), nm = (n) => SRC.find((s) => s[0] === n);
          const pv = need(g, nm('Solar PV (utility)')[1]), wd = need(g, nm('Onshore wind')[1]), nu = need(g, nm('Nuclear')[1]);
          return `${g.name}, ${g.year}: primary energy ${grp(C[ctry.value][3])} TWh/yr = **${v.fix(g.P / 1e9, 0)} GW** on **${grp(g.km2)} km²** of land, a demand density of **${v.fix(g.d, 2)} W/m²**. Supplying ${v.fix(100 * share.value, 0)}% of it takes ${grp(nu)} km² of nuclear (${v.fix(100 * nu / g.km2, 2)}% of the country), ${grp(pv)} km² of solar PV (${v.fix(100 * pv / g.km2, 1)}%), ${grp(wd)} km² of onshore wind (${v.fix(100 * wd / g.km2, 0)}%).`;
        });
      },
    },
  ],
};
