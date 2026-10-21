from fractions import Fraction as F
from pathlib import Path
import json
# Positive-term atanh series with an exact rational geometric tail bound.
def log_bounds(r,n=160):
 x=(r-1)/(r+1);s=2*sum((x**(2*j+1)/F(2*j+1) for j in range(n)),F(0))
 return s,s+2*x**(2*n+1)/((2*n+1)*(1-x*x))
c,d=log_bounds(F(2))
def alpha(r):
 a,b=log_bounds(r);return a/d,b/c
ratios=dict(fifth=F(3,2),major=F(5,4),minor=F(6,5),seventh=F(7,4),septimal=F(7,6));data={}
for name,r in ratios.items():
 lo,hi=alpha(r);out=[];best=None
 for n in range(1,701):
  k=int(n*lo+F(1,2));assert k==int(n*hi+F(1,2));el,eh=1200*(F(k,n)-hi),1200*(F(k,n)-lo);assert el*eh>0
  al,ah=sorted([abs(el),abs(eh)])
  if n>=3:
   if best is None:record=True
   elif k*best[0]==best[1]*n:record=False # exact same fraction, hence a tie
   else:
    assert ah<best[2] or al>best[3]
    record=ah<best[2]
   if record:best=(n,k,al,ah)
   out.append(dict(n=n,k=k,error=float((el+eh)/2),record=record))
 data[name]=out
 # Finite no-earlier-improvement statements, including exact rational ties.
 if name=='fifth':
  n=12;k=7;el,eh=sorted([abs(12*lo-7),abs(12*hi-7)])
  for q in range(1,41):
   if q==12:continue
   p=int(q*lo+F(1,2));assert min(abs(q*lo-p),abs(q*hi-p))>eh
  cent=max(abs(1200*(F(7,12)-lo)),abs(1200*(F(7,12)-hi)))
  for q in range(1,29):
   p=int(q*lo+F(1,2))
   if p*12==7*q:continue
   assert min(abs(1200*(F(p,q)-lo)),abs(1200*(F(p,q)-hi)))>cent
rows=[dict(target=t,**next(x for x in data[t] if x['n']==n)) for n in [12,19,31] for t in ratios]
# The selected graphs' entire domain fits the declared logarithmic window.
for t in ['fifth','major','seventh']:
 assert all(F(1,10000)<abs(x['error'])<400 for x in data[t][:118])
result=dict(points={k:data[k] for k in ['fifth','major','seventh']},comparisons=rows)
Path(__file__).resolve().parents[1].joinpath('docs/verification/music-edo-reference.json').write_text(json.dumps(result))
print('PASS exact rational log bounds: all5 targets ×700 nearest steps/signs; all3 strict cents record sequences;12-before29/41 claims and exact24 tie; all15 comparisons')
