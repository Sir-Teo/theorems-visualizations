"""Independent Fraction membership and 90-digit Decimal pitch oracle."""
from fractions import Fraction as F
from decimal import Decimal as D, localcontext
import json
from pathlib import Path
pairs=[(12,(0,-3),(4,-1),19,28),(19,(4,-1),(-1,5),30,44),(31,(4,-1),(3,7),49,72),(41,(8,1),(-1,5),65,95),(53,(8,1),(-5,6),84,123)]
rows=[]
with localcontext() as ctx:
 ctx.prec=90
 for n,u,v,m3,m5 in pairs:
  det=u[0]*v[1]-u[1]*v[0]
  assert abs(det)==n
  assert int((D(3).ln()/D(2).ln()*n).to_integral_value(rounding='ROUND_HALF_UP'))==m3
  assert int((D(5).ln()/D(2).ln()*n).to_integral_value(rounding='ROUND_HALF_UP'))==m5
  found=[]
  for a in range(-30,31):
   for b in range(-30,31):
    s=F(v[1]*a-v[0]*b,det);t=F(-u[1]*a+u[0]*b,det)
    if not(0<=s<1 and 0<=t<1):continue
    r=F(3)**a*F(5)**b
    while r<1:r*=2
    while r>=2:r/=2
    cents=1200*(D(r.numerator).ln()-D(r.denominator).ln())/D(2).ln()
    found.append(dict(a=a,b=b,p=str(r.numerator),q=str(r.denominator),cents=float(cents),step=(a*m3+b*m5)%n))
  assert len(found)==n
  assert sorted(p['step'] for p in found)==list(range(n))
  rows.append(dict(n=n,u=u,v=v,m3=m3,m5=m5,points=found))
p=Path(__file__).resolve().parents[1]/'docs/verification/music-periodicity-reference.json'
p.write_text(json.dumps(dict(method='Independent Fraction inverse coordinates; exact rational octave folding; 90-digit Decimal logarithms',rows=rows),indent=2)+'\n')
print('PASS five original-source vector pairs, exact half-open counts, patent rounding, every modular image, 156 exact ratios and independent high-precision cents')
