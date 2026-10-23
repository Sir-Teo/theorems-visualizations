"""Offline exact-arithmetic audit of fictional preparation data, not field advice.

Use available-storage accounting to check the independently recorded deficit
answers. No source fetching, runtime rendering or professional acceptance.
"""
from fractions import Fraction as F
from hashlib import sha256
import json
from pathlib import Path

path = Path(__file__).with_name('irrigation-ledger-20261022.json')
raw = path.read_bytes()
p = json.loads(raw)
m = p['model']
capacity = F(m['managementDepth']) * F(m['assumedCapacityPerDepth'])
assert capacity == F(m['capacity']) == F('3.24')
fraction, rate, hours = (F(m[k]) for k in
                         ('boundaryDeliveryFraction', 'grossDeliveryRate', 'maximumHoursPerDay'))
assert 0 <= fraction <= 1 and rate > 0 and hours > 0
assert capacity * F(m['millimetresPerInch']) == F('82.296')


def balance(start, rain, use, gross):
    """Return deficit, pre-removal storage, surplus and delivered loss."""
    assert 0 <= start <= capacity and min(rain, use, gross) >= 0
    assert gross / rate <= hours
    incoming = fraction * gross
    loss = gross - incoming
    before = capacity - start
    raw_storage = before + rain + gross - loss - use
    if raw_storage < 0:
        return None, raw_storage, None, loss
    surplus = max(F(0), raw_storage - capacity)
    after = raw_storage - surplus
    assert 0 <= after <= capacity
    return capacity - after, raw_storage, surplus, loss


ids = set()
summaries = {}
for sequence in p['sequences']:
    assert sequence['id'] not in ids
    ids.add(sequence['id'])
    assert [day['day'] for day in sequence['days']] == [1, 2, 3]
    start = end = F(sequence['initialDeficit'])
    ends, rains = [], []
    total_gross = total_use = total_loss = total_surplus = F(0)
    for day in sequence['days']:
        rain, use, gross = (F(day[k]) for k in ('rain', 'cropUse', 'grossIrrigation'))
        end, _, surplus, loss = balance(end, rain, use, gross)
        assert end is not None and end == F(day['expectedEndDeficit'])
        ends.append(end)
        rains.append(rain)
        total_gross += gross
        total_use += use
        total_loss += loss
        total_surplus += surplus
    assert total_gross == F(sequence['expectedTotalGross'])
    assert total_use == F(sequence['expectedTotalCropUse'])
    assert total_loss == F(sequence['expectedTotalDeliveryLoss'])
    assert max(ends) == F(sequence['expectedMaxDailyEndDeficit'])
    assert capacity - end == capacity - start + sum(rains) + total_gross - total_loss - total_use - total_surplus
    summaries[sequence['id']] = (ends, rains)
for branch in ['forecast', 'observed']:
    early, late = (summaries[branch + '-' + timing][0] for timing in ['early', 'late'])
    assert early[-1] == late[-1] and early != late
    assert max(early) < max(late)
assert summaries['forecast-early'][1] != summaries['observed-early'][1]

for row in p['deliveryCases']:
    ids.add(row['id'])
    gross = F(row['requestedGross'])
    required = gross / rate
    assert required == F(row['expectedRequiredHours'])
    if required > hours:
        assert row['expectedStatus'] == 'infeasible-in-one-day'
        assert row['expectedIncoming'] is None
        assert F(row['uncommittedMaximumGross']) == rate * hours < gross
    else:
        assert row['expectedStatus'] == 'within-hour-budget'
        assert gross * fraction == F(row['expectedIncoming'])

g = p['gaugeCase']
start, use, rain, incoming = (F(g[k]) for k in
                            ('initialDeficit', 'cropUse', 'rain', 'measuredIncomingIrrigation'))
storage_end = capacity - start + rain + incoming - use
assert capacity - storage_end == F(g['expectedEndDeficit'])
wrong_storage = capacity - start + rain + incoming * fraction - use
assert capacity - wrong_storage == F(g['incorrectSecondFractionResult'])
assert wrong_storage != storage_end

s = p['surplusCase']
end, raw_storage, surplus, loss = balance(*(F(s[k]) for k in
                                           ('initialDeficit', 'rain', 'cropUse', 'grossIrrigation')))
assert loss == F(s['expectedDeliveryLoss'])
assert capacity - raw_storage == F(s['expectedRawDeficit'])
assert surplus == F(s['expectedSurplus'])
assert end == F(s['expectedEndDeficit'])
assert capacity - end == F(s['expectedFinalStorage'])

r = p['rangeCase']
end, raw_storage, surplus, _ = balance(*(F(r[k]) for k in
                                       ('initialDeficit', 'rain', 'cropUse', 'grossIrrigation')))
assert capacity - raw_storage == F(r['expectedRawDeficit']) > capacity
assert end is None and surplus is None and r['expectedEndDeficit'] is None
assert r['expectedFinalStorage'] is None and r['expectedStatus'] == 'outside-assumed-range'
missing = p['missingCase']
assert missing['rain'] is None and missing['expectedEndDeficit'] is None
assert missing['expectedStatus'] == 'unknown-input'

c = p['correctionCase']
original = summaries[c['basedOnSequence']]
before = original[0][c['afterDay'] - 1]
revised = F(c['revisedEstimate'])
assert before == F(c['priorEndDeficit'])
assert revised - before == F(c['deficitAdjustment'])
assert before - revised == F(c['storageEstimateAdjustment'])
assert original[1][c['afterDay'] - 1] == F(c['rainRecordPreserved'])
n = c['nextDay']
end, _, _, _ = balance(revised, *(F(n[k]) for k in ('rain', 'cropUse', 'grossIrrigation')))
assert end == F(n['expectedEndDeficit'])
assert original[0][-1] == F('1.25') and end == F('0.95')

sector = p['sectorCase']
weights = {name: F(value) for name, value in sector['sectorAreaFractions'].items()}
assert sum(weights.values()) == 1 and all(value > 0 for value in weights.values())
sector_ends = {name: F(sector['initialDeficitEach']) for name in weights}
mean = F(sector['initialDeficitEach'])
for day in sector['days']:
    # Whole-field equivalent depth controls total operating hours; local
    # sector depth divided by this rate would use the wrong area denominator.
    gross_mean = sum(weights[name] * F(day['grossBySector'][name]) for name in weights)
    assert gross_mean == F(day['expectedFieldEquivalentGross'])
    assert gross_mean / rate == F(day['expectedOperatingHours']) <= hours
    rain, use = F(day['rainEach']), F(day['cropUseEach'])
    for name in weights:
        # These rows contain no surplus or range violation; calculate each
        # local storage separately from the field delivery-time constraint.
        storage = capacity - sector_ends[name] + rain + F(day['grossBySector'][name]) * fraction - use
        assert 0 <= storage <= capacity
        sector_ends[name] = capacity - storage
        assert sector_ends[name] == F(day['expectedDeficitBySector'][name])
    mean += use - rain - gross_mean * fraction
    assert mean == sum(weights[name] * sector_ends[name] for name in weights)
    assert mean == F(day['expectedMeanEndDeficit'])
    if day['day'] == 1:
        assert sector_ends['B'] > mean > sector_ends['A']

for key in ['gaugeCase', 'surplusCase', 'rangeCase', 'missingCase', 'correctionCase', 'sectorCase']:
    assert p[key]['id'] not in ids
    ids.add(p[key]['id'])
assert len(ids) == 13
assert len({a['id'] for a in p['activities']}) == 4
for activity in p['activities']:
    assert set(activity['caseIds']) <= ids
assert len({card['id'] for card in p['reviewCards']}) == 5
assert all(card['decision'] is None for card in p['reviewCards'])
for note in p['sourceNotes']:
    assert sha256(note['note'].encode()).hexdigest() == note['noteSha256']

print(json.dumps({'result': 'PASS', 'fixtureSha256': sha256(raw).hexdigest(),
                  'cases': len(ids), 'sequenceDays': 12, 'sectorDays': 2,
                  'activities': 4, 'unfilledQualifiedDecisions': 5,
                  'scope': 'Exact fictional arithmetic and references only; no field, professional, interface or human acceptance.'}, indent=2))
