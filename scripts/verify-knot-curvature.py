#!/usr/bin/env python3
"""Independent radial-coordinate derivatives and 80-digit adaptive quadrature."""
import json
from pathlib import Path
import mpmath as mp
mp.mp.dps=80
rows=[]
for kind in ['tre','unk','wrinkle']:
 for eps in ['0','.02','.2','.6','1.6']:
  e=mp.mpf(eps)
  def integrand(t):
   if kind=='tre':
    r=mp.mpf('1.3')+mp.mpf('.3')*mp.cos(3*t)
    rp=-mp.mpf('.9')*mp.sin(3*t);rpp=-mp.mpf('2.7')*mp.cos(3*t)
    co=mp.cos(2*t);si=mp.sin(2*t)
    a=[rp*co-2*r*si,rp*si+2*r*co,3*e*mp.cos(3*t)]
    b=[(rpp-4*r)*co-4*rp*si,(rpp-4*r)*si+4*rp*co,-9*e*mp.sin(3*t)]
   else:
    n=2 if kind=='unk' else 6
    a=[-mp.mpf('1.3')*mp.sin(t),mp.mpf('1.3')*mp.cos(t),n*e*mp.cos(n*t)]
    b=[-mp.mpf('1.3')*mp.cos(t),-mp.mpf('1.3')*mp.sin(t),-n*n*e*mp.sin(n*t)]
   cr=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
   return mp.sqrt(mp.fsum(x*x for x in cr))/mp.fsum(x*x for x in a)
  total=mp.quad(integrand,[2*mp.pi*i/16 for i in range(17)])
  rows.append({'kind':kind,'epsilon':eps,'totalCurvature':mp.nstr(total,65),'inPiUnits':mp.nstr(total/mp.pi,65)})
Path('docs/verification/knot-curvature-references.json').write_text(json.dumps({'precision':80,'method':'mpmath adaptive tanh-sinh; original radial derivatives, independent of harmonic JS implementation','rows':rows},indent=2)+'\n')
print('Wrote',len(rows),'independent curvature references')
