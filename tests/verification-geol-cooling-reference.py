"""Independent 65-digit sine-series and quadrature references; no atlas imports.

PYTHONPATH=/tmp/atlas-mpmath python3 tests/verification-geol-cooling-reference.py
The 800-mode direct sum has exp(-389) last-mode damping in the worst case.
"""
import json
from pathlib import Path
import mpmath as m
m.mp.dps = 65
MYR = m.mpf('31557600000000')
kappa = m.mpf('0.000001')
out = {'precision': 65, 'method': 'independent direct 800-mode Fourier sums and transformed adaptive quadrature', 'erfc': [], 'plate': [], 'bins': []}
for x in ['-4', '-1', '0', '0.000001', '0.1', '1', '1.224744871391589', '1.224744871391590', '2', '4', '8', '15', '25']:
    out['erfc'].append({'x': float(x), 'value': str(m.erfc(m.mpf(x)))})
for a in [50000, 100000, 160000]:
    ages = [m.mpf(t) for t in ['.05', '.3', '1', '20', '100', '180']]
    ages += [s*a*a/(kappa*MYR) for s in [m.mpf('.05'), m.mpf('.1')]]
    for t in ages:
        s = kappa*t*MYR/(a*a)
        modes = [(n, m.exp(-n*n*m.pi*m.pi*s)) for n in range(1, 801)]
        temperatures = []
        for y in [m.mpf('.005'), m.mpf('.1'), m.mpf('.5'), m.mpf('.9')]:
            theta = y+m.fsum(2*m.sin(n*m.pi*y)*e/(n*m.pi) for n,e in modes)
            temperatures.append({'fraction': float(y), 'temperature': str(1300*theta)})
        q = m.mpf('3.138')*1300/a*(1+2*m.fsum(e for n,e in modes))
        w = m.mpf(3300)*m.mpf('.00003')*1300*a/2300*(m.mpf('.5')-4/(m.pi*m.pi)*m.fsum(e/(n*n) for n,e in modes if n%2))
        out['plate'].append({'a': a, 't': float(t), 'temperature': temperatures, 'q': str(q), 'w': str(w)})
for T in [1100, 1500]:
 for k in [m.mpf('2.5'), m.mpf('4')]:
  for sealing in [20, 90]:
   for f0 in [m.mpf('0'), m.mpf('.6')]:
    c=k*T/m.sqrt(m.pi*kappa*MYR)*2*m.mpf('3.1e14')/180/m.mpf('1e12')
    rows=[]
    # t=u^2 cancels the singularity: endpoint value is 2c, not zero.
    for lo in range(0, 180, 10):
        hi=lo+10
        def integrand(u):
            t=u*u
            fraction=1 if t>=sealing else 1-(1-f0)*(1-t/sealing)**2
            return 2*c*(1-t/180)*fraction
        split=[m.sqrt(lo)]
        if lo<sealing<hi: split.append(m.sqrt(sealing))
        split.append(m.sqrt(hi))
        rows.append(str(m.quad(integrand,split)))
    out['bins'].append({'T':T,'k':float(k),'sealing':sealing,'f0':float(f0),'conducted':rows})
Path('docs/verification/geol-cooling-reference.json').write_text(json.dumps(out,indent=2)+'\n')
print('Wrote 24 plate cases / 96 temperatures and 288 independent bin integrals at 65 digits')
