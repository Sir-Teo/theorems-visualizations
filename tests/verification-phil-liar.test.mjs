import test from 'node:test';
import assert from 'node:assert/strict';
import { liarBits, liarObjectNegation, liarExternalNotTrue, liarStatusModel } from '../content/phil/source-audit-liar.js';

// Independent evidence-set interpretation: no bit arithmetic from the production helper.
const statuses = [
  { code: 1, evidence: new Set(['true']) },
  { code: 2, evidence: new Set(['false']) },
  { code: 0, evidence: new Set() },
  { code: 3, evidence: new Set(['true', 'false']) },
];
const domains = { classical: [1, 2], gap: [1, 2, 0], glut: [1, 2, 3], four: [1, 2, 0, 3] };
function code(evidence) { return statuses.find(s => ['true', 'false'].every(k => s.evidence.has(k) === evidence.has(k))).code; }
function neg(evidence) { return new Set(['true', 'false'].filter(k => evidence.has(k === 'true' ? 'false' : 'true'))); }
function external(evidence) { return new Set([evidence.has('true') ? 'false' : 'true']); }
function conjunction(a, b) { return new Set([...(a.has('true') && b.has('true') ? ['true'] : []), ...(a.has('false') || b.has('false') ? ['false'] : [])]); }
function disjunction(a, b) { return new Set([...(a.has('true') || b.has('true') ? ['true'] : []), ...(a.has('false') && b.has('false') ? ['false'] : [])]); }

test('All four independent evidence sets: transparent identity, negation involution, and external classification are distinct', () => {
  for (const s of statuses) {
    assert.deepEqual(liarBits(s.code), [+s.evidence.has('true'), +s.evidence.has('false')]);
    assert.equal(liarObjectNegation(s.code), code(neg(s.evidence)));
    assert.equal(liarObjectNegation(liarObjectNegation(s.code)), s.code);
    assert.equal(liarExternalNotTrue(s.code), code(external(s.evidence)));
    assert.equal(liarStatusModel('teller', 'four').rows.find(r => r.input === s.code).output, s.code);
  }
  assert.equal(liarObjectNegation(0), 0); assert.equal(liarExternalNotTrue(0), 1);
  assert.equal(liarObjectNegation(3), 3); assert.equal(liarExternalNotTrue(3), 2);
  assert.notEqual(0, 3);
});

test('All 24 operation/domain/enrichment settings and all 96 rows agree with independent evidence-set equality', () => {
  for (const sentence of ['liar', 'teller', 'external']) for (const [domain, allowed] of Object.entries(domains)) for (const enrich of [false, true]) {
    const q = liarStatusModel(sentence, domain, enrich), compared = sentence !== 'external' || enrich;
    assert.equal(q.sentence, sentence); assert.equal(q.domain, domain); assert.equal(q.enrich, enrich); assert.equal(q.compared, compared);
    assert.equal(q.rows.length, 4);
    const expected = [];
    for (const [i, s] of statuses.entries()) {
      const output = code(sentence === 'liar' ? neg(s.evidence) : sentence === 'teller' ? s.evidence : external(s.evidence));
      const r = q.rows[i]; assert.equal(r.input, s.code); assert.equal(r.output, output);
      assert.equal(r.allowed, allowed.includes(s.code)); assert.equal(r.equal, s.code === output);
      assert.equal(r.externalNotTrue, !s.evidence.has('true'));
      assert.deepEqual(r.bits, [+s.evidence.has('true'), +s.evidence.has('false')]);
      assert.deepEqual(r.outputBits, liarBits(output));
      if (allowed.includes(s.code) && s.code === output) expected.push(s.code);
    }
    assert.deepEqual(q.fixed, compared ? expected : null);
    if (sentence !== 'external') assert.deepEqual(q, { ...liarStatusModel(sentence, domain, !enrich), enrich });
  }
});

test('Classical contradiction, permitted gap/glut witnesses, and conditional revenge obstruction have exact finite certificates', () => {
  assert.deepEqual(liarStatusModel('liar', 'classical').fixed, []);
  assert.deepEqual(liarStatusModel('liar', 'gap').fixed, [0]);
  assert.deepEqual(liarStatusModel('liar', 'glut').fixed, [3]);
  assert.deepEqual(liarStatusModel('liar', 'four').fixed, [0, 3]);
  for (const [domain, allowed] of Object.entries(domains)) {
    assert.deepEqual(liarStatusModel('teller', domain).fixed, allowed);
    assert.equal(liarStatusModel('external', domain, false).fixed, null, 'an external report imposes no self-equation');
    assert.deepEqual(liarStatusModel('external', domain, true).fixed, []);
  }
  for (const t of [false, true]) assert.notEqual(t, !t, 'the enriched self-equation would require t = not t');
  // Equality of semantic statuses does not assert the truth of a material biconditional.
  const neither = new Set(), aImpliesA = disjunction(neg(neither), neither);
  const aIffA = conjunction(aImpliesA, aImpliesA);
  assert.equal(code(aIffA), 0); assert.equal(aIffA.has('true'), false);
  assert.equal(liarStatusModel('teller', 'gap').rows.find(r => r.input === 0).equal, true);
});

test('Out-of-domain inputs are rejected; separate returned model results do not share mutable row data', () => {
  for (const s of [-1, 4, .5, NaN, Infinity, '1', null]) for (const f of [liarBits, liarObjectNegation, liarExternalNotTrue]) assert.throws(() => f(s), RangeError);
  for (const args of [['other', 'four'], ['liar', 'other'], ['liar', '__proto__'], ['liar', ['four']], ['liar', { toString: () => 'four' }], ['external', 'four', 1], ['liar', 'classical', null]]) assert.throws(() => liarStatusModel(...args), RangeError);
  const a = liarStatusModel('liar', 'four'); a.rows[0].bits[0] = 9; a.rows[0].output = 9; a.fixed.length = 0;
  const b = liarStatusModel('liar', 'four'); assert.deepEqual(b.fixed, [0, 3]); assert.deepEqual(b.rows[0].bits, [1, 0]); assert.equal(b.rows[0].output, 2);
});
