"""Reproduce the PWT source audit: python scripts/verify-pwt.py pwt100.xlsx report.json.

Read-only extraction from the official PWT 10.0 workbook; does not edit content.
Requires openpyxl and numpy. Download: https://www.rug.nl/ggdc/docs/pwt100.xlsx
"""
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
import openpyxl

source, target = map(Path, sys.argv[1:])
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
records = iter(workbook['Data'].values)
header = next(records)
countries = {}
for values in records:
    r = dict(zip(header, values))
    countries.setdefault(r['countrycode'], {})[r['year']] = r

# OECD Convention signatories plus accessions through 1973. ISL and LUX fail
# the population > 1 million screen; retain them here to define the rule fully.
oecd = set('AUT BEL CAN DNK FRA DEU GRC ISL IRL ITA LUX NLD NOR PRT ESP SWE CHE TUR GBR USA JPN FIN AUS NZL'.split())
rows = []
for code, years in sorted(countries.items()):
    a, b = years.get(1960), years.get(2019)
    if not a or not b or b['pop'] <= 1:
        continue
    if any(r[k] is None or r[k] <= 0 for r in [a, b] for k in ['rgdpo', 'emp', 'pop', 'hc']):
        continue
    investment = [years.get(y, {}).get('csh_i') for y in range(1960, 2020)]
    if any(x is None for x in investment) or sum(investment) <= 0:
        continue
    returns = [years[y]['irr'] for y in range(2000, 2020) if years[y]['irr'] is not None]
    rows.append([code, a['country'], a['rgdpo']/a['emp']/1000,
                 b['rgdpo']/b['emp']/1000, sum(investment)/60,
                 math.log(b['pop']/a['pop'])/59, a['hc'], b['hc'],
                 int(code in oecd), sum(returns)/len(returns) if returns else None])

# Independent QR/SVD least squares, using source inputs rounded to the site's
# published precision. Normal-equation code in the visualization is not reused.
cases = []
for subset in ['all', 'oecd']:
    data = [r for r in rows if subset == 'all' or r[8]]
    y = np.log([round(r[3], 3) for r in data])
    ls = np.log([round(r[4], 4) for r in data])
    lh = np.log([round(r[7], 3) for r in data])
    for gd in [.02, .05, .1]:
        lnd = np.log(np.expm1([round(r[5], 5) for r in data]) + gd)
        models = {}
        for name, cols in [('sol', [ls, lnd]), ('aug', [ls, lnd, lh])]:
            X = np.column_stack([np.ones(len(y)), *cols])
            coef = np.linalg.lstsq(X, y, rcond=None)[0]
            pred = X @ coef
            rss = np.sum((y-pred)**2)
            r2 = 1-rss/np.sum((y-y.mean())**2)
            models[name] = {'b': coef.tolist(), 'adjR2': float(1-(1-r2)*(len(y)-1)/(len(y)-X.shape[1]))}
        for name, raw in [('sol3', .5*(ls-lnd)), ('aug3', .5*(ls-lnd)+lh)]:
            pred = raw+(y-raw).mean()
            models[name] = {'adjR2': float(1-np.sum((y-pred)**2)/np.sum((y-y.mean())**2))}
        cases.append({'subset': subset, 'gd': gd, 'n': len(y), 'models': models})

report = {
    'release': 'Penn World Table 10.0 (June 18, 2021 update)',
    'source': 'https://www.rug.nl/ggdc/docs/pwt100.xlsx',
    'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'attribution': 'Feenstra, Robert C., Robert Inklaar and Marcel P. Timmer (2015), The Next Generation of the Penn World Table, AER 105(10), 3150–3182.',
    'license': 'CC BY 4.0',
    'oecdSource': 'https://www.oecd.org/en/about/legal.html',
    'columns': ['code', 'country', 'y1960_thousand_USD', 'y2019_thousand_USD', 'mean_csh_i_1960_2019', 'log_population_growth_1960_2019', 'hc1960', 'hc2019', 'oecd_by_1973', 'mean_available_irr_2000_2019'],
    'rows': rows,
    'regressions': cases,
    'growthAccountingColumns': ['code','year','rgdpna','rnna','emp','hc','labsh'],
    'growthAccountingRows': [[code,year,*[countries[code][year][key] for key in ['rgdpna','rnna','emp','hc','labsh']]]
                             for code in ['USA','JPN','KOR','CHN','DEU','BRA','IND','GBR','FRA','MEX']
                             for year in [1960,1970,1980,1990,2000,2010,2019]],
    'usRows': [[year,countries['USA'][year]['rgdpna']/countries['USA'][year]['emp']/1000,
                countries['USA'][year]['rnna']/countries['USA'][year]['emp']/1000,
                countries['USA'][year]['rnna']/countries['USA'][year]['rgdpna'],
                countries['USA'][year]['labsh'],countries['USA'][year]['irr']]
               for year in range(1950,2020)],
}
target.write_text(json.dumps(report, indent=2, ensure_ascii=False)+'\n')
print(f'{len(rows)} source-derived countries; {len(cases)} independent regression cases -> {target}')
