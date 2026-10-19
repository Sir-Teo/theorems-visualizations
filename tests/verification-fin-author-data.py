"""Offline comparison against ORIGINAL French author CSV extracts.

Usage: python3 tests/verification-fin-author-data.py FACTORS.csv PORTFOLIOS.csv
The report records original download URLs, ZIP filenames and SHA-256 digests.
Requires Node to decode the unchanged repository data; Python stdlib only.
"""
import csv
from decimal import Decimal
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys

repo = Path(__file__).resolve().parents[1]
if len(sys.argv) != 3:
    raise SystemExit(__doc__)


def original_rows(path, count):
    text = Path(path).read_text(encoding="utf-8-sig")
    assert "202608 CRSP database" in text.splitlines()[0], "wrong author vintage"
    found = []
    raw = []
    for row in csv.reader(text.splitlines()):
        if not row or not re.fullmatch(r"\d{6}", row[0].strip()):
            continue
        date = int(row[0])
        if not 196307 <= date <= 202608:
            continue
        assert len(row) == count + 1, (path, date, len(row))
        values = [Decimal(x.strip()) for x in row[1:]]
        assert all(x not in (Decimal("-99.99"), Decimal("-999")) for x in values)
        raw.append(values)
        # Author CSV unit is percent. Embedded unit is decimal return ×10000.
        # Source generation parsed IEEE-754 numbers before rounding. Preserve
        # that operation order (e.g. 1.025*100 is just below 102.5).
        found.append((date, [math.floor(float(x) * 100 + 0.5) for x in values]))
        if date == 202608:
            break  # first (value-weighted monthly) section, never later sections
    dates = [(1963 + (6 + i) // 12) * 100 + (6 + i) % 12 + 1 for i in range(758)]
    assert [d for d, _ in found] == dates, "missing/duplicate/noncontiguous months"
    return [v for _, v in found], raw


factors, _ = original_rows(sys.argv[1], 4)
ports, original_ports = original_rows(sys.argv[2], 25)
code = """
import {data} from './content/fin/ch04.shared.js';
const d=data();console.log(JSON.stringify({n:d.n,rows:Array.from({length:d.n},(_,i)=>[d.mkt[i],d.smb[i],d.hml[i],d.rf[i],...d.p25.map(p=>p[i])])}));
"""
decoded = json.loads(subprocess.run(["node", "--input-type=module", "-e", code], cwd=repo, text=True, check=True, capture_output=True).stdout)
assert decoded["n"] == 758
canonical = []
worst = Decimal(0)
for i, row in enumerate(decoded["rows"]):
    expected = factors[i] + ports[i]
    actual = [round(x * 10000) for x in row]
    assert actual == expected, (i, actual, expected)
    assert all(abs(x * 10000 - n) < 1e-9 for x, n in zip(row, actual)), "embedded values are not at declared precision"
    for j, value in enumerate(original_ports[i]):
        worst = max(worst, abs(Decimal(str(row[j + 4])) - value / 100))
    canonical.append(",".join(map(str, expected)))
digest = hashlib.sha256("\n".join(canonical).encode()).hexdigest()
assert digest == "105b3f6c1c76f199595fd3aa4134432ca839d8226b391b2212484c29b7923d62"
print("PASS original author 202608 CSVs: 758 contiguous months, 3032 factors/RF + 18950 VW portfolio values")
print("Portfolio maximum decimal-return rounding error:", worst)
print("Canonical source/embedded SHA-256:", digest)
