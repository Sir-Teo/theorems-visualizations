#!/usr/bin/env python3
"""Independent 70-digit quadrature for the Harris AR(1) total-variation display.

Run with Python and mpmath installed; writes the checked-in JSON reference fixture.
"""
import json
from pathlib import Path
import mpmath as mp
mp.mp.dps = 70
alpha = mp.mpf('.95')
cases = [(0, 1, 1), ('.3', '.25', 1), (3, 1, 1), (12, '.1', 1),
         (-6, 4, 1), (0, 9, 1), ('.01', '.9999', 1),
         (20 * alpha**40, (1-alpha**80)/(1-alpha**2), 1/(1-alpha**2))]
rows = []
for mean, variance, stationary_variance in cases:
    mean, variance, stationary_variance = map(mp.mpf, [mean, variance, stationary_variance])
    f = lambda x: mp.exp(-(x-mean)**2/(2*variance))/mp.sqrt(2*mp.pi*variance)
    g = lambda x: mp.exp(-x*x/(2*stationary_variance))/mp.sqrt(2*mp.pi*stationary_variance)
    if mean == 0 and variance == stationary_variance:
        tv = mp.mpf(0)
    else:
        if variance == stationary_variance:
            roots = [mean/2]
        else:
            coefficients = [1/stationary_variance - 1/variance,
                            2*mean/variance,
                            -mean**2/variance + mp.log(stationary_variance/variance)]
            roots = sorted(mp.polyroots(coefficients, maxsteps=100))
        # Integrate densities themselves, not production's CDF difference formula.
        tv = sum(mp.quad(lambda x: abs(f(x)-g(x)), [a,b])
                 for a,b in zip([-mp.inf]+roots, roots+[mp.inf])) / 2
    rows.append({'mean': float(mean), 'variance': float(variance),
                 'stationaryVariance': float(stationary_variance), 'tv': str(tv)})
Path('docs/verification/harris-gaussian-references.json').write_text(json.dumps({
    'precisionDigits': 70,
    'method': 'mpmath adaptive quadrature of absolute Gaussian density difference, split at independently solved polynomial crossings',
    'rows': rows,
}, indent=2)+'\n')
print('Wrote', len(rows), 'independent Harris Gaussian-TV references')
