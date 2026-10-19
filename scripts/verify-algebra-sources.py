"""Check saved Judson anchors and Norvig data against downloaded primary sources.
Usage: python3 scripts/verify-algebra-sources.py aata-20230811.pdf mayzner.html
Requires pypdf; performs no network calls and imports no site calculations.
"""
from pathlib import Path
import hashlib
import json
import re
import sys
from pypdf import PdfReader

ref = json.loads((Path(__file__).resolve().parents[1] / 'docs/verification/algebra-source-evidence.json').read_text())
pdf, html = map(Path, sys.argv[1:3])
assert hashlib.sha256(pdf.read_bytes()).hexdigest() == ref['judson']['sha256'], 'Different Judson edition/file'
assert hashlib.sha256(html.read_bytes()).hexdigest() == ref['frequencies']['sourceHtmlSha256'], 'Different Norvig snapshot'
reader = PdfReader(pdf)
for name, anchor in ref['judson']['anchors'].items():
    text = ' '.join(reader.pages[anchor['pdfPage']-1].extract_text().split())
    assert anchor['label'] in text, (name, anchor)
rows = re.findall(r'^([A-Z])\s+[\d.]+ B\s+([\d.]+)%', html.read_text(), re.M)
assert len(rows) == 26
assert dict(sorted((c,float(p)) for c,p in rows)) == ref['frequencies']['percentByLetter']
print('Five 2023 book anchors and all 26 author-table percentages match the saved evidence.')
