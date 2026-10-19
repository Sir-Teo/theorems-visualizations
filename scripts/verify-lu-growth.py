"""90-digit reference elimination of exact binary64 Gaussian input samples.

Run from the repository root with Python3; uses Node only to generate the actual
UI RNG input, not to perform elimination. Decimal Schur matrices explicitly zero
eliminated columns and never store multipliers in the working matrix.
"""
import decimal
import json
import subprocess
from pathlib import Path

decimal.getcontext().prec = 90
samples = json.loads(subprocess.check_output([
    'node', '--input-type=module', '-e',
    "import{rng}from'./assets/js/viz/math.js';"
    "import{gaussMat}from'./content/nla/ch04.shared.js';"
    "console.log(JSON.stringify([1,2].flatMap(seed=>[8,16,32,64,128].map(n=>"
    "({seed,n,A:gaussMat(rng(seed*977+n),n)})))));"
], text=True))
rows = []
for sample in samples:
    A = [[decimal.Decimal.from_float(x) for x in row] for row in sample['A']]
    n = len(A)
    initial = max(abs(x) for row in A for x in row)
    largest = initial
    perm = list(range(n))
    for k in range(n-1):
        p = max(range(k,n), key=lambda i:abs(A[i][k]))
        A[k], A[p] = A[p], A[k]
        perm[k], perm[p] = perm[p], perm[k]
        for i in range(k+1,n):
            multiplier = A[i][k]/A[k][k]
            A[i] = [decimal.Decimal(0) if j<=k else A[i][j]-multiplier*A[k][j] for j in range(n)]
        largest = max(largest, max(abs(x) for row in A for x in row))
    rows.append({'seed':sample['seed'],'n':n,'rho':str(largest/initial),'initialMax':str(initial),'maxGenerated':str(largest),'perm':perm})
path = Path('docs/verification/lu-growth-references.json')
path.write_text(json.dumps({'precision':90,'input':'Exact binary64 values of actual UI RNG samples, first matrix at each size/seed','rows':rows},indent=2)+'\n')
print(f'{len(rows)} references written to {path}')
