"""Independent80-digit quadrature and bracketed inversion; no production import."""
import json,sys
from pathlib import Path
import mpmath as mp
mp.mp.dps=80
M=lambda x:mp.mpf(str(x));start=M(-600);end=M(-495);n0=M('0.0001');logit0=mp.log(n0/(1-n0))
cases=[(540,12,.3),(580,60,.05),(580,60,.6),(500,2,.05),(500,60,.6),(580,2,.6),(540,60,.05),(540,2,.6),(571,37,.23),(523,19,.41),(579,43,.09),(501,59,.59)]
rows=[]
for age,width,rate in cases:
 c=-M(age);w=M(width);r=M(rate);a=c-w/2;b=c+w/2
 def gate(t):
  if t<=a:return M(0)
  if t>=b:return M(1)
  u=(t-a)/w;return u*u*(3-2*u)
 def integral(t):
  knots=sorted(set([start,t]+[x for x in [a,b] if start<x<t]));return sum(mp.quad(gate,[lo,hi]) for lo,hi in zip(knots,knots[1:]))
 def stock(t):return 1/(1+mp.exp(-logit0-r*integral(t)))
 times=sorted(set([start,end]+[start+(end-start)*i/10 for i in range(11)]+[x for x in [a,b,c] if start<=x<=end]))
 crossings=[]
 for p in [M('.1'),M('.9')]:
  target=(mp.log(p/(1-p))-logit0)/r;lo=start;hi=M(1000)
  for _ in range(300):
   mid=(lo+hi)/2
   if integral(mid)<target:lo=mid
   else:hi=mid
  crossings.append((lo+hi)/2)
 rows.append(dict(age=age,width=width,rate=rate,samples=[[str(t),str(gate(t)),str(stock(t))] for t in times],t10=str(crossings[0]),t90=str(crossings[1]),duration=str(crossings[1]-crossings[0])))
out=Path(sys.argv[1]) if len(sys.argv)>1 else Path('docs/verification/bighist-cambrian-reference.json');out.write_text(json.dumps(rows,indent=2)+'\n')
