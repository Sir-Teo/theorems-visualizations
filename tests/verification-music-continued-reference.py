from fractions import Fraction as F
from pathlib import Path
import json
# Exact rational atanh series: ln r = 2 sum x^(2j+1)/(2j+1), x=(r-1)/(r+1).
# Bound remaining positive terms above by a geometric series with the first remaining denominator.
def log_bounds(r,n=160):
 x=(r-1)/(r+1)
 s=2*sum((x**(2*j+1)/F(2*j+1) for j in range(n)),F(0))
 return s,s+2*x**(2*n+1)/((2*n+1)*(1-x*x))
a,b=log_bounds(F(3,2));c,d=log_bounds(F(2));lo,hi=a/d,b/c
# Continued fraction quotients agree for both certified bounds.
def cf(x):
 out=[]
 for i in range(10):
  a=x.numerator//x.denominator;out.append(a);x=1/(x-a)
 return out
assert cf(lo)==cf(hi)==[0,1,1,2,2,3,1,5,2,23]
rows=[]
for q in range(1,666):
 p=int(q*lo+F(1,2));assert p==int(q*hi+F(1,2))
 l,h=q*lo-p,q*hi-p
 assert l*h>0
 rows.append(dict(p=p,q=q,signed=float((l+h)/2)))
convs=[(0,1),(1,1),(1,2),(3,5),(7,12),(24,41),(31,53),(179,306),(389,665)]
for k in range(1,8):
 p,q=convs[k];pn,qn=convs[k+1];el,eh=sorted([abs(q*lo-p),abs(q*hi-p)])
 for x in rows[:qn-1]:
  if x['q']==q:continue
  l,h=sorted([abs(x['q']*lo-x['p']),abs(x['q']*hi-x['p'])])
  assert l>eh
 assert eh<F(1,qn)
Path(__file__).resolve().parents[1].joinpath('docs/verification/music-continued-reference.json').write_text(json.dumps(dict(alpha=float((lo+hi)/2),quotients=cf(lo),points=rows)))
print('PASS exact rational log-series enclosure, 10 quotients, 665 nearest numerators/signs, all 7 complete best-approximation domains and strict error bounds')
