import sys,json,hashlib,pathlib
sys.path.insert(0,'/tmp/atlas-numerical-python')
import mpmath as m
m.mp.dps=100
out={'precision':100,'method':'independent 100-digit barycentric Lebesgue sum and golden maximization; interval scan for Chebyshev','equispaced':[],'chebyshev':[]}
def best(n,cheb=False):
 xs=[-m.cos(m.pi*j/n) for j in range(n+1)] if cheb else [m.mpf(-1)+m.mpf(2)*j/n for j in range(n+1)]
 inv=[1/abs(m.fprod(x-y for j,y in enumerate(xs) if i!=j)) for i,x in enumerate(xs)]
 weights=[(-1 if (n-i)%2 else 1)*inv[i] for i in range(n+1)]
 def f(x):
  if x in xs:return m.mpf(1)
  terms=[weights[i]/(x-t) for i,t in enumerate(xs)]
  return sum(abs(v) for v in terms)/abs(sum(terms))
 L=m.mpf(1);at=xs[0]
 for i in (range(n) if cheb else [0]):
  lo,hi=xs[i:i+2]
  for _ in range(150):
   a=lo+(hi-lo)/3;b=hi-(hi-lo)/3
   if f(a)<f(b):lo=a
   else:hi=b
  x=(lo+hi)/2;y=f(x)
  if y>L:L=y;at=x
 return {'n':n,'L':str(L),'x':str(at)}
for n in [2,3,10,20,30,40,50,60]:out['equispaced'].append(best(n))
for n in [2,3,10,20,30,60]:out['chebyshev'].append(best(n,True))
out['gibbsFraction']=str(m.si(m.pi)/m.pi-m.mpf('.5'))
b=m.sinh(1);x=m.log(b);upper=m.cosh(1);lower=m.exp(x)-b*x;out['expBestLine']={'a':str((upper+lower)/2),'b':str(b),'E':str((upper-lower)/2)}
p=pathlib.Path('docs/verification/numerical-source-references.json');p.write_text(json.dumps(out,indent=2)+'\n')
