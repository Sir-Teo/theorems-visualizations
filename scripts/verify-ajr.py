"""Reproduce the AJR Table 4 audit: python verify-ajr.py maketable4.zip report.json.

Read-only extraction of the authors' archive linked from their MIT data archive.
Requires pandas and numpy. Reference fits use independent NumPy least squares.
"""
import hashlib
import json
import sys
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd

source, target = map(Path, sys.argv[1:])
with zipfile.ZipFile(source) as archive:
    data = pd.read_stata(archive.open('maketable4.dta'))
data = data[data.baseco == 1].sort_values('shortnam')

def fit(rows):
    x,y,z = [rows[key].to_numpy(float) for key in ['avexpr','logpgp95','logem4']]
    X = np.column_stack([np.ones(len(x)),x])
    Z = np.column_stack([np.ones(len(z)),z])
    ols = np.linalg.lstsq(X,y,rcond=None)[0]
    first = np.linalg.lstsq(Z,x,rcond=None)[0]
    H = np.column_stack([np.ones(len(x)),Z@first])
    iv = np.linalg.lstsq(H,y,rcond=None)[0]
    se = np.sqrt(np.diag(np.linalg.inv(H.T@H))*np.sum((y-X@iv)**2)/(len(x)-2))
    return {'n':len(x),'ols':ols.tolist(),'firstStage':first.tolist(),'tsls':iv.tolist(),'tslsSE':se.tolist()}

rows = [[r.shortnam,float(r.avexpr),float(r.logpgp95),float(r.logem4),
         int(3 if r.rich4 else 1 if r.africa else 2 if r.asia else 0)] for r in data.itertuples()]
rounded = data.copy()
for key in ['avexpr','logpgp95','logem4']:
    rounded[key] = rounded[key].astype(float).round(2)
cases = []
for africa in [False,True]:
    for neo in [False,True]:
        for asia in [False,True]:
            mask = np.ones(len(rounded),dtype=bool)
            for drop,key in [(africa,'africa'),(neo,'rich4'),(asia,'asia')]:
                if drop:
                    mask &= ~rounded[key].astype(bool)
            cases.append({'dropAfrica':africa,'dropNeoEuropes':neo,'dropAsia':asia,**fit(rounded[mask])})

report = {
    'sourceArchive':'https://economics.mit.edu/people/faculty/daron-acemoglu/data-archive',
    'source':'https://www.dropbox.com/scl/fi/3yuv9j514zuajzjfluoc1/maketable4.zip?rlkey=pq9l7bxktw1iqxe6fmoh26g79&dl=1',
    'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
    'columns':['code','avexpr','logpgp95','logem4','group'],
    'rows':rows,
    'unroundedFullSample':fit(data),
    'roundedCases':cases,
}
target.write_text(json.dumps(report,indent=2)+'\n')
print(f'{len(rows)} source-derived countries; {len(cases)} sample combinations -> {target}')
