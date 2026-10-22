// Dimensionless spinless models. Numerical physical constants are kept separate.
import { cgSafe } from './spin-coupling-audit.shared.js';
import { legendreP } from './ch07.shared.js';
const integer = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
function ratio(n, d) { const g = gcd(n, d); return { n: n / g, d: d / g }; }
const compare = (a, b) => a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;
export const ratioValue = a => Number(a.n) / Number(a.d);

export function boxLevels(lengthTicks = [10, 10, 10], cap = 5) {
  if (!Array.isArray(lengthTicks) || lengthTicks.length !== 3 || !Array.from(lengthTicks).every(x => integer(x, 5, 30)) || !integer(cap, 1, 10)) throw new RangeError('Three dense length ticks from 5 through 30 and a quantum-number cutoff from 1 through 10 are required');
  const squares = lengthTicks.map(x => BigInt(x) ** 2n), denominator = squares.reduce((x, y) => x * y, 1n);
  const energy = ns => ratio(100n * ns.reduce((s, n, j) => s + BigInt(n) ** 2n * denominator / squares[j], 0n), denominator);
  const omitted = [0, 1, 2].map(j => energy([0, 1, 2].map(k => k === j ? cap + 1 : 1))).sort(compare)[0];
  const groups = new Map();
  for (let x = 1; x <= cap; x++) for (let y = 1; y <= cap; y++) for (let z = 1; z <= cap; z++) {
    const state = [x, y, z], e = energy(state), key = `${e.n}/${e.d}`;
    if (!groups.has(key)) groups.set(key, { energy: e, states: [], certifiedComplete: compare(e, omitted) < 0 });
    groups.get(key).states.push(state);
  }
  const levels = [...groups.values()].sort((a, b) => compare(a.energy, b.energy));
  return { lengthTicks: lengthTicks.slice(), lengths: lengthTicks.map(x => x / 10), cap, levels, firstOmittedEnergy: omitted };
}

export function oscillatorShell(N = 3) {
  if (!integer(N, 0, 20)) throw new RangeError('Select an oscillator shell from 0 through 20');
  const cartesian = [], spherical = [];
  for (let x = 0; x <= N; x++) for (let y = 0; y <= N - x; y++) cartesian.push([x, y, N - x - y]);
  for (let radial = 0; 2 * radial <= N; radial++) {
    const ell = N - 2 * radial;
    for (let m = -ell; m <= ell; m++) spherical.push({ radial, ell, m });
  }
  return { N, energy: N + 1.5, degeneracy: (N + 1) * (N + 2) / 2, cartesian, spherical };
}

export function laguerre(k, alpha, x) {
  if (!integer(k, 0, 24) || !integer(alpha, 0, 49) || !Number.isFinite(x) || x < 0 || x > 1000) throw new RangeError('Use the declared finite Laguerre domain');
  let a = 1;
  if (k === 0) return a;
  let b = 1 + alpha - x;
  for (let j = 2; j <= k; j++) [a, b] = [b, ((2 * j - 1 + alpha - x) * b - (j - 1 + alpha) * a) / j];
  return b;
}
const logFactorial = n => { let s = 0; for (let j = 2; j <= n; j++) s += Math.log(j); return s; };

// Length is in the reduced-mass Bohr radius; energy is in its Hartree unit.
export function hydrogenRadial(n = 1, ell = 0, radius = 1, Z = 1) {
  if (!integer(n, 1, 12) || !integer(ell, 0, n - 1) || !Number.isFinite(radius) || radius < 0 || radius > 5000 || !Number.isFinite(Z) || Z < .5 || Z > 5) throw new RangeError('Use n from 1 through 12, 0≤ell<n, radius from 0 through 5000 and Z from 0.5 through 5');
  const k = n - ell - 1, alpha = 2 * ell + 1, scale = 2 * Z / n, x = scale * radius;
  if (x > 1000) throw new RangeError('The scaled radial coordinate exceeds the declared domain');
  const L = laguerre(k, alpha, x), dL = k ? -laguerre(k - 1, alpha + 1, x) : 0;
  const ddL = k > 1 ? laguerre(k - 2, alpha + 2, x) : 0;
  const normalization = scale ** 1.5 * Math.exp((logFactorial(k) - Math.log(2 * n) - logFactorial(n + ell)) / 2);
  const exponential = Math.exp(-x / 2), power = x ** ell;
  const R = normalization * exponential * power * L;
  const u = radius * R;
  const du = normalization * exponential * ((ell + 1) * power * L + x ** (ell + 1) * (dL - L / 2));
  const ddu = normalization * scale * exponential * (
    (ell ? ell * (ell + 1) * x ** (ell - 1) * L : 0)
    + 2 * (ell + 1) * power * (dL - L / 2)
    + x ** (ell + 1) * (ddL - dL + L / 4));
  const energy = -(Z ** 2) / (2 * n ** 2);
  const finite = x => Number.isFinite(x) ? x : null;
  const potential = radius ? finite(-Z / radius) : null;
  const barrier = radius ? ell === 0 ? 0 : finite(ell * (ell + 1) / (2 * radius ** 2)) : null;
  // Evaluate V*u=-Z*R and the centrifugal product before dividing by r.
  // These products have finite limits even when the individual potentials overflow.
  const centrifugalProduct = ell ? normalization * scale * exponential * ell * (ell + 1) * x ** (ell - 1) * L / 2 : 0;
  const equationResidual = radius ? -.5 * ddu + centrifugalProduct - Z * R - energy * u : null;
  const waveformUnderflow = radius > 0 && L !== 0 && (R === 0 || u === 0);
  const probabilityUnderflow = radius > 0 && L !== 0 && u * u === 0;
  const equationStatus = radius === 0 ? 'origin boundary; no pointwise equation value'
    : potential === null || barrier === null ? 'individual potential overflow; finite combined products evaluated'
    : waveformUnderflow || probabilityUnderflow ? 'waveform or probability underflow; residual is only a floating diagnostic'
    : 'finite equation products evaluated';
  return { n, ell, radius, Z, R, u, du, ddu, energy, potential, barrier, equationResidual,
    waveformUnderflow, probabilityUnderflow, equationStatus, radialProbability: u * u };
}

// A convergent origin series avoids unstable upward recurrence at small x.
export function sphericalBessel(ell, x) {
  if (!integer(ell, 0, 7) || !Number.isFinite(x) || x < 0 || x > 100) throw new RangeError('Use ell from 0 through 7 and x from 0 through 100');
  if (x === 0) return ell === 0 ? 1 : 0;
  if (x <= ell + 1) {
    let denominator = 1;
    for (let j = 1; j <= ell; j++) denominator *= 2 * j + 1;
    let term = x ** ell / denominator, sum = term;
    for (let k = 1; k <= 100; k++) {
      term *= -x * x / (2 * k * (2 * ell + 2 * k + 1)); sum += term;
      if (Math.abs(term) < 2e-16 * Math.max(Math.abs(sum), 1e-300)) break;
    }
    return sum;
  }
  let a = Math.sin(x) / x;
  if (ell === 0) return a;
  let b = (a - Math.cos(x)) / x;
  for (let j = 1; j < ell; j++) [a, b] = [b, (2 * j + 1) * b / x - a];
  return b;
}

const besselRootCache = new Map();
export function sphericalWellRoot(ell = 0, index = 1) {
  if (!integer(ell, 0, 6) || !integer(index, 1, 8)) throw new RangeError('Use ell from 0 through 6 and positive root index from 1 through 8');
  const key = `${ell}:${index}`;
  if (besselRootCache.has(key)) return besselRootCache.get(key);
  let left = .01, fl = sphericalBessel(ell, left), found = 0;
  const step = Math.PI / 16;
  for (let right = left + step; right < 60; right += step) {
    const fr = sphericalBessel(ell, right);
    if (fl * fr < 0) {
      found++;
      if (found === index) {
        let a = left, b = right, fa = fl;
        for (let j = 0; j < 60; j++) {
          const mid = (a + b) / 2, fm = sphericalBessel(ell, mid);
          if (fa * fm > 0) { a = mid; fa = fm; } else b = mid;
        }
        const root = (a + b) / 2;
        const answer = Object.freeze({ ell, index, root, energy: root * root, residual: sphericalBessel(ell, root), bracket: Object.freeze([a, b]) });
        besselRootCache.set(key, answer); return answer;
      }
    }
    left = right; fl = fr;
  }
  throw new Error('No bracket found in the declared finite root domain');
}

export function sphericalWellRadial(ell, index, radius) {
  if (!Number.isFinite(radius) || radius < 0 || radius > 1) throw new RangeError('Use radius/a from zero through one');
  const level = sphericalWellRoot(ell, index), normalization = Math.SQRT2 / Math.abs(sphericalBessel(ell + 1, level.root));
  const R = normalization * sphericalBessel(ell, level.root * radius), u = radius * R;
  return { ...level, radius, R, u, radialProbability: u * u, degeneracy: 2 * ell + 1 };
}

// D=2*mu*V0*a^2/hbar^2. This is the first s-wave only.
export function finiteSphericalWell(D = 5) {
  if (!Number.isFinite(D) || D < 0 || D > 100) throw new RangeError('Use dimensionless depth from zero through 100');
  const threshold = Math.PI ** 2 / 4, distance = D - threshold;
  if (Math.abs(distance) <= 64 * Number.EPSILON * Math.max(1, D)) return { D, threshold, status: 'threshold unresolved at floating precision', bound: null };
  if (distance < 0) return { D, threshold, status: 'no bound state', bound: false };
  // Solve for t=q-pi/2 rather than subtracting D-q^2 near threshold.
  // delta=pi*t+t^2+(pi/2+t)^2*tan(t)^2 is strictly increasing.
  const a = Math.PI / 2;
  let left = 0, right = Math.min(distance / (2 * a), a - 1e-12);
  for (let j = 0; j < 90; j++) {
    const t = (left + right) / 2, k = (a + t) * Math.tan(t);
    if (2 * a * t + t * t + k * k < distance) left = t; else right = t;
  }
  const offset = (left + right) / 2, q = a + offset, kappa = q * Math.tan(offset);
  if (kappa === 0) return { D, threshold, status: 'binding energy unresolved at floating precision', bound: null };
  const inside = .5 + Math.sin(2 * offset) / (4 * q), outside = Math.cos(offset) ** 2 / (2 * kappa), normalization = 1 / Math.sqrt(inside + outside);
  return { D, threshold, status: 'first s-wave bound state', bound: true, q, offset, kappa, energy: -kappa * kappa,
    normalization, outsideProbability: outside / (inside + outside), depthResidual: 2 * a * offset + offset * offset + kappa * kappa - distance,
    matchingResidual: -q * Math.tan(offset) + kappa };
}

const factorialBig = n => { let value = 1n; for (let j = 2; j <= n; j++) value *= BigInt(j); return value; };
function signedRatio(n, d) {
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n < 0n ? -n : n, d);
  return { n: n / g, d: d / g };
}
function polynomialSquareMoment(coefficients, shift = 0) {
  let sum = 0n;
  for (let i = 0; i < coefficients.length; i++) for (let j = 0; j < coefficients.length; j++) {
    if (coefficients[i] && coefficients[j]) {
      if (i + j + shift < 0) throw new RangeError('Nonintegrable moment');
      sum += coefficients[i] * coefficients[j] * factorialBig(i + j + shift);
    }
  }
  return sum;
}

// Exact gamma integrals of integer polynomial coefficients, not sampled quadrature.
// Fractions are in the Z=1 reduced-mass atomic units; T,V scale by Z^2.
export function hydrogenMoments(n = 1, ell = 0, Z = 1) {
  if (!integer(n, 1, 12) || !integer(ell, 0, n - 1) || !Number.isFinite(Z) || Z < .5 || Z > 5) throw new RangeError('Use the declared hydrogen moment domain');
  const k = n - ell - 1, alpha = 2 * ell + 1, p = new Array(n + 1).fill(0n);
  for (let j = 0; j <= k; j++) {
    const choose = factorialBig(k + alpha) / (factorialBig(k - j) * factorialBig(alpha + j));
    p[j + ell + 1] = (j % 2 ? -1n : 1n) * choose * factorialBig(k) / factorialBig(j);
  }
  const q = p.map((x, j) => 2n * BigInt(j + 1) * (p[j + 1] ?? 0n) - x);
  const denominator = 2n * BigInt(n) * factorialBig(n + ell) * factorialBig(k);
  const normalization = signedRatio(polynomialSquareMoment(p), denominator);
  const kinetic = signedRatio(polynomialSquareMoment(q) + 4n * BigInt(ell * (ell + 1)) * polynomialSquareMoment(p, -2), 2n * BigInt(n * n) * denominator);
  const potential = signedRatio(-2n * polynomialSquareMoment(p, -1), BigInt(n) * denominator);
  const meanRadius = signedRatio(BigInt(n) * polynomialSquareMoment(p, 1), 2n * denominator);
  return { n, ell, Z, normalization, kinetic, potential, meanRadius,
    T: Z * Z * ratioValue(kinetic), V: Z * Z * ratioValue(potential), meanR: ratioValue(meanRadius) / Z };
}

// Selected central values from the actual 2022 CODATA complete ASCII listing:
// https://physics.nist.gov/cuu/Constants/Table/allascii.txt
// Uncertainty is not propagated; consumer displays must not imply measured-line accuracy.
export const COULOMB_CONSTANTS = Object.freeze({
  rydberg: 10973731.568157, bohr: 5.29177210544e-11,
  protonMassRatio: 1836.152673426, deuteronMassRatio: 3670.482967655,
  alphaMassRatio: 7294.29954171,
  planck: 6.62607015e-34, charge: 1.602176634e-19, light: 299792458,
});
export function reducedMassRatio(nuclearMass = null) {
  if (nuclearMass === null) return 1;
  if (!Number.isFinite(nuclearMass) || nuclearMass < 1 || nuclearMass > 1e8) throw new RangeError('Use a nuclear/electron mass ratio from 1 through 1e8, or null for the fixed-nucleus limit');
  return nuclearMass / (nuclearMass + 1);
}
export function hydrogenLine(lower = 2, upper = 3, Z = 1, nuclearMass = COULOMB_CONSTANTS.protonMassRatio) {
  if (!integer(lower, 1, 199) || !integer(upper, lower + 1, 200) || !integer(Z, 1, 10)) throw new RangeError('Use 1≤lower<upper≤200 and nuclear charge 1 through 10');
  const muRatio = reducedMassRatio(nuclearMass), difference = (upper - lower) * (upper + lower) / (lower * lower * upper * upper);
  const wavenumber = COULOMB_CONSTANTS.rydberg * muRatio * Z * Z * difference;
  return { lower, upper, Z, nuclearMass, muRatio, wavenumber, vacuumNanometers: 1e9 / wavenumber,
    frequency: COULOMB_CONSTANTS.light * wavenumber,
    electronVolts: COULOMB_CONSTANTS.planck * COULOMB_CONSTANTS.light * wavenumber / COULOMB_CONSTANTS.charge };
}
export function isotopeLineShift(lower = 2, upper = 3, massA = COULOMB_CONSTANTS.protonMassRatio, massB = COULOMB_CONSTANTS.deuteronMassRatio) {
  const a = hydrogenLine(lower, upper, 1, massA), b = hydrogenLine(lower, upper, 1, massB);
  const massDifference = massA === null ? massB === null ? 0 : -1 / (massB + 1)
    : massB === null ? 1 / (massA + 1) : (massB - massA) / ((massA + 1) * (massB + 1));
  const wavenumberShift = COULOMB_CONSTANTS.rydberg * (upper - lower) * (upper + lower) / (lower * lower * upper * upper) * massDifference;
  return { a, b, wavenumberShift, frequencyShift: COULOMB_CONSTANTS.light * wavenumberShift,
    vacuumNanometerShift: -1e9 * wavenumberShift / (a.wavenumber * b.wavenumber) };
}

// z-polarized E1 absorption only. B0=hbar^2/(2I0); dipole is in chosen units.
export function rotorAbsorption(J = 1, m = 0, inertia = 1, dipole = 1) {
  if (!integer(J, 0, 20) || !integer(m, -J, J) || !Number.isFinite(inertia) || inertia < .25 || inertia > 4 || !Number.isFinite(dipole) || dipole < 0 || dipole > 2) throw new RangeError('Use the declared rigid-rotor domain');
  const angularStrength = ((J + 1) ** 2 - m * m) / ((2 * J + 1) * (2 * J + 3));
  return { J, m, inertia, dipole, initialEnergy: J * (J + 1) / inertia,
    finalEnergy: (J + 1) * (J + 2) / inertia, gap: 2 * (J + 1) / inertia,
    angularStrength, strength: dipole * dipole * angularStrength, strengthUnderflow: dipole > 0 && dipole * dipole * angularStrength === 0 };
}

// A finite representation of one Coulomb n-shell, hbar=1.
// J+=(L+K)/2 and J-=(L-K)/2 both have j=(n-1)/2.
export function so4Generator(n = 3, ell = 0, m = 0) {
  if (!integer(n, 1, 6) || !integer(ell, 0, n - 1) || !integer(m, -ell, ell)) throw new RangeError('Use one represented shell n1–6 with 0≤ell<n and |m|≤ell');
  const j = (n - 1) / 2, product = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    const m1 = j - a, m2 = j - b;
    if (m1 + m2 === m) {
      const coefficient = cgSafe(j, m1, j, m2, ell, m);
      product.push({ m1, m2, coefficient, image: (m1 - m2) * coefficient });
    }
  }
  const rows = [];
  for (let target = Math.abs(m); target < n; target++) {
    const amplitude = product.reduce((sum, p) => sum + cgSafe(j, p.m1, j, p.m2, target, m) * p.image, 0);
    rows.push({ ell: target, m, amplitude, normSquared: amplitude * amplitude });
  }
  const inputNorm = product.reduce((s, p) => s + p.coefficient ** 2, 0), imageNorm = product.reduce((s, p) => s + p.image ** 2, 0);
  const coupledNorm = rows.reduce((s, p) => s + p.normSquared, 0);
  return { n, ell, m, j, dimension: n * n, product, rows, inputNorm, imageNorm, coupledNorm,
    annihilated: imageNorm === 0, normResidual: coupledNorm - imageNorm,
    orbitalMultiplets: Array.from({ length: n }, (_, ell) => ({ ell, degeneracy: 2 * ell + 1 })) };
}

// Authored coherent superposition of circular Coulomb states, not experimental data.
// The plotted distribution is conditional on r=n0^2/Z, theta=pi/2.
export function rydbergPacket(n0 = 30, sigma = 2, cycles = 0, Z = 1) {
  if (!integer(n0, 20, 60) || !integer(sigma, 1, 3) || !Number.isFinite(cycles) || cycles < 0 || cycles > 80 || !integer(Z, 1, 5)) throw new RangeError('Use n0 from 20 through 60, integer width1–3, time0–80 classical periods and Z1–5');
  const radius = n0 * n0 / Z, rows = [];
  let fullNorm = 0;
  for (let offset = -3 * sigma; offset <= 3 * sigma; offset++) {
    const n = n0 + offset, ell = n - 1, population = Math.exp(-offset * offset / (2 * sigma * sigma));
    const x = 2 * Z * radius / n;
    const logR = 1.5 * Math.log(2 * Z / n) - .5 * (Math.log(2 * n) + logFactorial(2 * n - 1)) - x / 2 + ell * Math.log(x);
    const logY = .5 * (Math.log((2 * ell + 1) / (4 * Math.PI)) + logFactorial(2 * ell) - 2 * ell * Math.log(2) - 2 * logFactorial(ell));
    const phase = -Math.PI * cycles * n0 * (n - n0) * (n + n0) / (n * n);
    rows.push({ n, ell, m: ell, population, logAmplitude: .5 * Math.log(population) + logR + logY, phase, rotatingPhase: phase + 2 * Math.PI * cycles * offset });
    fullNorm += population;
  }
  const maxLog = Math.max(...rows.map(x => x.logAmplitude));
  let conditionalNorm = 0;
  for (const row of rows) {
    row.population /= fullNorm; row.amplitude = Math.exp(row.logAmplitude - maxLog);
    conditionalNorm += row.amplitude * row.amplitude;
  }
  const overlap = rotating => {
    let re = 0, im = 0;
    for (const row of rows) { const phase = rotating ? row.rotatingPhase : row.phase; re += row.population * Math.cos(phase); im += row.population * Math.sin(phase); }
    return re * re + im * im;
  };
  return { n0, sigma, cycles, Z, radius, rows, conditionalNorm,
    classicalPeriod: 2 * Math.PI * n0 ** 3 / (Z * Z), approximateRevivalPeriods: 2 * n0 / 3,
    fullStateAutocorrelation: overlap(false), rotatingFrameFidelity: overlap(true) };
}
export function packetCircleDensity(packet, phi) {
  if (!Number.isFinite(phi) || phi < 0 || phi > 2 * Math.PI) throw new RangeError('Use an angle on the declared circle from zero through 2pi');
  let re = 0, im = 0;
  for (const row of packet.rows) {
    const phase = row.m * phi + row.phase;
    re += row.amplitude * Math.cos(phase); im += row.amplitude * Math.sin(phase);
  }
  return (re * re + im * im) / (2 * Math.PI * packet.conditionalNorm);
}

// Actual probability density per volume in a plane through the nucleus.
// The directly represented coordinate cosine preserves exact nodal planes.
export function orbitalSliceDensity(n, ell, m, x, vertical, plane = 'xz', real = false) {
  if (!integer(m, 0, ell) || !Number.isFinite(x) || !Number.isFinite(vertical) || !['xz', 'xy'].includes(plane) || typeof real !== 'boolean') throw new RangeError('Use nonnegative m≤ell, finite plane coordinates and an xz or xy slice');
  const radius = Math.hypot(x, vertical), radial = hydrogenRadial(n, ell, radius);
  if (radius === 0 && ell > 0) return 0;
  const cosine = plane === 'xy' ? 0 : radius === 0 ? 1 : Math.max(-1, Math.min(1, vertical / radius));
  const P = legendreP(ell, m, cosine);
  const angularNormalization = (2 * ell + 1) / (4 * Math.PI) * Math.exp(logFactorial(ell - m) - logFactorial(ell + m));
  let angular = angularNormalization * P * P;
  if (real && m > 0) {
    const transverseRadius = plane === 'xy' ? radius : Math.abs(x), cosPhi = transverseRadius ? x / transverseRadius : 1;
    let a = 1, b = cosPhi;
    for (let j = 2; j <= m; j++) [a, b] = [b, 2 * cosPhi * b - a];
    angular *= 2 * b * b;
  }
  return radial.R * radial.R * angular;
}
