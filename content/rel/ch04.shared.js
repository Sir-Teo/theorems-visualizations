// Shared helpers for Special & General Relativity — Chapter 4 (relativistic dynamics). Energies in MeV, momenta in MeV/c, masses in MeV/c², c = 1.
export * from './ch03.shared.js';
import { gam } from './ch03.shared.js';

// Masses (MeV/c²): electron and muon CODATA 2018 / PDG, charged pion and kaon PDG, proton CODATA 2018, neutron AME2020.
export const ME = 0.51099895, MMU = 105.6583755, MPI = 139.57039, MK = 493.677, MP = 938.27208816, MN = 939.56542052;
export const U_MEV = 931.49410242; // MeV/c² per atomic mass unit

/** Boost an energy–momentum pair (E, p) along x with velocity b (c = 1). */
export const boostEp = (E, p, b) => { const g = gam(b); return [g * (E - b * p), g * (p - b * E)]; };
/** Momentum of each product of a two-body decay M → m1 + m2 in the rest frame of M. */
export const pStar = (M, m1, m2) => Math.sqrt(Math.max(0, (M * M - (m1 + m2) ** 2) * (M * M - (m1 - m2) ** 2))) / (2 * M);
/** Kinetic energy → momentum for mass m. */
export const pOfT = (T, m) => Math.sqrt(T * (T + 2 * m));
/** Pretty energy with the right unit prefix (input in MeV). */
export function eng(x, d = 3) {
  const a = Math.abs(x);
  if (a === 0) return '0 MeV';
  const sg = x < 0 ? '−' : '';
  const f = (y, u) => sg + String(+y.toPrecision(d)) + ' ' + u;
  if (a >= 1e6) return f(a / 1e6, 'TeV');
  if (a >= 1e3) return f(a / 1e3, 'GeV');
  if (a >= 1) return f(a, 'MeV');
  if (a >= 1e-3) return f(a * 1e3, 'keV');
  return f(a * 1e6, 'eV');
}

/** AME2020 (Wang et al., Chin. Phys. C 45, 030003, 2021): [symbol, A, Z, binding energy per nucleon (keV), atomic mass (µu)]. */
export const NUCL = [
  ['H', 2, 1, 1112.2831, 2014101.777844], ['H', 3, 1, 2827.2654, 3016049.28132], ['He', 3, 2, 2572.6804, 3016029.32197], ['He', 4, 2, 7073.9156, 4002603.25413],
  ['Li', 6, 3, 5332.3312, 6015122.88742], ['Li', 7, 3, 5606.4401, 7016003.43426], ['Be', 9, 4, 6462.6693, 9012183.062], ['B', 10, 5, 6475.0835, 10012936.862],
  ['C', 12, 6, 7680.1446, 12000000.0], ['N', 14, 7, 7475.6148, 14003074.00425], ['O', 16, 8, 7976.2072, 15994914.61926], ['Ne', 20, 10, 8032.2412, 19992440.17525],
  ['Mg', 24, 12, 8260.7103, 23985041.689], ['Si', 28, 14, 8447.7445, 27976926.53442], ['S', 32, 16, 8493.1301, 31972071.17354], ['Ca', 40, 20, 8551.3046, 39962590.850],
  ['Ti', 48, 22, 8723.0122, 47947940.677], ['Cr', 52, 24, 8775.9946, 51940504.714], ['Fe', 56, 26, 8790.3563, 55934935.537], ['Fe', 58, 26, 8792.2534, 57933273.575],
  ['Ni', 60, 28, 8780.7769, 59930785.129], ['Ni', 62, 28, 8794.5555, 61928344.753], ['Zn', 64, 30, 8735.9057, 63929141.776], ['Kr', 84, 36, 8717.4473, 83911497.72708],
  ['Sr', 90, 38, 8696.0043, 89907727.870], ['Kr', 92, 36, 8512.6750, 91926173.092], ['Mo', 98, 42, 8635.1691, 97905403.609], ['Cd', 114, 48, 8531.5135, 113903364.998],
  ['Sn', 120, 50, 8504.4880, 119902202.557], ['Xe', 136, 54, 8396.1889, 135907214.474], ['Ba', 141, 56, 8326.0774, 140914403.653], ['Nd', 142, 60, 8346.0310, 141907728.824],
  ['Ba', 144, 56, 8265.4549, 143922954.821], ['Au', 197, 79, 7915.6548, 196966570.103], ['Pb', 208, 82, 7867.4530, 207976652.005], ['Rn', 222, 86, 7694.4991, 222017576.017],
  ['Th', 232, 90, 7615.0338, 232038053.606], ['U', 235, 92, 7590.9151, 235043928.117], ['U', 238, 92, 7570.1262, 238050786.936],
];
export const M_H1 = 1007825.031898, M_NEUT = 1008664.91590; // µu (AME2020): hydrogen-1 atom, neutron
