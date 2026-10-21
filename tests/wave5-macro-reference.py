"""Independent implicit-time quadrature oracle for the scalar Cagan expectation ODE.
No RK stepping or imported JavaScript formulas. Log price follows integrated adaptation.
"""
import math,json

def quad(f,a,b,tol=1e-10):
 def rec(a,b,fa,fm,fb,S,tol,depth):
  m=(a+b)/2;l=(a+m)/2;r=(m+b)/2;fl,fr=f(l),f(r)
  A=(m-a)*(fa+4*fl+fm)/6;B=(b-m)*(fm+4*fr+fb)/6
  if depth==0 or abs(A+B-S)<15*tol:return A+B+(A+B-S)/15
  return rec(a,m,fa,fl,fm,A,tol/2,depth-1)+rec(m,b,fm,fr,fb,B,tol/2,depth-1)
 fa,fm,fb=f(a),f((a+b)/2),f(b)
 return rec(a,b,fa,fm,fb,(b-a)*(fa+4*fm+fb)/6,tol,24)
rows=[]
for fraction in [.2,.7,.95]:
 d=fraction*100/math.e;lo,hi=0,1
 for _ in range(80):
  mid=(lo+hi)/2
  if mid*100*math.exp(-mid)<d:lo=mid
  else:hi=mid
 eq=(lo+hi)/2
 for e0 in [.05,.3]:
  velocity=lambda e: (2/3)*(d*math.exp(e)/100-e)
  for t in [2,8]:
   lo,hi=0,1-1e-9
   for _ in range(45):
    frac=(lo+hi)/2;e=e0+frac*(eq-e0);time=quad(lambda u:1/velocity(u),e0,e)
    if time<t:lo=frac
    else:hi=frac
   e=e0+(lo+hi)/2*(eq-e0)
   logp=quad(lambda u:u/velocity(u),e0,e)+(e-e0)/.4
   rows.append([fraction,e0,t,e,logp])
print(json.dumps(rows))
