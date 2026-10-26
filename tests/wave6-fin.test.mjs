import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as H from '../content/fin/ch07.shared.js';

const reference = JSON.parse(fs.readFileSync(new URL('./fixtures/wave6-fin-reference.json', import.meta.url)));
const statistics = {cases: 0, comparisons: 0, worstLogAbsolute: 0};

function compare(actual, expected, label) {
  if (expected === null) { assert.equal(actual, null, label); return; }
  if (expected && typeof expected === 'object' && 'logMagnitude' in expected) {
    assert.ok(Object.is(actual.value, expected.value), label + ' independently rounded physical value');
    for (const key of ['sign', 'belowRange', 'aboveRange', 'approximate']) {
      assert.equal(actual[key], expected[key], label + ' ' + key);
    }
    if (expected.logMagnitude === null) assert.equal(actual.logMagnitude, -Infinity, label + ' exact zero');
    else {
      const error = Math.abs(actual.logMagnitude - expected.logMagnitude);
      statistics.worstLogAbsolute = Math.max(statistics.worstLogAbsolute, error);
      assert.ok(error <= 8e-12, label + ' logarithmic magnitude ' + error);
    }
    statistics.comparisons += 6;
    return;
  }
  if (typeof expected === 'object') {
    assert.ok(actual && typeof actual === 'object', label + ' complete nested object');
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), label + ' complete nested fields');
    for (const [key, value] of Object.entries(expected)) compare(actual[key], value, label + '.' + key);
    return;
  }
  assert.equal(actual, expected, label);
  statistics.comparisons++;
}

for (const family of ['payoff', 'parity', 'bounds', 'earlyCall', 'strikeConvexity', 'strategies', 'densityRecovery', 'protectivePut', 'claims']) {
  test('FIN7 independently integrated complete ' + family + ' physical cases', () => {
    for (const row of reference.rows.filter(row => row.name === family)) {
      const actual = H[family](row.parameters);
      const physical = object => Object.keys(object).filter(key => object[key] === null || object[key] && typeof object[key] === 'object' && 'sign' in object[key]).sort();
      assert.deepEqual(physical(actual), physical(row.expected), 'every physical output independently covered');
      for (const [key, value] of Object.entries(row.expected)) compare(actual[key], value, family + ' ' + JSON.stringify(row.parameters) + ' ' + key);
      statistics.cases++;
    }
  });
}

test('FIN7 original tiny quote offsets determine arbitrage even when displayed prices coincide', () => {
  for (const offset of [Number.MIN_VALUE, -Number.MIN_VALUE]) {
    const parity = H.parity({discount: 1, callOffset: offset});
    assert.equal(parity.quotedCall.value, parity.consistentCall.value);
    assert.equal(parity.parityGap.sign, Math.sign(offset));
    assert.equal(parity.arbitrageInitialReceipt.sign, 1);
    assert.equal(parity.arbitrageTerminalPayoff.sign, 0);
    const butterfly = H.strikeConvexity({reference: 'chord', quoteOffset: offset});
    assert.equal(butterfly.butterflyCost.sign, -Math.sign(offset));
  }
  // The default B=.95 gives an exact halfway price. A positive MIN offset
  // legitimately changes its rounded value; the independent fixture retains it.
  const midpoint = H.parity({callOffset: Number.MIN_VALUE});
  assert.notEqual(midpoint.quotedCall.value, midpoint.consistentCall.value);
  assert.equal(midpoint.parityGap.sign, 1);
});

test('FIN7 early exercise and zero-profit statements retain their equality and outside-assumption cases', () => {
  assert.equal(H.earlyCall({discount: 1}).deterministicChoice, 'tie');
  const dividend = H.earlyCall({discount: 1, dividendFraction: Number.MIN_VALUE});
  assert.equal(dividend.noDividendNonnegativeRateAssumptions, false);
  assert.equal(dividend.deterministicChoice, 'exercise now');
  assert.equal(dividend.continuationAdvantage.sign, -1);
  assert.equal(H.earlyCall({discount: 1.5}).deterministicChoice, 'exercise now');
  assert.equal(H.payoff({premium: 0}).zeroProfitSet.kind, 'closed interval');
  assert.equal(H.payoff({kind: 'put', premium: 0}).zeroProfitSet.kind, 'closed ray');
  assert.equal(H.payoff({kind: 'put', strike: 10, premium: 40}).zeroProfitSet.kind, 'empty');
});

test('FIN7 physical probabilities do not reprice fixed-Q claims and floor probability includes the atom', () => {
  for (const physicalMode of [45, 155]) {
    const claim = H.claims({physicalMode}), insured = H.protectivePut({physicalMode});
    assert.equal(claim.valueResidual.sign, 0);
    assert.equal(insured.insuredTotalProbability.value, 1);
    assert.equal(insured.plainProbabilityMass.value, 1);
    assert.equal(insured.payoffIdentityResidual.sign, 0);
  }
  const low = H.claims({physicalMode: 45}), high = H.claims({physicalMode: 155});
  assert.equal(low.equityValue.value, high.equityValue.value);
  assert.equal(low.debtValue.value, high.debtValue.value);
  assert.notEqual(low.physicalDefault.value, high.physicalDefault.value);
  assert.equal(H.protectivePut({strike: 240}).physicalFloorAtom.value, 1);
  assert.equal(H.protectivePut({strike: 240}).floorProfit.sign, 0);
  assert.equal(H.densityRecovery({bandwidth: 0}).recoveredDensity, null);
});

test('FIN7 declared pricing, payoff and law domains reject malformed or impossible inputs', () => {
  for (const run of [
    () => H.payoff({kind: 'future'}), () => H.payoff({side: 'flat'}),
    () => H.payoff({premium: -1}), () => H.payoff({terminal: NaN}),
    () => H.parity({discount: 0}), () => H.bounds({reference: 'mid'}),
    () => H.earlyCall({dividendFraction: 1.1}), () => H.law(40),
    () => H.law(160), () => H.strikeConvexity({leftWidth: 0}),
    () => H.strategies({legs: []}), () => H.strategies({stockUnits: Infinity}),
    () => H.densityRecovery({bandwidth: -1}), () => H.protectivePut({physicalMode: 0}),
    () => H.claims({face: -1}), () => H.claims({discount: '0.95'}),
  ]) assert.throws(run);
});

after(() => {
  assert.equal(statistics.cases, 1941);
  console.log('FIN7 independent reference statistics ' + JSON.stringify(statistics));
});
