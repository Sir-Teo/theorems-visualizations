"""Read-only audit of original volume/time arithmetic; no clinical validation.

Check authored values, interval-average flows and unit conversion with exact
rationals. A cropped endpoint remains incomplete even if its ratio increases.
"""
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path

raw = Path(__file__).with_suffix('.json').read_bytes()
data = json.loads(raw)
assert data['clinicalRatio'] is None
results = {}
for row in data['cases']:
    samples = [(F(t), F(v)) for t, v in row['samples']]
    assert samples[0] == (0, 0)
    intervals = list(zip(samples, samples[1:]))
    assert all(t2 > t1 and v2 >= v1 >= 0 for (t1, v1), (t2, v2) in intervals)
    at_one = dict(samples)[F(1)]
    end = samples[-1][1]
    flows = [(v2-v1)/(t2-t1) for (t1, v1), (t2, v2) in intervals]
    expected = row['expected']
    assert at_one == F(expected['volumeAtOneSecond'])
    assert end == F(expected['observedEndVolume']) > 0
    assert at_one/end == F(expected['descriptiveRatio'])
    assert flows == [F(value) for value in expected['intervalAverageFlows']]
    assert sum(flow*(b[0]-a[0]) for flow, (a, b) in zip(flows, intervals)) == end
    # L -> mL changes the volume/flow units, but cancels out of this ratio.
    assert (at_one*1000)/(end*1000) == at_one/end
    results[row['id']] = {'samples': samples, 'ratio': at_one/end, 'end': end}

a, b, crop = (results[key] for key in ('trace-a', 'trace-b', 'cropped-a'))
assert a['end'] == b['end'] == 4 and a['ratio'] != b['ratio']
assert crop['samples'] == a['samples'][:len(crop['samples'])]
assert crop['end'] < a['end'] and crop['ratio'] > a['ratio']
cropped_record = next(row for row in data['cases'] if row['id'] == 'cropped-a')
assert cropped_record['endpointStatus'] == 'incomplete-observation'
assert cropped_record['completeEndpointVolume'] is None
print(json.dumps({
    'result': 'PASS', 'fixtureSha256': hashlib.sha256(raw).hexdigest(),
    'descriptiveRatios': {key: str(value['ratio']) for key, value in results.items()},
    'scope': 'Three fictional traces; arithmetic, units and cropping only. No clinical or interface validation.'
}, indent=2))
