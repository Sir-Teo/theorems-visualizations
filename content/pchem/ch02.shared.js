// Physical Chemistry — Chapter 2: shared thermochemical data and helpers.
// Cp(T) = a + b T + c / T²  in J/(K·mol) (the form Atkins tabulates); CO2, H2, N2, NH3, O2 verified against Atkins' Physical Chemistry 11e Table 2B.1; CO, H2O(g), CH4 are the older-edition values (CH4 is only reliable below ~1000 K).
export const CP = {
  CO2: [44.22, 8.79e-3, -8.62e5],
  CO: [28.41, 4.10e-3, -0.46e5],
  H2O: [30.54, 10.29e-3, 0],
  H2: [27.28, 3.26e-3, 0.50e5],
  O2: [29.96, 4.18e-3, -1.67e5],
  N2: [28.58, 3.77e-3, -0.50e5],
  CH4: [23.64, 47.86e-3, -1.92e5],
  NH3: [29.75, 25.10e-3, -1.55e5],
};
export const cpOf = (sp, T) => { const [a, b, c] = CP[sp]; return a + b * T + c / (T * T); };
/** ∫ Cp dT from T1 to T2 (J/mol). */
export const intCp = (sp, T1, T2) => { const [a, b, c] = CP[sp]; return a * (T2 - T1) + b / 2 * (T2 * T2 - T1 * T1) - c * (1 / T2 - 1 / T1); };
/** Standard enthalpies of formation at 298 K, kJ/mol (gases unless noted: C2H5OH and C6H6 are liquids, CaCO3, CaO, Al2O3, Fe2O3 solids; H2Ol liquid). */
export const DFH = { CO2: -393.51, CO: -110.53, H2Og: -241.83, H2Ol: -285.83, CH4: -74.81, NH3: -46.11, O2: 0, N2: 0, H2: 0,
  C2H6: -84.68, C2H4: 52.26, NO: 90.25, C2H5OH: -277.69, C6H6: 49.0, CaCO3: -1206.9, CaO: -635.09, Al2O3: -1675.7, Fe2O3: -824.2, Fe: 0, Al: 0 };
export const R = 8.314462618;
/** A real-time-free palette helper: signed number text with a true minus sign. */
export const sg = (x, d = 1) => (x < 0 ? '−' : '+') + Math.abs(x).toFixed(d);
