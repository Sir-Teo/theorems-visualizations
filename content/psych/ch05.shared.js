import { CONE_TABLE } from './ch05.data.js';

// Exact arithmetic concerns the published rounded decimal table, not physiology.
const abs = n => n < 0n ? -n : n;
const gcd = (a, b) => { a = abs(a); b = abs(b); while (b) [a, b] = [b, a % b]; return a; };
export function rational(n, d = 1n) {
  if (typeof n !== 'bigint' || typeof d !== 'bigint' || !d) throw new RangeError('Integer numerator and nonzero denominator required');
  if (d < 0n) { n = -n; d = -d; }
  const g = gcd(n, d); return Object.freeze({ n: n / g, d: d / g });
}
export function decimal(value) {
  const s = String(value);
  if (s.length > 64 || !/^-?\d+(?:\.\d+)?$/.test(s)) throw new RangeError('A finite ordinary decimal with at most 64 characters is required');
  const sign = s.startsWith('-') ? -1n : 1n, [a, b = ''] = s.replace(/^-/, '').split('.');
  return rational(sign * BigInt(a + b), 10n ** BigInt(b.length));
}
export const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a, b) => rational(a.n * b.n, a.d * b.d);
export const div = (a, b) => rational(a.n * b.d, a.d * b.n);
export const negate = a => rational(-a.n, a.d);
export const compare = (a, b) => a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;
export const valueOf = a => Number(a.n) / Number(a.d);
export const fraction = a => a.d === 1n ? String(a.n) : `${a.n}/${a.d}`;
const ZERO = rational(0n), ONE = rational(1n);
const dense = (a, n) => Array.isArray(a) && a.length === n && Array.from({ length: n }, (_, i) => Object.hasOwn(a, i)).every(Boolean);
export function coneRow(wavelength) {
  if (!Number.isInteger(wavelength) || wavelength < 390 || wavelength > 615 || wavelength % 5) throw new RangeError('Select a tabulated 5nm wavelength from 390 through 615nm');
  return CONE_TABLE[(wavelength - 390) / 5].slice(1).map(decimal);
}
export function coneMatrix(wavelengths) {
  if (!dense(wavelengths, 4)) throw new RangeError('Four source wavelengths are required');
  const columns = wavelengths.map(coneRow);
  return [0, 1, 2].map(j => columns.map(c => c[j]));
}
export const product = (matrix, vector) => matrix.map(row => row.reduce((s, a, i) => add(s, mul(a, vector[i])), ZERO));

// Full RREF retains extra null directions when selected wavelengths coincide.
export function nullSpace(matrix) {
  if (!dense(matrix, 3) || !matrix.every(row => dense(row, 4))) throw new RangeError('A dense 3 by 4 rational matrix is required');
  const a = matrix.map(row => row.slice()), pivots = []; let r = 0;
  for (let c = 0; c < 4 && r < 3; c++) {
    const p = a.findIndex((row, j) => j >= r && row[c].n !== 0n);
    if (p < 0) continue;
    [a[r], a[p]] = [a[p], a[r]];
    const pivot = a[r][c]; a[r] = a[r].map(x => div(x, pivot));
    for (let j = 0; j < 3; j++) if (j !== r) {
      const coefficient = a[j][c]; a[j] = a[j].map((x, k) => sub(x, mul(coefficient, a[r][k])));
    }
    pivots.push(c); r++;
  }
  const free = [0, 1, 2, 3].filter(c => !pivots.includes(c));
  const basis = free.map(c => {
    const v = [ZERO, ZERO, ZERO, ZERO]; v[c] = ONE;
    pivots.forEach((p, j) => { v[p] = negate(a[j][c]); });
    return v;
  });
  return { rank: r, basis, pivots, free };
}
export function metamerModel(wavelengths = [440, 500, 560, 610], powers = ['0.5', '0.5', '0.5', '0.5'], tick = 0, basisIndex = 0) {
  if (!dense(powers, 4) || !Number.isInteger(tick) || Math.abs(tick) > 100) throw new RangeError('Four powers and an integer tick from −100 through 100 are required');
  const base = powers.map(decimal);
  if (base.some(x => compare(x, ZERO) < 0 || compare(x, ONE) > 0)) throw new RangeError('Each primary power must lie in 0–1');
  const matrix = coneMatrix(wavelengths), space = nullSpace(matrix);
  if (!Number.isInteger(basisIndex) || basisIndex < 0 || basisIndex >= space.basis.length) throw new RangeError('Select an available null direction');
  const raw = space.basis[basisIndex], scale = raw.reduce((s, x) => compare(rational(abs(x.n), x.d), s) > 0 ? rational(abs(x.n), x.d) : s, ZERO);
  const direction = raw.map(x => div(x, scale)); let lo = null, hi = null;
  for (let j = 0; j < 4; j++) if (direction[j].n) {
    let a = div(negate(base[j]), direction[j]), b = div(sub(ONE, base[j]), direction[j]);
    if (compare(a, b) > 0) [a, b] = [b, a];
    if (lo === null || compare(a, lo) > 0) lo = a;
    if (hi === null || compare(b, hi) < 0) hi = b;
  }
  const parameter = mul(rational(BigInt(Math.abs(tick)), 100n), tick < 0 ? lo : hi);
  const edited = base.map((x, j) => add(x, mul(parameter, direction[j])));
  const before = product(matrix, base), after = product(matrix, edited);
  return { wavelengths: wavelengths.slice(), base, edited, matrix, ...space, direction, interval: [lo, hi], parameter, before, after,
    exactEqual: before.every((x, j) => compare(x, after[j]) === 0), collapsed: compare(lo, hi) === 0 };
}
export function univariance(wavelengthA = 450, wavelengthB = 560, cone = 0, power = '1') {
  if (!Number.isInteger(cone) || cone < 0 || cone > 2) throw new RangeError('Select L, M or S');
  const a = coneRow(wavelengthA), b = coneRow(wavelengthB), p = decimal(power);
  if (compare(p, ZERO) < 0 || compare(p, rational(2n)) > 0) throw new RangeError('Reference power must lie in0–2');
  const matchedPower = div(mul(p, a[cone]), b[cone]);
  return { a, b, power: p, matchedPower, signalsA: a.map(x => mul(p, x)), signalsB: b.map(x => mul(matchedPower, x)), cone };
}

// Independent equal-variance Gaussian cone noise, with unknown intensity.
// The sum of squared2 by2 minors avoids cancellation in the projection norm.
export function wavelengthInformation(wavelength = 500, classes = [0, 1, 2], intensity = 1, sigma = .01) {
  coneRow(wavelength);
  if (!Array.isArray(classes) || !classes.length || classes.length > 3 || new Set(classes).size !== classes.length || !Array.from(classes).every(j => Number.isInteger(j) && j >= 0 && j <= 2)) throw new RangeError('Distinct cone classes required');
  if (!Number.isFinite(intensity) || intensity < .1 || intensity > 2 || !Number.isFinite(sigma) || sigma < .001 || sigma > .1) throw new RangeError('Use intensity 0.1–2 and noise0.001–0.1 in the declared model domain');
  const left = Math.max(390, wavelength - 5), right = Math.min(615, wavelength + 5), a = coneRow(left), b = coneRow(right);
  const s = coneRow(wavelength).map(valueOf), slope = a.map((x, j) => valueOf(sub(b[j], x)) / (right - left));
  let minors = 0, norm = 0;
  for (const i of classes) { norm += s[i] ** 2; for (const j of classes) if (j > i) minors += (s[i] * slope[j] - s[j] * slope[i]) ** 2; }
  const information = intensity ** 2 * minors / (sigma ** 2 * norm);
  return { wavelength, classes: classes.slice(), sensitivity: s, slope, left, right, information, localScale: information ? 1 / Math.sqrt(information) : null };
}
export function opponentSignals(lms) {
  if (!dense(lms, 3) || !lms.every(Number.isFinite)) throw new RangeError('Three finite cone signals required');
  const [l, m, s] = lms; return [l + m, l - m, s - (l + m) / 2];
}
export function inverseOpponent(channels) {
  if (!dense(channels, 3) || !channels.every(Number.isFinite)) throw new RangeError('Three finite channels required');
  const [sum, difference, blue] = channels; return [(sum + difference) / 2, (sum - difference) / 2, blue + sum / 2];
}

export function cancellation(wavelength = 580, cancelWavelength = 500, axis = 0, weight = 1) {
  if (![0, 1].includes(axis) || !Number.isFinite(weight) || weight < .25 || weight > 4) throw new RangeError('Select a model axis and weight 0.25–4');
  const signal = row => axis === 0 ? row[0] - weight * row[1] : row[2] - weight * (row[0] + row[1]) / 2;
  const test = signal(coneRow(wavelength).map(valueOf)), cancel = signal(coneRow(cancelWavelength).map(valueOf));
  const amount = test === 0 ? 0 : cancel === 0 ? null : -test / cancel;
  return { test, cancel, nonunique: test === 0 && cancel === 0, amount: amount !== null && amount >= 0 ? amount : null, reachable: amount !== null && amount >= 0 };
}

// A declared orientation-selective two-timescale illustration, not fitted data.
export function orientationAftereffect(adaptation = 30, recovery = 10, testAngle = 0, fastTau = 30, slowTau = 600) {
  if (![adaptation, recovery, testAngle, fastTau, slowTau].every(Number.isFinite) || adaptation < 0 || adaptation > 300 || recovery < 0 || recovery > 600 || Math.abs(testAngle) > 180 || fastTau < 1 || fastTau > 100 || slowTau < 100 || slowTau > 2000) throw new RangeError('Use the declared finite adaptation/recovery domain');
  const fast = -Math.expm1(-adaptation / fastTau) * Math.exp(-recovery / fastTau);
  const slow = .35 * -Math.expm1(-adaptation / slowTau) * Math.exp(-recovery / slowTau);
  const selectivity = Math.cos(2 * testAngle * Math.PI / 180);
  return { fast, slow, selectivity, response: -(fast + slow) * selectivity };
}

// Deliberately not a literal instrument: three wavelengths within the complete table.
export function matchingAnalogue(mixTick = 50, targetPower = 1, retained = 'LM') {
  if (!Number.isInteger(mixTick) || mixTick < 0 || mixTick > 100 || !Number.isFinite(targetPower) || targetPower < 0 || targetPower > 3 || !['LM', 'L', 'M'].includes(retained)) throw new RangeError('Valid mixture tick, target power and retained cone choice required');
  const green = coneRow(545).map(valueOf), red = coneRow(610).map(valueOf), yellow = coneRow(590).map(valueOf);
  const mixture = green.map((x, j) => (1 - mixTick / 100) * x + mixTick / 100 * red[j]);
  const indices = retained === 'LM' ? [0, 1] : [retained === 'L' ? 0 : 1];
  const a = indices.reduce((s, j) => s + yellow[j] * mixture[j], 0), b = indices.reduce((s, j) => s + yellow[j] ** 2, 0);
  const fittedTargetPower = a / b;
  const target = yellow.map(x => targetPower * x), fitted = yellow.map(x => fittedTargetPower * x);
  return { mixture, target, fittedTargetPower, fitted, indices,
    mismatch: Math.hypot(...indices.map(j => mixture[j] - target[j])),
    bestBrightnessMismatch: Math.hypot(...indices.map(j => mixture[j] - fitted[j])) };
}

export const DRESS_REPORT = Object.freeze([
  Object.freeze({ label: 'blue / black', percent: 57 }),
  Object.freeze({ label: 'white / gold', percent: 30 }),
  Object.freeze({ label: 'blue / brown', percent: 11 }),
  Object.freeze({ label: 'other', percent: 2 }),
]);
export function illuminantAmbiguity(tilt = 0, reflectance = .4) {
  if (!Number.isFinite(tilt) || Math.abs(tilt) > 1 || !Number.isFinite(reflectance) || reflectance < .1 || reflectance > .6) throw new RangeError('Use tilt −1–1 and base reflectance 0.1–0.6');
  const wavelengths = [440, 500, 560, 610], observed = wavelengths.map(() => reflectance);
  // Positive diagonal illumination; exact inverse product is the ambiguity.
  const illuminant = wavelengths.map((_, j) => Math.exp(tilt * (j - 1.5) / 3));
  const inferred = observed.map((x, j) => x / illuminant[j]);
  const reconstructed = inferred.map((x, j) => x * illuminant[j]);
  const cone = [0, 1, 2].map(k => wavelengths.reduce((sum, w, j) => sum + valueOf(coneRow(w)[k]) * reconstructed[j], 0));
  return { wavelengths, observed, illuminant, inferred, reconstructed, cone,
    productResidual: Math.max(...reconstructed.map((x, j) => Math.abs(x - observed[j]))) };
}
