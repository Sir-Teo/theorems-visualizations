"""Offline author checks of preparation geometry, score data and blank records.

No source fetching, practical reproduction, participant collection or runtime
acceptance. Independent reports review the actual data and diagrams separately.
"""
from hashlib import sha256
import json
from pathlib import Path
import xml.etree.ElementTree as ET

base = Path(__file__).parent
root = base.parents[3]
craft = json.loads((base / 'patch-plans-20261023.json').read_text())
stage = json.loads((base / 'staging-scores-20261023.json').read_text())
ns = {'s': 'http://www.w3.org/2000/svg'}


def inside(point, rectangle):
    x, y = point
    left, top, right, bottom = rectangle
    return left < x < right and top < y < bottom


def overlap(a, b):
    return max(0, min(a[2], b[2]) - max(a[0], b[0])) * max(0, min(a[3], b[3]) - max(a[1], b[1]))


def asset(row):
    path = base / row['asset']
    assert sha256(path.read_bytes()).hexdigest() == row['assetSha256']
    svg = ET.parse(path).getroot()
    assert svg.get('viewBox') == '0 0 900 620'
    assert svg.get('role') == 'img' and svg.get('aria-labelledby') == 'title desc'
    assert svg.find('s:title', ns).text and svg.find('s:desc', ns).text
    return svg


preserved = set()
for packet in [craft, stage]:
    for name, expected in packet['existingBindings'].items():
        assert sha256((root / name).read_bytes()).hexdigest() == expected, name
        preserved.add(name)
    assert packet['authoredLessonsAdded'] == packet['acceptedLessonsAdded'] == packet['draftSlotsReleased'] == 0
    assert len(packet['reviewCards']) == 4 and len({x['id'] for x in packet['reviewCards']}) == 4
    assert all(x['decision'] is None for x in packet['reviewCards'])

geometry = craft['coordinates']
hole, fabric = geometry['holeRectangle'], geometry['baseRectangle']
assert overlap(hole, hole) == geometry['holeArea'] == 400
assert len({p['id'] for p in craft['plans']}) == 3
total_locations = 0
for plan in craft['plans']:
    assert overlap(hole, plan['patch']) == plan['expectedCoverageArea']
    points = plan['punctures']
    assert len({tuple(p) for p in points}) == len(points)
    all_layers = all(inside(p, fabric) and not inside(p, hole) and inside(p, plan['patch']) for p in points)
    assert all_layers == plan['expectedAllLocationsInBaseAndPatch']
    location = plan['crossSectionLocation']
    assert location == points[0] and inside(location, plan['patch'])
    assert (inside(location, fabric) and not inside(location, hole)) == plan['crossSectionBasePresent']
    assert plan['physicalVerdict'] is None
    svg = asset(plan)
    labels = [t.text for t in svg.findall('.//s:text', ns) if t.get('class') == 'num']
    assert labels == [str(i) for i in range(1, len(points) + 1)]
    # The fill may not cover the gaps in the intentionally dashed boundary.
    fills = [r for r in svg.findall('.//s:rect', ns) if r.get('fill') == 'url(#patch)']
    assert any(r.get('stroke') == 'none' for r in fills)
    total_locations += len(points)
assert total_locations == 21
physical = craft['physicalRecordTemplate']
assert physical['status'] == 'not-performed'
assert all(v is None or v == [] for k, v in physical.items() if k != 'status')
craft_ids = {p['id'] for p in craft['plans']}
for task in craft['activities']:
    assert set(task['planIds']) <= craft_ids

events = stage['commonPlan']['events']
assert [e['targetSeconds'] for e in events] == [0, 2, 6, 10, 14]
event_ids = [e['id'] for e in events]
assert len(set(event_ids)) == 5
assert [(e['speaker'], e['text']) for e in events if e['kind'] == 'line-onset'] == [
    ('A', 'Is this for me?'), ('B', 'I left it here.'), ('A', "Then I'll wait.")]
scores = stage['scores']
assert [s['id'] for s in scores] == ['facing', 'offset']
differences = []
for actor in ['A', 'B']:
    for field in ['position', 'orientationDegrees']:
        if scores[0]['performers'][actor][field] != scores[1]['performers'][actor][field]:
            differences.append((actor, field))
assert differences == [('A', 'position'), ('A', 'orientationDegrees'), ('B', 'orientationDegrees')]
for score in scores:
    assert score['eventIds'] == event_ids and score['actualPerformanceId'] is None
    assert set(score['performers']) == {'A', 'B'}
    asset(score)
    for performer in score['performers'].values():
        assert performer['orientationDegrees'] in [0, 90, 180, 270]
        assert performer['position'] != [0, 0]
for name, status in [('performanceRecordTemplate', 'not-performed'), ('observerRecordTemplate', 'not-collected')]:
    template = stage[name]
    assert template['status'] == status
    assert all(v is None or v == [] for k, v in template.items() if k != 'status')
session = stage['sessionPlan']
assert session['status'] == 'not-performed' and session['assignment'] is None
assert session['sequenceOptions'] == [['facing', 'offset'], ['offset', 'facing']]
for task in stage['activities']:
    assert set(task['scoreIds']) <= {'facing', 'offset'}

print(json.dumps({'result': 'PASS', 'patchPlans': 3, 'proposedLocations': total_locations,
                  'stagingScores': 2, 'commonTimedTargets': 5, 'svgAssets': 5,
                  'unfilledQualifiedDecisions': 8, 'distinctPreservedFiles': len(preserved),
                  'scope': 'Author preparation geometry/data/identity checks; no engineering, practical, performer, human or release acceptance.'}, indent=2))
