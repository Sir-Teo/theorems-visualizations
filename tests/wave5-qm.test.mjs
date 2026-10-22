import test from 'node:test';
import assert from 'node:assert/strict';
import { boxLevels, ratioValue, oscillatorShell, hydrogenRadial, sphericalBessel, sphericalWellRoot, sphericalWellRadial, finiteSphericalWell, hydrogenMoments,
  COULOMB_CONSTANTS as C, reducedMassRatio, hydrogenLine, isotopeLineShift, rotorAbsorption, so4Generator, rydbergPacket, packetCircleDensity, orbitalSliceDensity } from '../content/qm/ch08.shared.js';

test('cube shell multiplicities and rectangular splitting use exact rational energies', () => {
  const cube = boxLevels();
  assert.deepEqual(cube.levels.slice(0, 5).map(x => [ratioValue(x.energy), x.states.length]), [[3, 1], [6, 3], [9, 3], [11, 3], [12, 1]]);
  for (const lengths of [[5, 30, 17], [11, 13, 19], [20, 20, 10]]) {
    const small = boxLevels(lengths, 3), larger = boxLevels(lengths, 7);
    for (const level of small.levels.filter(x => x.certifiedComplete)) {
      const same = larger.levels.find(x => x.energy.n * level.energy.d === level.energy.n * x.energy.d);
      assert.deepEqual(same.states, level.states);
    }
    assert.ok(small.levels.some(x => !x.certifiedComplete));
  }
});

test('Cartesian and spherical oscillator bases count the same complete shell', () => {
  for (let N = 0; N <= 20; N++) {
    const shell = oscillatorShell(N);
    assert.equal(shell.cartesian.length, shell.degeneracy); assert.equal(shell.spherical.length, shell.degeneracy);
    assert.equal(new Set(shell.cartesian.map(x => x.join(','))).size, shell.degeneracy);
    shell.cartesian.forEach(x => assert.equal(x.reduce((a, b) => a + b), N));
    shell.spherical.forEach(({ radial, ell, m }) => { assert.equal(2 * radial + ell, N); assert.ok(Math.abs(m) <= ell); });
  }
});

test('hydrogen radial values agree with independent elementary1s,2s,2p expressions', () => {
  for (const Z of [.5, 1, 2, 5]) for (const radius of [0, .1, .5, 1, 2, 5, 12]) {
    const rho = Z * radius;
    const expected = [2 * Z ** 1.5 * Math.exp(-rho), Z ** 1.5 * (2 - rho) * Math.exp(-rho / 2) / (2 * Math.sqrt(2)), Z ** 1.5 * rho * Math.exp(-rho / 2) / (2 * Math.sqrt(6))];
    for (const [j, n, ell] of [[0, 1, 0], [1, 2, 0], [2, 2, 1]]) assert.ok(Math.abs(hydrogenRadial(n, ell, radius, Z).R - expected[j]) < 2e-14 * Math.max(1, Math.abs(expected[j])));
  }
  assert.equal(hydrogenRadial(2, 0, 2).u, 0); assert.equal(hydrogenRadial(2, 0, 0).u, 0);
});

test('radial equation and analytic derivative agree with a separate finite-difference stencil', () => {
  for (let n = 1; n <= 6; n++) for (let ell = 0; ell < n; ell++) for (const radius of [.2, 1, 3, 7, 15]) {
    const z = hydrogenRadial(n, ell, radius), h = .0005;
    const [a, b, c, d] = [-2, -1, 1, 2].map(k => hydrogenRadial(n, ell, radius + k * h).u);
    const derivative = (a - 8 * b + 8 * c - d) / (12 * h), second = (-a + 16 * b - 30 * z.u + 16 * c - d) / (12 * h * h);
    assert.ok(Math.abs(derivative - z.du) < 1e-9); assert.ok(Math.abs(second - z.ddu) < 1e-7);
    assert.ok(Math.abs(z.equationResidual) < 1e-13);
  }
});

test('radial probability integrates to one on a controlled large window', () => {
  for (let n = 1; n <= 6; n++) for (let ell = 0; ell < n; ell++) {
    const right = 16 * n * n, steps = 12000, h = right / steps;
    let sum = 0;
    for (let j = 0; j <= steps; j++) sum += (j === 0 || j === steps ? 1 : j % 2 ? 4 : 2) * hydrogenRadial(n, ell, j * h).radialProbability;
    assert.ok(Math.abs(sum * h / 3 - 1) < 2e-7, `n=${n},ell=${ell},integral=${sum * h / 3}`);
  }
});

test('model domains refuse malformed powers, sparse lengths and invalid quantum numbers', () => {
  for (const fn of [() => boxLevels(new Array(3)), () => boxLevels([10, 10, 0]), () => oscillatorShell(.5), () => hydrogenRadial(2, 2, 1), () => hydrogenRadial(1, 0, -1), () => hydrogenRadial(1, 0, 5000, 5)]) assert.throws(fn);
});

test('near-origin waveforms and combined equation products do not invent nonfinite values', () => {
  for (let ell = 0; ell <= 3; ell++) for (const radius of [Number.MIN_VALUE, 1e-200, 1e-100, 1e-10]) {
    const z = hydrogenRadial(4, ell, radius);
    for (const [key, value] of Object.entries(z)) if (typeof value === 'number') assert.ok(Number.isFinite(value), key);
    assert.ok(Math.abs(z.equationResidual) < 1e-12);
    if (ell === 0) assert.equal(z.barrier, 0);
    if (radius === Number.MIN_VALUE) assert.match(z.equationStatus, /overflow/);
  }
  assert.equal(hydrogenRadial(1, 0, 0).equationResidual, null);
});

test('spherical Bessel root branches exclude the origin and normalize the well states', () => {
  for (let index = 1; index <= 8; index++) assert.ok(Math.abs(sphericalWellRoot(0, index).root - index * Math.PI) < 1e-13);
  for (const [ell, reference] of [[1, 4.493409457909064], [2, 5.763459196894550], [3, 6.987932000500520]]) assert.ok(Math.abs(sphericalWellRoot(ell, 1).root - reference) < 1e-13);
  for (let ell = 0; ell <= 6; ell++) for (let index = 1; index <= 8; index++) {
    const level = sphericalWellRoot(ell, index);
    assert.ok(Math.abs(level.residual) < 1e-14);
    let integral = 0; const steps = 1200;
    for (let j = 0; j <= steps; j++) integral += (j === 0 || j === steps ? 1 : j % 2 ? 4 : 2) * sphericalWellRadial(ell, index, j / steps).radialProbability;
    assert.ok(Math.abs(integral / (3 * steps) - 1) < 1e-8);
  }
  assert.equal(sphericalBessel(0, 0), 1); assert.equal(sphericalBessel(6, 0), 0);
});

test('finite spherical well distinguishes no binding, unresolved threshold and normalized first state', () => {
  const threshold = Math.PI ** 2 / 4;
  assert.equal(finiteSphericalWell(0).bound, false);
  assert.equal(finiteSphericalWell(threshold - 1e-8).bound, false);
  assert.equal(finiteSphericalWell(threshold).bound, null);
  for (const excess of [1e-13, 1e-10, 1e-8]) {
    const z = finiteSphericalWell(threshold + excess);
    assert.ok(Math.abs(z.kappa / ((z.D - threshold) / 2) - 1) < 1e-7);
    assert.ok(Math.abs(z.depthResidual) < 1e-20);
  }
  for (const D of [threshold + 1e-5, 3, 5, 10, 100]) {
    const z = finiteSphericalWell(D);
    assert.equal(z.bound, true); assert.ok(z.energy < 0 && z.energy > -D);
    assert.ok(Math.abs(z.matchingResidual) < 1e-9);
    const inside = .5 - Math.sin(2 * z.q) / (4 * z.q), outside = Math.sin(z.q) ** 2 / (2 * z.kappa);
    assert.ok(Math.abs(z.normalization ** 2 * (inside + outside) - 1) < 1e-14);
    assert.ok(z.outsideProbability > 0 && z.outsideProbability < 1);
  }
});

test('integer polynomial gamma integrals give exact Coulomb virial moments for every displayed state', () => {
  for (let n = 1; n <= 12; n++) for (let ell = 0; ell < n; ell++) {
    const z = hydrogenMoments(n, ell);
    assert.deepEqual(z.normalization, { n: 1n, d: 1n });
    assert.equal(z.kinetic.n * 2n * BigInt(n * n), z.kinetic.d);
    assert.equal(z.potential.n * BigInt(n * n), -z.potential.d);
    assert.equal(2n * z.meanRadius.n, BigInt(3 * n * n - ell * (ell + 1)) * z.meanRadius.d);
  }
  const z = hydrogenMoments(3, 1, 2);
  assert.equal(z.T, 2 / 9); assert.equal(z.V, -4 / 9); assert.equal(z.meanR, 6.25);
});

test('Coulomb photons use vacuum units, reduced nuclear mass and a stable signed isotope difference', () => {
  const fixed = hydrogenLine(2, 3, 1, null), hydrogen = hydrogenLine(), deuterium = hydrogenLine(2, 3, 1, C.deuteronMassRatio);
  assert.ok(hydrogen.vacuumNanometers > deuterium.vacuumNanometers && deuterium.vacuumNanometers > fixed.vacuumNanometers);
  assert.ok(Math.abs(hydrogen.vacuumNanometers - 656.4696063332441) < 1e-10);
  assert.equal(reducedMassRatio(1), .5); assert.equal(reducedMassRatio(null), 1);
  for (const [lower, upper] of [[1, 2], [2, 3], [3, 11], [199, 200]]) for (const Z of [1, 2, 10]) {
    const z = hydrogenLine(lower, upper, Z, null), x = hydrogenLine(lower, upper, 1, null);
    assert.ok(Math.abs(z.electronVolts / (C.planck * z.frequency / C.charge) - 1) < 1e-15);
    assert.ok(Math.abs(z.wavenumber / x.wavenumber - Z * Z) < 1e-12);
  }
  const ab = isotopeLineShift(), ba = isotopeLineShift(2, 3, C.deuteronMassRatio, C.protonMassRatio);
  assert.equal(ab.frequencyShift, -ba.frequencyShift); assert.ok(ab.vacuumNanometerShift < 0);
  assert.ok(Math.abs(ab.b.vacuumNanometers - ab.a.vacuumNanometers - ab.vacuumNanometerShift) < 1e-12);
  assert.equal(isotopeLineShift(2, 3, null, null).wavenumberShift, 0);
});

test('z-polarized rotor intensities vanish with the permanent dipole while levels persist', () => {
  for (let J = 0; J <= 20; J++) for (let m = -J; m <= J; m++) {
    const a = rotorAbsorption(J, m, 1, 1), b = rotorAbsorption(J, m, 2, 0);
    assert.equal(a.gap, a.finalEnergy - a.initialEnergy);
    assert.equal(b.gap, a.gap / 2); assert.equal(b.strength, 0);
    assert.ok(a.strength > 0 && a.strength <= 1);
  }
  assert.equal(rotorAbsorption(0, 0).strength, 1 / 3);
  assert.equal(rotorAbsorption(0, 0, 1, 1e-200).strengthUnderflow, true);
  assert.equal(rotorAbsorption(0, 0, 1, 0).strengthUnderflow, false);
});

test('coupled SO(4) generator has the independent closed matrix elements and handles annihilation', () => {
  for (let n = 1; n <= 6; n++) for (let ell = 0; ell < n; ell++) for (let m = -ell; m <= ell; m++) {
    const z = so4Generator(n, ell, m);
    assert.ok(Math.abs(z.inputNorm - 1) < 2e-14);
    assert.ok(Math.abs(z.normResidual) < 2e-13);
    assert.equal(z.orbitalMultiplets.reduce((s, x) => s + x.degeneracy, 0), n * n);
    for (const row of z.rows) {
      const l = Math.max(ell, row.ell);
      const square = Math.abs(row.ell - ell) === 1 ? (n * n - l * l) * (l * l - m * m) / ((2 * l - 1) * (2 * l + 1)) : 0;
      assert.ok(Math.abs(row.normSquared - square) < 2e-13);
    }
  }
  assert.equal(so4Generator(1, 0, 0).annihilated, true);
  assert.equal(so4Generator(4, 3, 3).annihilated, true);
});

test('finite circular-state packets normalize on their declared conditional circle and separate two fidelities', () => {
  for (const n of [20, 30, 60]) for (const sigma of [1, 2, 3]) for (const cycles of [0, .25, 1, 2 * n / 3, 80]) {
    const p = rydbergPacket(n, sigma, cycles), count = 256;
    const integral = Array.from({ length: count }, (_, j) => packetCircleDensity(p, 2 * Math.PI * j / count)).reduce((a, b) => a + b, 0) * 2 * Math.PI / count;
    assert.ok(Math.abs(integral - 1) < 2e-13);
    assert.ok(Math.abs(p.rows.reduce((s, r) => s + r.population, 0) - 1) < 1e-14);
    for (const x of [p.fullStateAutocorrelation, p.rotatingFrameFidelity]) assert.ok(x >= 0 && x < 1 + 1e-14);
    if (cycles === 0) assert.ok(Math.abs(p.fullStateAutocorrelation - 1) < 1e-14);
  }
  const p = rydbergPacket(30, 2, .25);
  assert.ok(p.rotatingFrameFidelity > p.fullStateAutocorrelation + .2);
  assert.throws(() => packetCircleDensity(p, Number.MAX_VALUE));
});

test('coordinate-based orbital slices preserve exact nodal planes and distinguish real from complex 2p density', () => {
  for (const [x, y] of [[0, 0], [0, 1], [1, 0], [1, 2], [-2, 3], [.2, -.7]]) {
    const radius = Math.hypot(x, y);
    const density = (ell, m, plane, real = false) => orbitalSliceDensity(ell ? 2 : 1, ell, m, x, y, plane, real);
    assert.ok(Math.abs(density(0, 0, 'xy') - Math.exp(-2 * radius) / Math.PI) < 1e-15);
    assert.ok(Math.abs(density(1, 0, 'xz') - y * y * Math.exp(-radius) / (32 * Math.PI)) < 1e-16);
    assert.equal(density(1, 0, 'xy'), 0);
    assert.ok(Math.abs(density(1, 1, 'xy') - (x * x + y * y) * Math.exp(-radius) / (64 * Math.PI)) < 1e-16);
    assert.ok(Math.abs(density(1, 1, 'xy', true) - x * x * Math.exp(-radius) / (32 * Math.PI)) < 1e-16);
  }
  for (let ell = 1; ell <= 8; ell++) for (let m = 0; m <= ell; m++) if ((ell - m) % 2) {
    assert.equal(orbitalSliceDensity(ell + 1, ell, m, 2, 3, 'xy'), 0);
    assert.equal(orbitalSliceDensity(ell + 1, ell, m, 2, 3, 'xy', true), 0);
  }
  assert.equal(orbitalSliceDensity(2, 1, 1, 0, 1, 'xy', true), 0);
});

test('all fifteen frozen identities and source-aligned syllabus rows are preserved', async () => {
  const { readFileSync } = await import('node:fs');
  const a = (await import('../content/qm/ch08.js')).default, b = (await import('../content/qm/ch08-b.js')).default;
  const syllabus = (await import('../content/qm/syllabus.js')).default.chapters.find(c => c.n === 8);
  const plan = JSON.parse(readFileSync(new URL('../docs/wave-five-plan.json', import.meta.url))).chapters.find(c => c.collection === 'qm' && c.chapter === 8);
  const items = [...a.items, ...b.items], key = i => [i.num, i.kind, i.name];
  assert.deepEqual(items.map(key), plan.items.map(key)); assert.deepEqual(syllabus.items.map(key), plan.items.map(key));
  for (const [j, item] of items.entries()) {
    assert.equal(typeof item.viz, 'function');
    for (const field of ['statement', 'idea', 'scope', 'caption']) assert.ok(item[field].length > 50, item.num + ' ' + field);
    assert.deepEqual(syllabus.items[j].deps, item.deps); assert.deepEqual(syllabus.items[j].refs, item.refs);
    assert.equal(syllabus.items[j].pic, item.caption);
  }
  assert.deepEqual(items.filter(i => i.verify).map(i => i.num), ['8.13']);
  assert.ok(items[1].deps.includes('qm-7.5'));
  assert.ok(items[14].deps.includes('qm-8.4')); assert.ok(items[14].see.includes('qm-8.5'));
});
