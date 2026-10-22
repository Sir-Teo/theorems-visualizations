"""Verify the complete pilot projection against the pinned original local CSV.
Usage: python3 docs/pilots/research/soil-subset.py /path/to/original/csv/directory
No network or writes; source decimals, order and duplicate magnitudes are preserved.
"""
import csv
import hashlib
import io
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[3]
record = json.loads((ROOT / 'explorations/agriculture.json').read_text())
dataset = record['activity']['dataset']
raw = (Path(sys.argv[1]) / dataset['sourceFile']).read_bytes()
expected = '41308fba78d50d96152f40b85af43f45a9aed4d53e23568db483889c8ed744b1'
if hashlib.sha256(raw).hexdigest() != expected or dataset['sourceSha256'] != expected:
    raise ValueError('Original CSV hash mismatch; review another edition explicitly')
columns = ['Site','Sample_ID','Plot','Depth_cm','MPa_Abs','Vol_Water','Hypropfilter','Sampling_Date']
samples = ['US-DFC_1_000','US-DFC_1_010','US-DFC_1_050']
rows = [dict(sourceRow=i, **{k:r[k] for k in columns})
        for i,r in enumerate(csv.DictReader(io.StringIO(raw.decode('utf-8'))), start=2)
        if r['Sample_ID'] in samples]
if dataset['selection']['Sample_ID'] != samples or dataset['projection'] != columns or dataset['rows'] != rows:
    raise ValueError('Projection differs from every retained source row, value or source order')
print(json.dumps({'verifiedRows':len(rows),'samples':{s:sum(r['Sample_ID']==s for r in rows) for s in samples},'originalSha256':expected}))
