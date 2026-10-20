"""Independent Decimal70digit segment-survival oracle. No production imports."""
import json
from decimal import Decimal as D, getcontext
getcontext().prec=70
profiles=[[10000,3000,1000,74,25],[2000,50,30000,30,20],[50000,20000,20,140,30],[2000,20000,30000,140,30],[2000,2000,20,74,25],[12300,4970,8130,99,27],[50000,50,20,30,30],[8000,50,30000,30,20]]
out=[]
for xs in profiles:
 n,k,d,b,g=map(D,xs);a=b-d/1000
 def survival(t):
  # Multiply each exact exponential segment tail, separately from the JS H formula.
  spans=[(min(t,a),n),(max(D(0),min(t,b)-a),k),(max(D(0),t-b),n)]
  s=D(1)
  for span,size in spans:s*=(-1000*span/(2*g*size)).exp()
  return s
 times=sorted(set([D(0),a/2,a,(a+b)/2,b,b+D('.00001'),D(200),D(300)]))
 p=1-(-d/(2*g*k)).exp();p0=1-(-d/(2*g*n)).exp();s=survival(a)
 out.append(dict(args=xs,a=str(a),conditional=str(p),baselineConditional=str(p0),before=str(s),mass=str(s*p),baselineMass=str(s*p0),points=[[str(t),str(1-survival(t)),str(1-(-1000*t/(2*g*n)).exp())] for t in times]))
print(json.dumps(out,indent=2))
