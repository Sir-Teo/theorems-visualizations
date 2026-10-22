import test from 'node:test';
import assert from 'node:assert/strict';
import { CONE_TABLE } from '../content/psych/ch05.data.js';
import { decimal, fraction, compare, coneRow, coneMatrix, nullSpace, metamerModel, univariance, wavelengthInformation, opponentSignals, inverseOpponent, cancellation, orientationAftereffect, matchingAnalogue, illuminantAmbiguity, DRESS_REPORT } from '../content/psych/ch05.shared.js';

// Independent integer determinants: every source decimal has at most 12 places.
const SCALE = 10n ** 12n;
function integer(s) { const [a, b = ''] = s.split('.'); return BigInt(a) * SCALE + BigInt(b.padEnd(12, '0')); }
const determinant = a => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
const source = wavelength => CONE_TABLE[(wavelength - 390) / 5].slice(1).map(integer);
const number = s => Number(s.n) / Number(s.d);

test('selected CIE rows retain exact published strings and complete S support', () => {
  assert.equal(CONE_TABLE.length, 46);
  assert.deepEqual(CONE_TABLE[0], ['390', '0.0004150019', '0.0003683495', '0.009547289']);
  assert.deepEqual(CONE_TABLE[31], ['545', '0.919073', '0.9971948', '0.003168911']);
  CONE_TABLE.forEach((row, i) => { assert.equal(+row[0], 390 + 5 * i); assert.equal(row.length, 4); assert.ok(row.slice(1).every(x => Number(x) > 0)); });
  assert.throws(() => coneRow(620)); assert.throws(() => coneRow(502));
});

test('decimal arithmetic preserves signed values and rejects nondecimal syntax', () => {
  assert.equal(fraction(decimal('-0.125')), '-1/8');
  for (const x of ['1e-3', 'Infinity', 'NaN', ' .5', '.5', '1/2', '', '1'.repeat(65)]) assert.throws(() => decimal(x));
});

test('RREF kernel agrees with independently computed cofactors across source grids', () => {
  let fullRank = 0;
  for (let i = 0; i < 46; i += 3) {
    const wavelengths = [390 + 5 * i, 390 + 5 * ((i + 9) % 46), 390 + 5 * ((i + 20) % 46), 390 + 5 * ((i + 33) % 46)];
    const columns = wavelengths.map(source), a = [0, 1, 2].map(j => columns.map(c => c[j]));
    const cofactor = [0, 1, 2, 3].map(j => (j % 2 ? -1n : 1n) * determinant(a.map(row => row.filter((_, k) => k !== j))));
    const result = nullSpace(coneMatrix(wavelengths));
    if (cofactor.some(x => x !== 0n)) {
      fullRank++; assert.equal(result.rank, 3); assert.equal(result.basis.length, 1);
      const pivot = cofactor.findIndex(x => x !== 0n), v = result.basis[0];
      for (let j = 0; j < 4; j++) assert.equal(v[j].n * v[pivot].d * cofactor[pivot], v[pivot].n * v[j].d * cofactor[j]);
    }
  }
  assert.equal(fullRank, 16);
});

test('rank collapse retains the complete null space rather than a zero cofactor vector', () => {
  for (const [wavelengths, rank] of [[[440, 440, 560, 610], 3], [[440, 440, 560, 560], 2], [[500, 500, 500, 500], 1]]) {
    const r = nullSpace(coneMatrix(wavelengths)); assert.equal(r.rank, rank); assert.equal(r.basis.length, 4 - rank);
    for (let j = 0; j < r.basis.length; j++) for (let tick = -100; tick <= 100; tick += 10) assert.ok(metamerModel(wavelengths, ['0.2', '0.4', '0.6', '0.8'], tick, j).exactEqual);
  }
});

test('physical metamer endpoints lie in the cube and exact cone responses agree', () => {
  for (const powers of [['0.5', '0.5', '0.5', '0.5'], ['0', '0.3', '1', '0.8'], ['1', '1', '1', '1']]) {
    for (let tick = -100; tick <= 100; tick++) {
      const m = metamerModel(undefined, powers, tick);
      assert.ok(m.exactEqual);
      for (const x of m.edited) { assert.ok(compare(x, decimal(0)) >= 0); assert.ok(compare(x, decimal(1)) <= 0); }
      const rawColumns = [440, 500, 560, 610].map(source);
      for (let row = 0; row < 3; row++) {
        const a = m.base.reduce((sum, x, j) => sum + number(x) * Number(rawColumns[j][row]) / Number(SCALE), 0);
        const b = m.edited.reduce((sum, x, j) => sum + number(x) * Number(rawColumns[j][row]) / Number(SCALE), 0);
        assert.ok(Math.abs(a - b) < 1e-14);
      }
    }
  }
});

test('the physical black fiber is a singleton despite nonzero algebraic nullity', () => {
  for (const wavelengths of [[440, 500, 560, 610], [500, 500, 500, 500]]) {
    const m = metamerModel(wavelengths, ['0', '0', '0', '0'], 100);
    assert.ok(m.basis.length > 0); assert.ok(m.collapsed); assert.ok(m.edited.every(x => x.n === 0n));
  }
});

test('equal single-cone catch matches exactly and does not promise universal discrimination', () => {
  for (let a = 390; a <= 615; a += 15) for (let b = 390; b <= 615; b += 20) for (let cone = 0; cone < 3; cone++) {
    const m = univariance(a, b, cone, '0.7'); assert.equal(compare(m.signalsA[cone], m.signalsB[cone]), 0);
    if (a === b) assert.ok(m.signalsA.every((x, j) => compare(x, m.signalsB[j]) === 0));
  }
  const black = univariance(450, 560, 0, '0'); assert.ok(black.signalsB.every(x => x.n === 0n));
});

test('unknown intensity removes all wavelength information from one cone class', () => {
  for (let wavelength = 390; wavelength <= 615; wavelength += 5) for (let cone = 0; cone < 3; cone++) {
    const m = wavelengthInformation(wavelength, [cone]); assert.equal(m.information, 0); assert.equal(m.localScale, null);
  }
});

test('nuisance-adjusted information agrees with an independent projection and scales correctly', () => {
  for (let wavelength = 395; wavelength < 615; wavelength += 5) {
    const m = wavelengthInformation(wavelength), s = m.sensitivity, d = m.slope;
    const dot = (a, b) => a.reduce((sum, x, j) => sum + x * b[j], 0), coefficient = dot(d, s) / dot(s, s);
    const projection = d.map((x, j) => x - coefficient * s[j]);
    assert.ok(Math.abs(m.information - dot(projection, projection) / .01 ** 2) < 1e-10);
    assert.ok(Math.abs(wavelengthInformation(wavelength, [0, 1, 2], 2).information / m.information - 4) < 1e-12);
    assert.ok(Math.abs(wavelengthInformation(wavelength, [0, 1, 2], 1, .02).information / m.information - .25) < 1e-12);
  }
});

test('declared opponent recoding is invertible and cone deletion need not silence a channel', () => {
  for (let l = 0; l < 5; l++) for (let m = 0; m < 5; m++) for (let s = 0; s < 5; s++) assert.deepEqual(inverseOpponent(opponentSignals([l, m, s])), [l, m, s]);
  assert.deepEqual(opponentSignals([0, 1, 2]), [1, -1, 1.5]);
});

test('malformed, sparse and out-of-domain model controls are refused', () => {
  const sparse = new Array(4); sparse[0] = .5;
  for (const fn of [() => metamerModel(undefined, sparse), () => metamerModel(undefined, ['0', '0', '2', '0']), () => metamerModel(undefined, undefined, .5), () => metamerModel(undefined, undefined, 0, 1), () => wavelengthInformation(500, [0, 0]), () => wavelengthInformation(500, new Array(1)), () => wavelengthInformation(500, [0], 0), () => opponentSignals([0, , 1]), () => univariance(500, 500, 3)]) assert.throws(fn);
});

test('cancellation respects additive signs, already-zero tests and nonunique zero paths', () => {
  const a = cancellation(580, 500); assert.ok(a.reachable); assert.ok(Math.abs(a.test + a.amount * a.cancel) < 1e-15);
  assert.equal(cancellation(580, 610).reachable, false);
  const row = CONE_TABLE[(500 - 390) / 5].slice(1).map(Number), weight = row[0] / row[1];
  const zero = cancellation(500, 500, 0, weight); assert.equal(zero.amount, 0); assert.ok(zero.reachable && zero.nonunique);
  const already = cancellation(500, 580, 0, weight); assert.equal(already.amount, 0); assert.ok(already.reachable); assert.equal(already.nonunique, false);
});

test('orientation memory starts at zero, decays and changes sign at orthogonal orientations', () => {
  assert.ok(orientationAftereffect(0, 0).response === 0);
  for (let adaptation = 1; adaptation <= 300; adaptation += 13) {
    const early = orientationAftereffect(adaptation, 0), late = orientationAftereffect(adaptation, 600);
    assert.ok(early.fast > late.fast && early.slow > late.slow);
    assert.equal(orientationAftereffect(adaptation, 0, 90).response, -early.response);
    assert.equal(orientationAftereffect(adaptation, 0, 180).response, early.response);
    assert.ok(Math.abs(orientationAftereffect(adaptation, 0, 45).response) < 1e-15);
  }
});

test('matching brightness is a true least-squares optimum and single-cone matches are reachable', () => {
  for (let mix = 0; mix <= 100; mix++) for (const retained of ['L', 'M', 'LM']) {
    const m = matchingAnalogue(mix, 1, retained);
    assert.ok(m.fittedTargetPower >= 0 && m.fittedTargetPower <= 3);
    const optimum = matchingAnalogue(mix, m.fittedTargetPower, retained);
    assert.ok(Math.abs(optimum.mismatch - m.bestBrightnessMismatch) < 1e-14);
    if (retained !== 'LM') assert.ok(optimum.mismatch < 1e-14);
    const lower = matchingAnalogue(mix, Math.max(0, m.fittedTargetPower - .05), retained);
    const upper = matchingAnalogue(mix, Math.min(3, m.fittedTargetPower + .05), retained);
    assert.ok(lower.mismatch + 1e-14 >= optimum.mismatch && upper.mismatch + 1e-14 >= optimum.mismatch);
  }
});

test('illumination ambiguity preserves positive physical factors across the offered domain', () => {
  for (let tick = -100; tick <= 100; tick++) for (let energy = 1; energy <= 6; energy++) {
    const m = illuminantAmbiguity(tick / 100, energy / 10);
    assert.ok(m.inferred.every(x => x >= 0 && x <= 1)); assert.ok(m.illuminant.every(x => x > 0));
    assert.ok(m.productResidual < 2e-16);
    const reference = illuminantAmbiguity(0, energy / 10);
    assert.ok(m.cone.every((x, j) => Math.abs(x - reference.cone[j]) < 1e-15));
  }
  assert.deepEqual(DRESS_REPORT.map(x => x.percent), [57, 30, 11, 2]);
  for (const bad of [Number.MIN_VALUE, 1e-200, 1e200]) assert.throws(() => wavelengthInformation(500, [0, 1, 2], bad, bad));
});
