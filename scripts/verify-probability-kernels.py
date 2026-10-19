#!/usr/bin/env python3
"""Independent high-precision Gaussian conditional probabilities and joint rectangles."""
import json
from pathlib import Path
import mpmath as mp
mp.mp.dps=70
Phi=lambda x:(1+mp.erf(x/mp.sqrt(2)))/2
phi=lambda x:mp.exp(-x*x/2)/mp.sqrt(2*mp.pi)
rows=[]
for rho in ['-.95','0','.7','.95']:
 p=mp.mpf(rho);sd=mp.sqrt(1-p*p)
 for a,b,c,y in [('-3','3','.2','-2.5'),('-.5','1.5','1','1'),('1','3','3','2.5'),('0','0','.2','0')]:
  aa,bb,cc,yy=map(mp.mpf,[a,b,c,y]);m=p*yy
  conditional=Phi((bb-m)/sd)-Phi((aa-m)/sd)
  # Independent integral orientation: integrate X's marginal and Y|X, rather than Y then X|Y.
  joint=mp.quad(lambda x:phi(x)*(Phi((cc-p*x)/sd)-Phi((-cc-p*x)/sd)),[aa,bb]) if aa!=bb else mp.mpf(0)
  rows.append({'rho':rho,'a':a,'b':b,'c':c,'y':y,'conditional':mp.nstr(conditional,60),'joint':mp.nstr(joint,60)})
Path('docs/verification/probability-kernel-references.json').write_text(json.dumps({'precision':70,'method':'mpmath erf and adaptive integration over X, independent of runtime integration over Y','rows':rows},indent=2)+'\n')
print('Wrote',len(rows),'kernel references')
