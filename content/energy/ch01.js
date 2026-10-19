// Energy Systems — Chapter 1: Energy, power and scale (items 1.1–1.6; 1.7–1.11 are in ch01-b.js)
//
// Sources (all checked October 2026; shared data and its provenance are described at the top of ch01.shared.js):
//   1.1 Unit definitions: kWh = 3.6 MJ and the thermochemical calorie 4.184 J are exact; Btu(IT) = 1055.05585262 J; 1 toe =
//     41.868 GJ (10 Gcal; Energy Institute / IEA convention); 1 boe = 5.8 million Btu (a convention; Wikipedia quotes EIA as about 5.7 and many industry sources 5.8, so treat as approximate); 1 quad = 10^15 Btu. EIA "British thermal units (Btu)" page: 1 kWh = 3,412 Btu, 1 gallon motor gasoline =
//     120,214 Btu (higher heating value). Solar constant 1361 W/m² (Kopp & Lean 2011) × Earth's cross-section π(6371 km)².
//     Power station ratings: Three Gorges 22.5 GW (32 × 700 MW + 2 × 50 MW); Hoover Dam 2.08 GW; EIA/Sargent & Lundy "Capital
//     Cost and Performance Characteristic Estimates for Utility Scale Electric Power Generating Technologies" (Dec 2023):
//     2 × AP1000 = 2,156 MW net, onshore wind reference turbine 2.8 MW. Country and world primary power: OWID energy data
//     (OWID, substitution-method series that follows the Energy Institute Statistical Review methodology up to its 2024 edition; the Review's own 2025 headline totals use a different, physical-energy-content basis and are lower) ÷ 8766 h/yr. Hiroshima: 15 kt TNT ≈ 6.3×10¹³ J (conventional yield estimate; published estimates differ by a few kt, e.g. 13 kt at Atomic Archive).
//     EV battery 45 kWh: ICCT 2021 (lower-medium segment, Table 2.4). American's 2022 primary energy: 77,628 kWh (OWID/EI).
//   1.2 LLNL energy flow chart, United States 2024 (July 2026; DOE/EIA SEDS 2026), all link values read from the chart: total
//     94.6 quads, rejected energy 62.27, energy services 32.34; end-use efficiencies 65% residential, 65% commercial, 49%
//     industrial, 21% transportation; non-combustible renewables counted at 3,412 Btu/kWh (captured-energy method). World mix:
//     OWID energy data (Energy Institute Statistical Review data, substitution-method series; not the Review's own post-2024 physical-content totals), 1965–2024.
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
//     electricity from fossil fuels ≈ 3); net EROI = gross − 1 (their eq. 1); the net-energy cliff below about 5:1: Brockway et al. attribute the concept to Lambert et al. (2013, UK DFID report) and
//     adapt their Figure 6 from Mearns (2008); the related question of a minimum society-wide EROI is Hall, Balogh & Murphy, Energies 2: 25–47 (2009).
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
      scope: String.raw`The kWh, kcal and Btu values are exact definitions; toe and boe are conventions (heating values of real oil vary by a few per cent), and "primary energy" totals depend on the accounting method (the world totals plotted here use the substitution method, as OWID does; the Energy Institute's own 2025 headline total uses a physical-energy-content basis and is lower).`,
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
          [2.795e11, 'an American, one year', 'orange', '77,628 kWh of primary energy per person in 2022 (OWID, from Energy Institute data, substitution method)'],
          [6.28e13, 'Hiroshima bomb (≈15 kt)', 'teal', '15,000 t × 4.184 GJ/t (conventional estimate; others are a few kt lower or higher)'],
          [1.055e18, '1 quad', 'accent', '10¹⁵ Btu'],
          [9.98e19, 'USA 2024: 94.6 quad', 'orange', 'LLNL flow chart, 2024'],
          [6.25e20, 'one hour of sunlight on Earth', 'gold', '1361 W/m² × π R⊕² × 3600 s'],
          [6.36e20, 'world primary energy, 1 year', 'orange', '176,737 TWh in 2024 (OWID, substitution method; the Energy Institute 2025 headline basis gives a lower total)'],
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
      caption: String.raw`The upper panel shows the median power density of each source on a log axis, with the chosen country's average demand density as a gold line. The lower panel draws, to scale and **concentrically**, the square of land each source alone would need to supply the chosen share of that country's primary energy, inside a square of the country's own area (dashed). Squares bigger than the country are cut off at its edge; the key gives their area and how many countries they would cover. Change the country and the share: for the Netherlands even wind farms cannot fit.`,
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
        const s1 = v.stage({ x: [0.04, 6000], y: [-0.2, 9.2], xlog: true, axes: 'box', gutter: true, height: 340, full: true, xlabel: 'median power density (W/m²)', yticks: [], xticks: [[0.1, '0.1'], [1, '1'], [10, '10'], [100, '100'], [1000, '1000']] });
        const s2 = v.stage({ x: [-1, 3], y: [-1, 1], axes: false, height: 400, full: true });
        const geo = () => { const c = C[ctry.value]; const P = c[3] * 1e12 / 8766, A = c[5] * 1e6; return { P, A, km2: c[5], d: P / A, name: ctry.value, year: c[2] }; };
        const need = (g, rho) => share.value * g.P / rho / 1e6; // km²
        const short = (n) => (n === 'United Kingdom' ? 'UK' : n === 'United States' ? 'USA' : n);
        v.render(() => {
          const g = geo();
          SRC.forEach(([name, rho, col], i) => {
            const y = 8 - i, lab = `${name}  ${rho >= 10 ? v.fix(rho, 0) : rho >= 1 ? v.fix(rho, 1) : v.fix(rho, 2)}`;
            s1.rect(0.04, y - 0.34, rho, y + 0.34, { fill: col, fillAlpha: 0.55, color: col, width: 1.2 });
            const inside = s1.X(rho) - s1.X(0.04) > textW(s1, lab, 11.5, 600) + 24;
            s1.textPx(lab, inside ? s1.X(0.04) + 8 : s1.X(rho) + 7, s1.Y(y), { size: 11.5, weight: 600, color: 'ink', align: 'left', halo: !inside });
          });
          s1.vline(g.d, { color: 'gold', width: 2.2, dash: true });
          const lt = `${short(g.name)} demand ${v.fix(g.d, 2)} W/m²`, lx = clamp(s1.X(g.d) + 6, 4, s1.W - textW(s1, lt, 11.5, 700) - 16);
          s1.textPx(lt, lx, s1.Y(8.9), { size: 11.5, weight: 700, color: 'gold', align: 'left', plate: true });
          // concentric squares (km) on the left, key on the right
          const half = Math.sqrt(g.km2) * 0.85, sq = clamp(s2.W - 250, 190, s2.H), kmpx = (2 * half) / sq;
          s2.setView([-half, -half + s2.W * kmpx], [-half, -half + s2.H * kmpx]);
          const sides = SRC.map(([name, rho, col]) => ({ name, col, a: need(g, rho), s: Math.sqrt(need(g, rho)) })).sort((p, q) => q.s - p.s);
          s2.clip(() => { for (const q of sides) s2.rect(-q.s / 2, -q.s / 2, q.s / 2, q.s / 2, { fill: q.col, fillAlpha: 0.035, color: q.col, width: 2 }); }, [-half, half], [-half, half]);
          const cs = Math.sqrt(g.km2);
          s2.rect(-cs / 2, -cs / 2, cs / 2, cs / 2, { color: 'ink', width: 2.4, dash: true });
          s2.textPx(`${short(g.name)} land: ${grp(g.km2)} km²`, s2.X(0), s2.Y(cs / 2) - 10, { size: 11.5, weight: 700, color: 'ink', align: 'center' });
          // key
          const x0 = sq + 18, rowH = Math.min(46, (s2.H - 20) / sides.length);
          sides.forEach((q, i) => {
            const y = 14 + i * rowH, mult = q.a / g.km2;
            const pct = mult >= 1 ? `${mult >= 10 ? v.fix(mult, 0) : v.fix(mult, 1)}× the whole country` : `${v.fix(100 * mult, mult < 0.01 ? 2 : mult < 0.1 ? 1 : 0)}% of the country`;
            s2.ctx.save(); s2.ctx.fillStyle = v.color(q.col, 0.6); s2.ctx.strokeStyle = v.color(q.col); s2.ctx.lineWidth = 1.6; s2.ctx.fillRect(x0, y + 2, 14, 14); s2.ctx.strokeRect(x0, y + 2, 14, 14); s2.ctx.restore();
            s2.textPx(`${q.name}: ${q.a >= 100 ? grp(q.a) : v.fix(q.a, 1)} km²`, x0 + 22, y + 5, { size: 11.5, weight: 650, color: 'ink', align: 'left' });
            s2.textPx(pct, x0 + 22, y + 20, { size: 11, color: mult >= 1 ? 'red' : 'muted', align: 'left' });
          });
        });
        v.legend([['gold', 'country’s average demand density', { dash: true }], ['ink', 'the country’s land (dashed square)', { dash: true }]]);
        v.readout(() => {
          const g = geo(), nm = (n) => SRC.find((s) => s[0] === n);
          const pv = need(g, nm('Solar PV (utility)')[1]), wd = need(g, nm('Onshore wind')[1]), nu = need(g, nm('Nuclear')[1]);
          return `${g.name}, ${g.year}: primary energy ${grp(C[ctry.value][3])} TWh/yr = **${v.fix(g.P / 1e9, 0)} GW** on **${grp(g.km2)} km²** of land, a demand density of **${v.fix(g.d, 2)} W/m²**. Supplying ${v.fix(100 * share.value, 0)}% of it takes ${grp(nu)} km² of nuclear (${v.fix(100 * nu / g.km2, 2)}% of the country), ${grp(pv)} km² of solar PV (${v.fix(100 * pv / g.km2, 1)}%), ${grp(wd)} km² of onshore wind (${v.fix(100 * wd / g.km2, 0)}%).`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.4
    {
      num: '1.4', kind: 'Definition', name: 'Capacity factor',
      statement: String.raw`The **capacity factor** of a generator over a period is the energy it actually delivered divided by what it would have delivered running at its rated (nameplate) power $P_{\text{rated}}$ the whole time:
$$\text{CF} = \frac{E_{\text{delivered}}}{P_{\text{rated}}\,T} = \frac{\bar P}{P_{\text{rated}}}, \qquad E_{\text{year}} = P_{\text{rated}} \times 8760\ \text{h} \times \text{CF}.$$
It is the average power as a fraction of the peak. For the US power fleet in 2025 (EIA) the annual capacity factors were about 91% for nuclear, 58% for gas combined-cycle plants, 49% for coal, 35% for hydro, 34% for wind and 24% for utility-scale solar PV. A rating in megawatts therefore says little about annual energy until it is multiplied by the capacity factor: 1 GW of nuclear and 3 GW of solar PV deliver about the same energy per year.`,
      idea: String.raw`A plant falls short of its rating for three different reasons. *Resource*: the Sun sets and the wind drops, so a solar farm sits at zero half the hours and at its peak only briefly. *Availability*: refuelling and maintenance outages take even reliable plants offline for weeks. *Dispatch*: a plant that is more expensive than its neighbours is switched on only at times of high demand, so gas and coal capacity factors depend on the market, not the machine. Averaging power over the year turns the hourly output curve into one number; geometrically, the capacity factor is the height of the rectangle spanning the whole year that has the same area as the sorted (duration) curve.`,
      caption: String.raw`Real hourly output of three plant types in France in 2023 (Energy-Charts / RTE), as a fraction of installed capacity. Pick a technology: the calendar shows every hour of the year (days across, hour of day up); drag the week slider to see 168 hours; the right panel sorts all 8760 hours and shades their area — the dashed rectangle with the same area has height equal to the capacity factor. The red line marks the 2025 US average for the same technology.`,
      deps: ['energy-1.1'],
      refs: ['Tester ch. 3'],
      tags: ['capacity factor', 'generation'],
      scope: String.raw`France's 2023 fleet is one data point: its nuclear plants ran well below their usual performance that year (outages and load-following), so the 59% is lower than the 90%+ typical of the US or of France in good years. Capacity factors for wind and solar depend on the site and the technology (tracking, turbine height); the French onshore wind and solar shown here are national averages relative to mid-year installed capacity.`,
      links: { eia: 'https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_6_07_b' },
      viz(v) {
        const DATA = { nuc: decodeCF(FR23.nuc), wind: decodeCF(FR23.wind), sun: decodeCF(FR23.sun) };
        const INFO = { nuc: ['Nuclear (61.4 GW)', 'purple', 0.91, 'US nuclear 2025'], wind: ['Onshore wind (21.3 GW)', 'teal', 0.342, 'US wind 2025'], sun: ['Solar PV (16.2 GW)', 'gold', 0.244, 'US utility solar 2025'] };
        const tech = v.select('plant', [{ value: 'nuc', label: 'nuclear fleet' }, { value: 'wind', label: 'onshore wind' }, { value: 'sun', label: 'solar PV' }], 'wind');
        const wk = v.slider('week starting day', 1, 358, 20, { step: 1, int: true, fmt: (x) => `day ${x}` });
        const cap = v.slider('rated power', 1, 1000, 100, { log: true, sig: 2, fmt: (x) => `${v.fix(x, x < 10 ? 1 : 0)} MW` });
        const sy = v.stage({ x: [0, 365], y: [0, 24], axes: 'box', gutter: true, height: 250, full: true, xlabel: 'day of 2023', ylabel: 'hour of day (local)', yticks: [0, 6, 12, 18, 24], xticks: [[1, 'Jan'], [32, 'Feb'], [60, 'Mar'], [91, 'Apr'], [121, 'May'], [152, 'Jun'], [182, 'Jul'], [213, 'Aug'], [244, 'Sep'], [274, 'Oct'], [305, 'Nov'], [335, 'Dec']] });
        const sw = v.stage({ x: [0, 168], y: [0, 1.05], axes: 'box', gutter: true, height: 270, weight: 1, minWidth: 300, xlabel: 'hours from midnight of the first day', ylabel: 'output ÷ rated power', xticks: [[0, '0'], [24, '24'], [48, '48'], [72, '72'], [96, '96'], [120, '120'], [144, '144'], [168, '168']] });
        const sd = v.stage({ x: [0, 8760], y: [0, 1.05], axes: 'box', gutter: true, height: 270, weight: 1, minWidth: 300, xlabel: 'hours of the year, sorted from best to worst', ylabel: 'output ÷ rated power', xticks: [[0, '0'], [2000, '2000'], [4000, '4000'], [6000, '6000'], [8760, '8760']] });
        const cache = {};
        const stat = (k) => {
          if (cache[k]) return cache[k];
          const a = DATA[k]; let sum = 0, low = 0, high = 0, mx = 0; for (const x of a) { sum += x; if (x < 0.05) low++; if (x > 0.9) high++; if (x > mx) mx = x; }
          const sorted = Float32Array.from(a).sort().reverse();
          return (cache[k] = { mean: sum / a.length, low, high, mx, sorted });
        };
        v.render(() => {
          const k = tech.value, a = DATA[k], st = stat(k), [name, col, us, usn] = INFO[k];
          sy.raster((x, y) => { const d = Math.floor(x), h = Math.floor(y); if (d < 0 || d > 364 || h < 0 || h > 23) return null; return [...v.ramp(Math.min(1, a[d * 24 + h]), col, 'panel'), 1]; }, { res: 1, key: k });
          const d0 = wk.value - 1;
          sy.rect(d0, 0, d0 + 7, 24, { color: 'ink', width: 2 });
          sy.textPx(name, 12, 14, { size: 12, weight: 700, color: 'ink', plate: true });
          // week trace
          const pts = []; for (let i = 0; i < 168; i++) pts.push([i, a[d0 * 24 + i]]);
          const area = [[0, 0], ...pts, [167, 0]];
          sw.poly(area, { fill: col, fillAlpha: 0.3, stroke: false });
          sw.path(pts, { color: col, width: 2 });
          sw.hline(st.mean, { color: 'ink', width: 1.5, dash: true });
          sw.hline(1, { color: 'faint', width: 1.2 });
          sw.textPx(`annual mean ${v.fix(100 * st.mean, 1)}%`, sw.X(167), sw.Y(st.mean) - 9, { size: 11, weight: 600, color: 'ink', align: 'right' });
          sw.textPx('rated power', sw.X(2), sw.Y(1) + 11, { size: 11, color: 'muted', align: 'left' });
          // duration curve
          const dp = []; for (let i = 0; i < 8760; i += 8) dp.push([i, st.sorted[i]]);
          dp.push([8759, st.sorted[8759]]);
          sd.poly([[0, 0], ...dp, [8760, 0]], { fill: col, fillAlpha: 0.32, stroke: false });
          sd.path(dp, { color: col, width: 2.2 });
          sd.rect(0, 0, 8760, st.mean, { color: 'ink', width: 1.8, dash: true });
          sd.hline(us, { color: 'red', width: 1.8 });
          sd.hline(1, { color: 'faint', width: 1.2 });
          sd.textPx(`${usn} ${v.fix(100 * us, 1)}%`, sd.X(8750), sd.Y(us) - 9, { size: 11, weight: 650, color: 'red', align: 'right' });
          sd.textPx(`equal-area rectangle: CF = ${v.fix(100 * st.mean, 1)}%`, sd.X(8750), sd.Y(st.mean / 2), { size: 11.5, weight: 700, color: 'ink', align: 'right', plate: true });
          v.legend([[col, name, { area: true }], ['ink', 'annual mean = capacity factor', { dash: true }], ['red', 'US average, 2025 (EIA)', {}]]);
        });
        v.readout(() => {
          const k = tech.value, st = stat(k), [name, , us, usn] = INFO[k], E = cap.value * 8760 * st.mean;
          return `**${name}**, France 2023: capacity factor **${v.fix(100 * st.mean, 1)}%** (${v.fix(st.mean * 8760, 0)} full-power hours of 8760). Best hour ${v.fix(100 * st.mx, 0)}% of rated power; ${grp(st.high)} hours above 90%, ${grp(st.low)} hours below 5%.\nA ${v.fix(cap.value, cap.value < 10 ? 1 : 0)} MW plant would deliver **${E >= 1e4 ? v.fix(E / 1000, 0) + ' GWh' : v.fix(E, 0) + ' MWh'}** a year (average power ${v.fix(cap.value * st.mean, 1)} MW); to match 1 GW of US nuclear at ${v.fix(100 * 0.91, 0)}% you would need ${grp(1000 * 0.91 / us)} MW of this technology at the US average of ${v.fix(100 * us, 1)}%.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.5
    {
      num: '1.5', kind: 'Concept', name: 'Energy return on investment (EROI)',
      statement: String.raw`The **energy return on investment** of an energy source is the energy it delivers divided by the energy that had to be invested to obtain it (to build the equipment, extract, refine, transport and run it):
$$\text{EROI} = \frac{E_{\text{delivered}}}{E_{\text{invested}}}.$$
Of each unit of energy delivered, the fraction $1/\text{EROI}$ is spent on getting it and the **net energy** fraction $1 - 1/\text{EROI}$ is left to power everything else. Because this fraction is flat at high EROI and plunges at low EROI, it has a "**net energy cliff**": at 30:1 the net share is 97%, at 10:1 it is 90%, at 5:1 80%, at 2:1 only 50% and at 1:1 nothing. EROI depends on where the boundary is drawn: published estimates for fossil fuels at the wellhead or mine mouth are 15–80:1, but counted at the stage where energy enters the economy (fuel or electricity) a global estimate for 1995–2011 is only about 6:1 (about 3:1 for fossil electricity); modern wind and solar electricity are estimated at roughly 4–30:1.`,
      idea: String.raw`EROI is a ratio of two energies, so it is a pure number — but both terms are slippery. Counting *direct* energy only (the diesel burnt at the mine) gives much higher ratios than adding *indirect* energy embodied in steel, concrete and machinery, and both rise or fall depending on whether the output is measured at the wellhead, as refined fuel or as electricity at the plug (a thermal power station converts only a third of its fuel to electricity, so a primary-stage 30:1 becomes a final-stage 10:1 before any extra investment is counted). Comparing a primary-stage figure for fossil fuels with a final-stage figure for renewables, as is often done, is therefore comparing different things. The curve $1-1/\text{EROI}$ then explains why low ratios matter: a society that must put a third of its energy back into energy supply has a third less for everything else.`,
      caption: String.raw`Drag the orange handle along the net-energy curve to set the **primary-stage** EROI (it starts at the global fossil-fuel value of 29:1 for 2011) and the slider for the extra energy spent *after* the fuel leaves the ground (refining, generating, delivering): the blue dot is the resulting **final-stage** EROI and its much lower net share. The lower chart sets the published estimates (Brockway et al. 2019, Table 1) next to your two values on the same log axis.`,
      deps: ['energy-1.1'],
      refs: ['Tester ch. 6'],
      tags: ['EROI', 'net energy'],
      credit: 'Lambert et al., 2013 (net energy cliff); Hall, Balogh & Murphy, 2009 (minimum EROI); Brockway et al., 2019',
      scope: String.raw`EROI is a sensitive function of method and system boundary; ranges in the chart are published estimates, not measurements, and many studies do not say which boundary they use. The net energy cliff is a statement about arithmetic, not a prediction of society's breakdown point: the minimum EROI a society needs is itself debated (Hall, Balogh & Murphy 2009; Fizaine & Court 2016).`,
      viz(v) {
        // [label, lo, hi, stage, source]
        const R = [
          ['Coal, mine mouth', 40, 80, 'prim', 'Hall et al.; Court & Fizaine'],
          ['Oil, wellhead', 15, 20, 'prim', 'Court & Fizaine; Gagnon et al.; Hall et al.'],
          ['Natural gas, wellhead', 18, 75, 'prim', 'Gagnon et al.; Hall et al.; Court & Fizaine'],
          ['Solar PV, primary-energy equivalent', 19, 38, 'prim', 'Raugei et al.'],
          ['Refined oil fuels', 4, 5, 'fin', 'Brandt'],
          ['Electricity from gas', 6, 14, 'fin', 'Hall et al.; King & van den Bergh; Raugei & Leccisi'],
          ['Electricity from coal', 4, 18, 'fin', 'Raugei & Leccisi; Hall et al.; King & van den Bergh'],
          ['Electricity from solar PV', 4, 20, 'fin', 'Raugei et al.; Hall et al.; Leccisi et al.'],
          ['Electricity from wind', 14, 30, 'fin', 'Kubiszewski et al.; Raugei & Leccisi'],
        ];
        const cc = v.slider('energy spent after the fuel leaves the ground (per unit of fuel)', 0, 0.6, 1 / 6 - 1 / 29, { step: 0.002, fmt: (x) => v.fix(x, 3) });
        const sA = v.stage({ x: [1, 50], y: [0, 1.04], axes: 'box', gutter: true, height: 330, weight: 1, minWidth: 320, xlabel: 'EROI (energy delivered ÷ energy invested)', ylabel: 'net energy share  1 − 1/EROI', xticks: [1, 5, 10, 20, 30, 40, 50], yticks: [[0, '0%'], [0.25, '25%'], [0.5, '50%'], [0.75, '75%'], [1, '100%']] });
        const sB = v.stage({ x: [1, 100], y: [0, R.length + 1.3], xlog: true, axes: 'box', gutter: true, height: 390, full: true, xlabel: 'EROI (log axis)', yticks: [], xticks: [[1, '1'], [2, '2'], [5, '5'], [10, '10'], [20, '20'], [50, '50'], [100, '100']] });
        const net = (e) => 1 - 1 / e;
        const hP = sA.handle(29, net(29), { color: 'orange', r: 8, label: 'primary stage', labelPos: 'n', constrain: (x) => { const e = clamp(x, 1.05, 50); return [e, net(e)]; } });
        const fin = () => 1 / (1 / hP.x + cc.value);
        v.render(() => {
          sA.vband(1, 5, { color: 'red', alpha: 0.1 });
          sA.fn(net, { color: 'accent', width: 2.8, domain: [1.001, 50] });
          sA.text('the net energy cliff', 7, 0.45, { size: 12, weight: 650, color: 'red', align: 'left' });
          sA.hline(1, { color: 'faint', width: 1.2, dash: true });
          const ep = hP.x, ef = fin();
          sA.line(ef, 0, ef, net(ef), { color: 'blue', width: 1.2, dash: true }); sA.line(ep, 0, ep, net(ep), { color: 'orange', width: 1.2, dash: true });
          sA.arrow(ep, net(ep) - 0.03, ef + 0.4, net(ef) + 0.02, { color: 'muted', width: 1.6 });
          sA.dot(ef, net(ef), { r: 7, color: 'blue', label: `final stage ${v.fix(ef, ef < 10 ? 1 : 0)}:1`, labelPos: 'se' });
          // bars: one row per estimate, label at the left, bar at its range, source note beside the bar
          R.forEach(([name, lo, hi, st, src], i) => {
            const y = R.length + 0.3 - i, col = st === 'prim' ? 'orange' : 'blue', Y = sB.Y(y);
            sB.rect(lo, y - 0.2, hi, y + 0.2, { fill: col, fillAlpha: 0.6, color: col, width: 1.2 });
            sB.textPx(`${name}   ${lo === hi ? lo : lo + '–' + hi}`, sB.X(1) + 8, Y - 6, { size: 11.5, weight: 650, color: 'ink', align: 'left' });
            sB.textPx(src, sB.X(1) + 8, Y + 8, { size: 10, color: 'muted', align: 'left' });
          });
          sB.vline(ep, { color: 'orange', width: 2.2 }); sB.vline(ef, { color: 'blue', width: 2.2 });
          const yg = 0.55;
          sB.line(37, yg, 29, yg, { color: 'orange', width: 2.4 }); sB.line(6.8, yg, 6.05, yg, { color: 'blue', width: 2.4 });
          sB.dots([[37, yg], [29, yg]], { r: 5, color: 'orange' }); sB.dots([[6.8, yg], [6.05, yg]], { r: 5, color: 'blue' });
          sB.textPx('global fossil fuels 1995 → 2011 (Brockway et al.): primary 37 → 29, final 6.8 → 6', sB.X(1) + 8, sB.Y(yg), { size: 11.5, weight: 700, color: 'ink', align: 'left' });
          sB.textPx('your primary', sB.X(ep) + 5, sB.Y(R.length + 1.15), { size: 11, weight: 700, color: 'orange', align: 'left' });
          sB.textPx('your final', sB.X(ef) - 5, sB.Y(R.length + 1.15), { size: 11, weight: 700, color: 'blue', align: 'right' });
          v.legend([['orange', 'primary stage (extraction)', { area: true }], ['blue', 'final stage (fuel or electricity delivered)', { area: true }]]);
        });
        v.readout(() => {
          const ep = hP.x, ef = fin();
          return `Primary stage **${v.fix(ep, ep < 10 ? 1 : 0)}:1** → net share **${v.fix(100 * net(ep), 1)}%**. After spending ${v.fix(cc.value, 3)} units more per unit of fuel on refining, generating and delivery, the final-stage EROI is **${v.fix(ef, ef < 10 ? 2 : 1)}:1** with a net share of **${v.fix(100 * net(ef), 1)}%**: the same fuel loses ${v.fix(100 * (net(ep) - net(ef)), 1)} percentage points of its energy to the supply chain. Slope of the curve here: ${v.fix(100 / (ef * ef), 1)} points of net share per unit of EROI.`;
        });
      },
    },
    // ───────────────────────────────────────────────────────────────────────────────────── 1.6
    {
      num: '1.6', kind: 'Method', name: 'Levelised cost of energy and discounting',
      statement: String.raw`The **levelised cost of energy** (LCOE) of a plant is the constant price per unit of energy at which its discounted revenues exactly equal its discounted costs over its life, so that the investor earns the discount rate $r$ and no more. With construction cost $C$ (per kW) at time 0, annual operating costs $O_t$ (fixed and variable O&M, fuel) and annual energy $E_t$ for $t = 1,\dots,N$,
$$\text{LCOE} = \frac{C + \sum_{t=1}^{N} O_t/(1+r)^t}{\sum_{t=1}^{N} E_t/(1+r)^t}.$$
For constant costs and output this reduces to the annuity form
$$\text{LCOE} = \frac{\text{CRF}\cdot C + \text{FOM}}{8.76\,\text{CF}} + \text{VOM} + h\,p_{\text{fuel}}, \qquad \text{CRF} = \frac{r(1+r)^N}{(1+r)^N - 1},$$
with fixed O&M in \$/kW-yr, capacity factor CF, variable O&M in \$/MWh, heat rate $h$ and fuel price $p_{\text{fuel}}$. Capital-heavy technologies (solar, wind, nuclear) are the ones whose LCOE is most sensitive to the discount rate; fuel-burning plants are sensitive to the fuel price instead.`,
      idea: String.raw`A kilowatt-hour sold in year 30 is worth less to an investor than one sold in year 1, so both costs and energy are weighted by $(1+r)^{-t}$; setting discounted revenue equal to discounted cost and solving for the price gives the formula. The capital recovery factor CRF is the share of the construction cost that has to be repaid every year, and it rises with $r$: for a 30-year plant it is 3.3% at $r=0$, 8.1% at $r=7\%$ and 10.1% at $r=9\%$. A plant that is mostly capital (nuclear: about 80% of its cost) therefore becomes much more expensive when money is expensive, while a gas plant (mostly fuel) barely notices. LCOE is a convenient single number but hides *when* energy is produced: a kWh at 3 a.m. and one at the evening peak are valued the same.`,
      caption: String.raw`Choose a technology (its capital cost, O&M, heat rate and capacity factor are the EIA/Sargent & Lundy reference values; the capacity factor is the US 2025 average) and change any input. The left chart shows the discounted cash flows year by year: the red bar is the construction cost, the stacked bars are each year's discounted revenue at the break-even price, split into running costs and margin, and the gold line is the cumulative net present value, which reaches exactly zero at the end of life. The right chart sweeps the discount rate for all six technologies with their reference inputs.`,
      deps: ['energy-1.4', 'fin-1.5'],
      refs: ['Tester ch. 5'],
      tags: ['LCOE', 'discounting', 'economics'],
      scope: String.raw`This is a plant-level, constant-dollar LCOE with end-of-year cash flows and no taxes, subsidies, inflation, degradation or system integration costs. Capital costs are EIA/Sargent & Lundy overnight estimates for 2023 US dollars, with the interest during construction added from the construction-time slider; the gas and nuclear fuel prices ($3.5 and $0.5 per MMBtu) and the construction times are illustrative round numbers, and offshore wind's 40% capacity factor is illustrative. Real projects differ widely by site and country.`,
      viz(v) {
        // [label, capex $/kW, FOM $/kW-yr, VOM $/MWh, heat rate Btu/kWh, fuel $/MMBtu, CF, build years, colour, Lazard 2025 range $/MWh]
        const T = {
          sun: ['Solar PV (tracking)', 1502, 20.23, 0, 0, 0, 0.244, 1, 'gold', '38–78'],
          wind: ['Onshore wind', 1489, 33.06, 0, 0, 0, 0.342, 2, 'teal', '37–86'],
          off: ['Offshore wind', 3689, 154, 0, 0, 0, 0.40, 3, 'accent', '72–140'],
          gas: ['Gas combined cycle', 921, 15.51, 3.33, 6226, 3.5, 0.584, 3, 'orange', '48–109'],
          coal: ['Coal (USC)', 4103, 61.6, 6.4, 8638, 2.49, 0.487, 4, 'ink', '71–173'],
          nuc: ['Nuclear (AP1000)', 7861, 156.2, 2.52, 10608, 0.5, 0.91, 6, 'purple', '141–220'],
        };
        const sel = v.select('technology', Object.entries(T).map(([k, t]) => ({ value: k, label: t[0].replace(' (tracking)', '').replace(' (USC)', '').replace(' (AP1000)', '').replace('Gas combined cycle', 'gas CC') })), 'sun', { onChange: (k) => load(k) });
        const cap = v.slider('capital cost ($/kW)', 500, 12000, 1502, { step: 10, fmt: (x) => grp(x) });
        const fom = v.slider('fixed O&M ($/kW-yr)', 0, 300, 20.23, { step: 0.5, fmt: (x) => v.fix(x, 1) });
        const vom = v.slider('variable O&M ($/MWh)', 0, 20, 0, { step: 0.1, fmt: (x) => v.fix(x, 1) });
        const hr = v.slider('heat rate (Btu/kWh)', 0, 14000, 0, { step: 50, fmt: (x) => grp(x) });
        const fuel = v.slider('fuel ($/MMBtu)', 0, 12, 0, { step: 0.05, fmt: (x) => v.fix(x, 2) });
        const cf = v.slider('capacity factor', 0.05, 0.95, 0.244, { step: 0.005, fmt: (x) => v.fix(100 * x, 1) + ' %' });
        const N = v.slider('lifetime (years)', 10, 60, 30, { step: 1, int: true, fmt: (x) => String(x) });
        const rr = v.slider('discount rate', 0, 0.15, 0.07, { step: 0.0025, fmt: (x) => v.fix(100 * x, 2) + ' %' });
        const cons = v.slider('construction time (years)', 0, 10, 1, { step: 0.5, fmt: (x) => v.fix(x, 1) });
        function load(k) { const t = T[k]; cap.set(t[1]); fom.set(t[2]); vom.set(t[3]); hr.set(t[4]); fuel.set(t[5]); cf.set(t[6]); cons.set(t[7]); }
        const sA = v.stage({ x: [-1.2, 31], y: [-1500, 1500], axes: 'box', gutter: true, height: 340, weight: 1.15, minWidth: 340, xlabel: 'year of operation', ylabel: 'present value ($ per kW of capacity)' });
        const sB = v.stage({ x: [0, 0.12], y: [0, 270], axes: 'box', gutter: true, height: 340, weight: 1, minWidth: 300, xlabel: 'discount rate', ylabel: 'LCOE ($/MWh)', xticks: [[0, '0'], [0.02, '2%'], [0.04, '4%'], [0.06, '6%'], [0.08, '8%'], [0.1, '10%'], [0.12, '12%']] });
        const short = (n) => n.replace(' (tracking)', '').replace(' (USC)', '').replace(' (AP1000)', '');
        const crf = (r, n) => (r === 0 ? 1 / n : r * (1 + r) ** n / ((1 + r) ** n - 1));
        const calc = (p) => { // p = {C, F, V, H, P, cf, n, r, T} → components in $/MWh
          const Ce = p.C * (1 + p.r) ** (p.T / 2), mwh = 8.76 * p.cf;
          const capc = crf(p.r, p.n) * Ce / mwh, fo = p.F / mwh, vo = p.V, fu = p.H / 1000 * p.P;
          return { cap: capc, fom: fo, vom: vo, fuel: fu, tot: capc + fo + vo + fu, Ce, mwh };
        };
        const cur = () => ({ C: cap.value, F: fom.value, V: vom.value, H: hr.value, P: fuel.value, cf: cf.value, n: N.value, r: rr.value, T: cons.value });
        const preset = (t, r) => ({ C: t[1], F: t[2], V: t[3], H: t[4], P: t[5], cf: t[6], n: 30, r, T: t[7] });
        v.render(() => {
          const p = cur(), c = calc(p), L = c.tot, n = p.n;
          sA.setView([-1.2, n + 1.2], [-1.12 * c.Ce, Math.max(0.28 * c.Ce, 2.2 * L * c.mwh / (1 + p.r))]);
          // year 0: construction cost (with interest during construction)
          sA.rect(-0.38, -c.Ce, 0.38, 0, { fill: 'red', fillAlpha: 0.55, color: 'red', width: 1.2 });
          const bw = Math.min(0.42, 18 / n * 0.04 + 0.2);
          let cum = -c.Ce; const pts = [[0, cum]];
          for (let t = 1; t <= n; t++) {
            const d = (1 + p.r) ** -t, rev = L * c.mwh * d, o1 = c.fom * c.mwh * d, o2 = c.vom * c.mwh * d, o3 = c.fuel * c.mwh * d;
            let y = 0; for (const [h, col] of [[o1, 'teal'], [o2, 'green'], [o3, 'orange'], [rev - o1 - o2 - o3, 'accent']]) { sA.rect(t - bw, y, t + bw, y + h, { fill: col, fillAlpha: 0.62, color: col, width: 0.6 }); y += h; }
            cum += rev - o1 - o2 - o3 - o3 * 0; pts.push([t, cum]);
          }
          sA.path(pts, { color: 'gold', width: 2.6 }); sA.hline(0, { color: 'ink', width: 1 });
          sA.dot(n, pts[pts.length - 1][1], { r: 5, color: 'gold' });
          sA.textPx('construction', sA.X(0) + 14, sA.Y(-c.Ce) - 10, { size: 11, weight: 650, color: 'red', align: 'left' });
          sA.textPx('cumulative net present value → 0 at the end of life', sA.X(n) - 8, sA.Y(-0.7 * c.Ce), { size: 11, weight: 650, color: 'gold', align: 'right' });
          // sweep of discount rate for all presets
          sB.vline(p.r, { color: 'ink', width: 1.2, dash: true });
          const ends = [];
          for (const [k, t] of Object.entries(T)) {
            const pts2 = []; for (let i = 0; i <= 60; i++) { const r = 0.12 * i / 60; pts2.push([r, calc(preset(t, r)).tot]); }
            const on = sel.value === k;
            sB.path(pts2, { color: t[8], width: on ? 3 : 1.8, alpha: on ? 1 : 0.7 });
            ends.push({ y: sB.Y(pts2[pts2.length - 1][1]) - 8, name: short(t[0]), col: t[8], on });
          }
          ends.sort((a, b) => a.y - b.y); for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 13);
          for (const e of ends) sB.textPx(e.name, sB.X(0.12) - 4, e.y, { size: 10.5, weight: e.on ? 700 : 550, color: e.col, align: 'right' });
          sB.dot(p.r, L, { r: 6.5, color: 'ink', label: `${v.fix(L, 0)} $/MWh`, labelPos: 'nw' });
          v.legend([['red', 'construction cost', { area: true }], ['teal', 'fixed O&M', { area: true }], ['green', 'variable O&M', { area: true }], ['orange', 'fuel', { area: true }], ['accent', 'margin that repays the capital', { area: true }]]);
        });
        v.readout(() => {
          const p = cur(), c = calc(p), t = T[sel.value];
          const lo = calc({ ...p, r: 0.03 }).tot, hi = calc({ ...p, r: 0.10 }).tot;
          return `**LCOE ${v.fix(c.tot, 1)} \\$/MWh** = capital ${v.fix(c.cap, 1)} (${v.fix(100 * c.cap / c.tot, 0)}%) + fixed O&M ${v.fix(c.fom, 1)} + variable O&M ${v.fix(c.vom, 1)} + fuel ${v.fix(c.fuel, 1)}. Energy per kW per year: ${v.fix(c.mwh, 2)} MWh; CRF = ${v.fix(100 * crf(p.r, p.n), 2)}% of the ${grp(c.Ce)} \\$/kW construction cost every year.\nAt a 3% discount rate the same plant costs ${v.fix(lo, 0)} \\$/MWh, at 10% ${v.fix(hi, 0)} (a factor ${v.fix(hi / lo, 2)}). For comparison, Lazard's 2025 unsubsidised range for ${short(t[0]).toLowerCase()} is ${t[9]} \\$/MWh.`;
        });
        load('sun');
      },
    },
  ],
};
