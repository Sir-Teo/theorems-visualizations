import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/crypto/ch06.shared.js';
const near = (a, b, tolerance = 1e-12) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const decode = (code, base, length) => Array.from({ length }, (_, i) => Math.floor(code / base ** i) % base);

test('finite inversion accepts any preimage and weights image fibers by sampled inputs', () => {
  const f = [0, 0, 0, 0, 1, 1, 2, 3], r = H.inversion(f, 3, 1);
  assert.equal(r.candidate, 0); assert.equal(r.recoveredOriginal, false); assert.equal(r.success, .5);
  assert.deepEqual(H.inversion(f, 7, 0).trace, []);
  for (let code = 0; code < 256; code++) {
    const f = decode(code, 4, 4);
    for (let budget = 0; budget <= 4; budget++) {
      const successes = f.map((_, x) => H.inversion(f, x, budget));
      near(successes.filter(r => r.candidate !== null).length / 4, successes[0].success);
      successes.forEach(r => { if (r.candidate !== null) assert.equal(f[r.candidate], r.y); assert(r.trace.length <= budget); });
    }
  }
});
test('prefix decision search handles missing images and produces the lexicographically first witness', () => {
  for (let code = 0; code < 256; code++) for (let y = 0; y < 4; y++) {
    const f = decode(code, 4, 4), r = H.prefixInversion(f, y), expected = f.indexOf(y);
    assert.equal(r.candidate, expected < 0 ? null : expected); assert.equal(r.calls, expected < 0 ? 1 : 3);
    if (expected >= 0) { assert(r.verified); r.trace.forEach(row => assert(row.remaining.includes(expected))); }
  }
});
test('finite optimal prediction distinguishes permutations from statistically hidden fiber bits', () => {
  const b = [0, 1, 0, 1, 0, 1, 0, 1], p = Array(8).fill(0);
  assert.equal(H.predicateExperiment([0, 0, 1, 1, 2, 2, 3, 3], b, p).bestSuccess, .5);
  assert.equal(H.predicateExperiment([3, 0, 6, 1, 7, 4, 2, 5], b, p).bestSuccess, 1);
  for (let code = 0; code < 256; code++) {
    const f = decode(code, 4, 4), b = [0, 1, 1, 0], r = H.predicateExperiment(f, b, [0, 0, 0, 0]);
    const brute = Math.max(...Array.from({ length: 16 }, (_, t) => H.predicateExperiment(f, b, decode(t, 2, 4)).success));
    near(r.bestSuccess, brute); near(H.predicateExperiment(f, b, r.optimal).success, brute);
  }
});
test('Goldreich–Levin genuinely decodes perfect predictors and its noisy-coordinate bound holds over all shifts', () => {
  const f = [3, 0, 6, 1, 7, 4, 2, 5];
  for (let x = 0; x < 8; x++) for (const basis of [[0], [1, 2, 4], [0, 0, 0, 0]]) {
    const r = H.goldreichLevin(f, x, Array.from({ length: 8 }, (_, y) => H.dot(x, y)), basis);
    assert(r.containsHidden); assert(r.verified.includes(x)); assert.equal(r.guesses[r.trueGuess].candidate, x);
    assert.equal(r.queryCalls, 3 * (2 ** basis.length - 1));
  }
  for (let x = 0; x < 4; x++) {
    const p = Array.from({ length: 4 }, (_, y) => H.dot(x, y)); p[0] ^= 1;
    let failed = 0, bound;
    for (let code = 0; code < 256; code++) { const r = H.goldreichLevin([0, 0, 1, 1], x, p, decode(code, 4, 4)); failed += +(r.guesses[r.trueGuess].candidate !== x); bound = r.failureBound; r.verified.forEach(z => assert.equal([0, 0, 1, 1][z], [0, 0, 1, 1][x])); }
    assert(failed / 256 <= bound + 1e-12);
  }
});
test('distinguisher-to-predictor identity has the right signed gap and handles complement orientation', () => {
  let negative = 0, positive = 0;
  for (let d = 0; d < 256; d++) {
    const r = H.permutationGenerator([2, 0, 3, 1], [0, 1, 1, 0], decode(d, 2, 8));
    near(r.rawSuccess, .5 + r.gap); near(r.predictorSuccess, .5 + Math.abs(r.gap));
    negative += +(r.gap < 0); positive += +(r.gap > 0);
  }
  assert(negative && positive);
  assert.throws(() => H.permutationGenerator([0, 0, 1, 2], [0, 0, 0, 0], Array(8).fill(0)));
});
test('sequential hybrids conserve all mass, finish uniform, retain terminal state and telescope signed gaps', () => {
  for (const g of [[0, 0, 0, 0], [1, 2, 7, 4], [7, 6, 5, 4]]) for (let steps = 1; steps <= 6; steps++) for (const t of ['range', 'parity', 'weight', 'endpoints']) {
    const r = H.sequentialGenerator(g, 2, steps, t, 3);
    for (const h of r.hybrids) { near(H.sum(h.p), 1); assert.equal(H.sum(h.counts), h.samples); }
    r.hybrids.at(-1).p.forEach(p => near(p, 1 / r.size)); near(H.sum(r.signedGaps), r.totalGap);
    assert(Math.abs(r.totalGap) <= r.sumAbsolute + 1e-12); assert.equal(r.run.word % 4, r.run.state);
    if (t === 'range') { near(r.hybrids[0].acceptance, 1); near(r.hybrids.at(-1).acceptance, r.range.length / r.size); }
  }
  assert.equal(H.sequentialGenerator([0, 0, 0, 0], 0, 1, 'weight', 8).hybrids[0].acceptance, 0);
});
test('conditional hashing enumerates the public hash seed and preserves entropy bookkeeping', () => {
  const f = [0, 0, 0, 0, 1, 1, 1, 1], r = H.extraction(f, 0, 1, [1, 2, 4]);
  near(r.selected.averageTV, 1 / 8); near(r.selected.selected.tv, 0);
  const zero = H.extraction(f, 0, 1, [0, 0, 0]); near(zero.selected.selected.tv, .5); assert(zero.selected.selected.tv > zero.selected.bound);
  for (const table of [f, [0, 1, 2, 3, 4, 5, 6, 7], Array(8).fill(0), [0, 0, 0, 1, 2, 2, 3, 4]]) for (let width = 1; width <= 3; width++) {
    const q = H.extraction(table, 0, width, [1, 2, 4]); near(q.Houtput + q.Hconditional, 3); assert(q.conditionalTV <= q.bound + 1e-12);
    q.summary.forEach(a => { assert(a.averageTV <= a.bound + 1e-12); near(H.sum(a.selected.p), 1); if (a.K === 1) near(a.averageTV, 1 - 2 ** -width); });
  }
});
test('GGM paths cache shared prefixes and duplicate queries but reject variable-length ambiguity', () => {
  const g = [3, 18, 50, 29, 47, 8, 34, 61], r = H.ggm(g, 2, ['000', '001', '101', '000']);
  assert.deepEqual(r.outputs, [5, 7, 2, 5]); assert.equal(r.evaluations, 5); assert.equal(r.trace.at(-1).evaluations, 5);
  assert.equal(new Set(r.labels.map(a => a.prefix)).size, r.labels.length);
  assert.throws(() => H.ggm(g, 0, ['0', '00'])); assert.throws(() => H.queryWords('02')); assert.throws(() => H.queryWords(''));
});
test('Feistel is invertible for arbitrary rounds, while the three-round inverse relation always holds', () => {
  for (let code = 0; code < 64; code++) {
    const tables = [decode(code % 4, 2, 2), decode(Math.floor(code / 4) % 4, 2, 2), decode(Math.floor(code / 16), 2, 2)];
    for (let rounds = 1; rounds <= 3; rounds++) for (let x = 0; x < 4; x++) { const active = tables.slice(0, rounds), y = H.feistel(active, x).value; assert.equal(H.feistel(active, y, true).value, x); if (rounds === 3) assert(H.feistelExperiment(active, x).inverseRelation); }
  }
  for (let t = 0; t < 20; t++) { const tables = Array.from({ length: 3 }, (_, r) => decode((t * 37 + r * 61) % 256, 4, 4)); for (let x = 0; x < 16; x++) for (let d = 1; d < 4; d++) assert(H.feistelExperiment(tables, x, d).inverseRelation); }
});
test('toy random-permutation probabilities retain finite collision terms rather than forcing advantage to zero', () => {
  near(H.idealInverseAttack(2), 1); for (let d = 1; d < 4; d++) near(H.idealInverseAttack(4, d), 11 / 35);
  let passing = 0;
  for (let code = 0; code < 64; code++) { const tables = [decode(code % 4, 2, 2), decode(Math.floor(code / 4) % 4, 2, 2), decode(Math.floor(code / 16), 2, 2)]; passing += +H.feistelExperiment(tables, 0).differential; }
  near(passing / 64, .5);
  const r = H.feistelExperiment([[1, 0, 3, 2], [2, 2, 0, 1], [3, 0, 2, 1]], 6);
  near(r.idealDifferential - r.randomRoundForward, 1 / 60);
});
test('candidate computations recover real witnesses and distinguish the operations counted', () => {
  assert.deepEqual(H.candidateAttack('factor', { p: 17, q: 23 }).answer, [17, 23]);
  assert.equal(H.candidateAttack('factor', { p: 97, q: 97 }).trace.length, 96);
  for (const exponent of [0, 1, 7, 29]) { const r = H.candidateAttack('log', { modulus: 31, base: 3, exponent }); assert.equal(r.target, Number(3n ** BigInt(exponent) % 31n)); assert.equal(Number(3n ** BigInt(r.answer) % 31n), r.target); }
  assert.equal(H.candidateAttack('log', { modulus: 31, base: 1, exponent: 29 }).answer, 0);
  const r = H.candidateAttack('subset', { weights: [3, 5, 8, 13, 21, 34], mask: 37 }); assert.equal(r.target, 45); assert.equal(r.trace.at(-1).value, 45);
  assert.throws(() => H.candidateAttack('factor', { p: 9, q: 11 })); assert.throws(() => H.candidateAttack('log', { modulus: 9, base: 2, exponent: 3 }));
});
test('primitive paths expose deep inputs and finite authentication uses an exact posterior on fresh messages', () => {
  for (const a of H.PRIMITIVES) for (const b of H.PRIMITIVES) { const path = H.reductionPath(a, b); assert(path); if (a !== b) { assert.equal(path[0].from, a); assert.equal(path.at(-1).to, b); } }
  assert(H.reductionPath('MAC', 'PRG').some(e => e.deep));
  const r = H.toyAuthentication(Array(8).fill(0), 3, [0, 1], 5); assert.equal(r.keys.length, 8); assert.equal(r.success, 1); assert.equal(r.bestTag, 0);
  const g = [3, 18, 50, 29, 47, 8, 34, 61];
  for (let secret = 0; secret < 8; secret++) { const q = H.toyAuthentication(g, secret, [0, 1], 5); assert(q.keys.includes(secret)); assert.equal(H.sum(q.counts), q.keys.length); near(q.success, Math.max(...q.counts) / q.keys.length); }
  assert.throws(() => H.toyAuthentication(g, 0, [1, 5], 5));
});
test('world profiles respect implications, and tiny positive instance probabilities remain positive', () => {
  for (const w of H.WORLDS) { if (w.agreement) assert(w.owf); if (w.owf) assert(w.average); if (w.average) assert(w.different); }
  const f = [0, 1, 2, 3, 4, 5, 6, 7];
  near(H.averageSearch(f, 0).average, 4); near(H.averageSearch(f, 1).average, 8);
  const r = H.averageSearch(f, 1e-100); assert.equal(r.probabilities[r.hardest], 1e-100); assert(r.probabilities[r.hardest] > 0); near(H.sum(r.probabilities), 1);
});
test('malformed and sparse function tables are rejected instead of silently normalized', () => {
  for (const bad of ['bad', '[1,2', [0, 1], [0, 1, 2, 3, 4, 5, 6, 8], [0, 1, 2, 3, 4, 5, 6, NaN], Array(8)]) assert.throws(() => H.functionTable(bad));
  assert.throws(() => H.seededWords(-1, 4, 8)); assert.throws(() => H.averageSearch(Array(8).fill(0), -1)); assert.throws(() => H.numbers('[0,null]', 2, 0, 1));
  assert.throws(() => H.goldreichLevin(Array(8).fill(0), 0, Array(8).fill(0), Array(2)));
  assert.throws(() => H.queryWords(['00', , '01']));
  assert.throws(() => H.feistel([[0, 1, 2, 3], , [0, 0, 0, 0]], 0));
  assert.throws(() => H.toyAuthentication(Array(8).fill(0), 0, Array(2), 7));
});
test('all twelve frozen identities and flags survive, with researched syllabus metadata synchronized', async () => {
  const plan = JSON.parse(fs.readFileSync(new URL('../docs/wave-6-plan.json', import.meta.url))), frozen = plan.chapters.find(c => (c.col || c.collection) === 'crypto').items;
  const parts = await Promise.all(['', '-b'].map(p => import(`../content/crypto/ch06${p}.js`))), items = parts.flatMap(p => p.default.items), syllabus = (await import('../content/crypto/syllabus.js')).default.chapters.find(c => c.n === 6).items;
  assert.equal(items.length, 12);
  for (const [j, item] of items.entries()) { assert.equal('crypto-' + item.num, frozen[j].id); for (const key of ['name', 'kind', 'verify', 'paper', 'introduces']) { assert.deepEqual(item[key], frozen[j][key]); assert.deepEqual(item[key], syllabus[j][key]); } for (const key of ['deps', 'refs']) assert.deepEqual(item[key], syllabus[j][key]); assert.equal(item.caption, syllabus[j].pic); assert.equal(typeof item.viz, 'function'); }
});
