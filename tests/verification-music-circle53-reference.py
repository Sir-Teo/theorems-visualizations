from fractions import Fraction as F
from pathlib import Path
import json
from decimal import Decimal as D,getcontext
getcontext().prec=80
def bounds(r,n=160):
 x=(r-1)/(r+1);s=2*sum((x**(2*j+1)/F(2*j+1)for j in range(n)),F(0));return s,s+2*x**(2*n+1)/((2*n+1)*(1-x*x))
ln2lo,ln2hi=bounds(F(2));ratios=[(16,15),(9,8),(6,5),(5,4),(4,3),(45,32),(3,2),(8,5),(5,3),(9,5),(15,8),(25,16)];out=[]
for p,q in ratios:
 a,b=bounds(F(p,q));lo,hi=a/ln2hi,b/ln2lo
 for n in [12,53]:
  k=int(n*lo+F(1,2));assert k==int(n*hi+F(1,2));out.append(dict(p=p,q=q,n=n,k=k,error=float(1200*(F(k,n)-(lo+hi)/2))))
p=3**53;q=2**84;assert p>q
comma=D(1200)*(D(p)/D(q)).ln()/D(2).ln()
Path(__file__).resolve().parents[1].joinpath('docs/verification/music-circle53-reference.json').write_text(json.dumps(dict(rows=out,comma=float(comma))))
print('PASS independent exact rational-log nearest steps for24 comparisons and80-digit exact-prime-ratio53-fifth comma')
