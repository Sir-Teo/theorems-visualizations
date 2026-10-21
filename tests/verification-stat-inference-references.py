import json,math
from statistics import NormalDist
from decimal import Decimal,getcontext
getcontext().prec=65
n=20;rows=[]
for l in range(80,100):
 level=Decimal(l)/100;a=(1-level)/2
 def prob(p,x,upper):
  return sum(Decimal(math.comb(n,k))*p**k*(1-p)**(n-k) for k in (range(x,n+1) if upper else range(x+1)))
 intervals=[]
 for x in range(n+1):
  ends=[]
  for upper in [True,False]:
   if upper and x==0:ends.append('0');continue
   if not upper and x==n:ends.append('1');continue
   lo=Decimal(0);hi=Decimal(1)
   for _ in range(180):
    mid=(lo+hi)/2;v=prob(mid,x,upper)
    if (v<a)==upper:lo=mid
    else:hi=mid
   ends.append(str((lo+hi)/2))
  intervals.append(ends)
 rows.append(dict(level=str(level),intervals=intervals,normalHalf=NormalDist().inv_cdf((1+float(level))/2)/10))
open('docs/verification/stat-inference-references.json','w').write(json.dumps(dict(generator='65-digit Decimal finite binomial tail sums and180-step bisection; n20, levels.80..99',rows=rows)))
