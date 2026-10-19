"""Independent 80-digit references, using direct drift differences and product sums.
Run with an environment providing mpmath; no runtime dependency is added to the atlas.
"""
import json
from pathlib import Path
import mpmath as mp
mp.mp.dps = 80
rows=[]
for kind in ['x','sq','log']:
    f={'x':lambda x:x,'sq':lambda x:x*x,'log':lambda x:mp.log(1+x)}[kind]
    for bs in ['0','.1','.25','.26','.6']:
        b=mp.mpf(bs)
        for x in [1,10,400,1000000]:
            xx=mp.mpf(x);p=mp.mpf('.5')+b/(xx+1)
            d=p*f(xx+1)+(1-p)*f(xx-1)-f(xx)
            rows.append(dict(kind=kind,b=float(b),x=x,drift=mp.nstr(d,65)))
scales=[]
for family in ['inv','sqrt','const']:
    for bs in ['-.2','0','.25','.45']:
        b=mp.mpf(bs);prod=mp.mpf(1);s=mp.mpf(0)
        for m in range(10000):
            if m:
                p=mp.mpf('.5')+(b/(m+1) if family=='inv' else b/mp.sqrt(m+1) if family=='sqrt' else b)
                prod*=(1-p)/p
            s+=prod
            if m+1 in [1,2,64,100,1000,10000]:scales.append(dict(family=family,b=float(b),N=m+1,logScale=mp.nstr(mp.log(s),65)))
Path('docs/verification/birth-death-references.json').write_text(json.dumps({'precisionDigits':80,'method':'direct function differences; direct arbitrary-precision products and sums','drifts':rows,'scales':scales},indent=2)+'\n')
print(f'Wrote {len(rows)} drift and {len(scales)} scale references')
