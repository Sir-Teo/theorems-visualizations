"""Read-only arithmetic audit of the proposed fictional P05-L02 exercise.

Compare gross-input and net-input balances, then independently account for
stored available water. This verifies arithmetic and explicit range handling,
not the source method's field accuracy or an authored lesson's behaviour.
"""
from decimal import Decimal as D
import hashlib
import json
from pathlib import Path

path = Path(__file__).with_suffix('.json')
raw = path.read_bytes()
data = json.loads(raw)
capacity = D(data['managementDepth']) * D(data['assumedUniformAvailableWaterCapacityPerDepth'])
assert capacity == D(data['expectedAvailableWaterCapacity']) == D('3.24')
results = []
for row in data['cases']:
    start, use, rain, gross, efficiency = (
        D(row[key]) for key in ('initialDeficit', 'cropUse', 'effectiveRain',
                               'grossIrrigation', 'applicationEfficiency')
    )
    assert D(0) <= start <= capacity and min(use, rain, gross) >= 0
    assert D(0) <= efficiency <= D(1)
    net = gross * efficiency
    loss = gross - net
    # Two equivalent input conventions must produce the same deficit.
    net_balance = start + use - rain - net
    gross_balance = start + use - rain - gross + loss
    assert net_balance == gross_balance
    expected = row['expected']
    for key, actual in [('netIrrigation', net), ('applicationLoss', loss),
                        ('rawDeficit', net_balance)]:
        assert actual == D(expected[key]), (row['id'], key)
    if net_balance > capacity:
        assert expected['status'] == 'outside-assumed-range'
        assert expected['endingDeficit'] is None and expected['excessRemoved'] is None
        results.append({'id': row['id'], 'result': 'PASS: range violation exposed; no valid ending state'})
        continue
    excess = max(-net_balance, D(0))
    end = net_balance + excess
    assert expected['status'] == 'within-assumed-range'
    assert end == D(expected['endingDeficit']) and excess == D(expected['excessRemoved'])
    # Independent available-water storage accounting, with all outflows explicit.
    storage_before = capacity - start
    storage_after = storage_before + rain + gross - loss - use - excess
    assert storage_after == capacity - end
    assert D(0) <= storage_after <= capacity
    if 'doubleCountedLossError' in expected:
        assert end + loss == D(expected['doubleCountedLossError']) != end
    results.append({'id': row['id'], 'result': 'PASS: equivalent balances and storage conservation'})

print(json.dumps({
    'result': 'PASS', 'fixtureSha256': hashlib.sha256(raw).hexdigest(),
    'capacity': str(capacity), 'cases': results,
    'scope': 'Fictional arithmetic only; no field, agronomic, interface or learner validation.'
}, indent=2))
