"""Compare owned tables against separately downloaded owner bytes, never network fixtures.

Usage: python3 tests/verification-art-perception-sources.py SOURCE_DIR CONE_SOURCE_DIR
"""
import csv
import hashlib
import json
from pathlib import Path
import subprocess
import sys

base, cones = map(Path, sys.argv[1:3])
sources = [
    (base / 'CIE_sle_scotopic.csv', '6a75d3fdbcbf5e9e9a07478511933eefeda953f3e2cc14b74459e5a099ec3759'),
    (base / 'CIE_sle_mesopic_m_0.8.csv', 'fa643111e81c16661cb7c2d30b9dca6d71ef1c3a4b602a82110a1e3f4aa1f8cd'),
    (cones / 'CIE_lms_cf_2deg.csv', 'f48160edf11c1a121aaaf41d4c3b7513385bfc9c60d726b88e735519f6d37b1f'),
]
tables = []
for path, expected in sources:
    assert hashlib.sha256(path.read_bytes()).hexdigest() == expected, path
    with path.open() as stream:
        tables.append([[None if x.lower() == 'nan' else float(x) for x in row] for row in csv.reader(stream)])
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {SCOTOPIC_ROWS} from './content/art/source-audit-scotopic-data.js';import {CONE_ROWS} from './content/art/source-audit-cones-data.js';console.log(JSON.stringify([SCOTOPIC_ROWS,CONE_ROWS]));"], text=True))
assert actual[0] == tables[0] and len(tables[0]) == 401
assert actual[1] == tables[2] and len(tables[2]) == 89
fixture = json.loads(Path('docs/verification/art-perception-reference.json').read_text())
assert fixture['rows'] == [r for r in tables[1] if 380 <= r[0] <= 780]
assert len(fixture['rows']) == 401
print('PASS: three exact owner SHA256 hashes; all 401 scotopic, 89 cone and 401 independent mesopic reference rows match original CSV cells.')
