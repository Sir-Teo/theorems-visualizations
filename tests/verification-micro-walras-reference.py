"""Independent Decimal Taylor-series IVP reference, no RK or production imports."""
from decimal import Decimal as D, getcontext
import json
getcontext().prec=75

def taylor(a,b,h,order):
 A=[a];B=[b];IA=[1/a];IB=[1/b]
 for n in range(order):
  if n:
   IA.append(-sum((A[j]*IA[n-j] for j in range(1,n+1)),D(0))/a)
   IB.append(-sum((B[j]*IB[n-j] for j in range(1,n+1)),D(0))/b)
  qa=sum((B[j]*IA[n-j] for j in range(n+1)),D(0))
  qb=sum((A[j]*IB[n-j] for j in range(n+1)),D(0))
  A.append((-D('2.6')*(n==0)+D('.9')*qa+D('1.6')*IA[n])/(n+1))
  B.append((-D(2)*(n==0)+D('1.35')*qb+D('1.4')*IB[n])/(n+1))
 def horner(c):
  out=c[-1]
  for x in c[-2::-1]:out=x+h*out
  return out
 return horner(A),horner(B)

def solve(start,order,cap,ratio):
 a,b=map(D,start);t=D(0);out=[]
 for goal in map(D,['.05','.5','7','14']):
  while t<goal:
   fa=-D('2.6')+(D('.9')*b+D('1.6'))/a
   fb=-D(2)+(D('1.35')*a+D('1.4'))/b
   h=min(D(cap),D(ratio)*min(a,b)/(1+max(abs(fa),abs(fb))),goal-t)
   a,b=taylor(a,b,h,order);t+=h
  out.append([str(goal),str(a),str(b)])
 return out
rows=[]
for start in [['.1','.1'],['.1','2.9'],['2.9','.1'],['2.9','2.9'],['2.4','.5'],['.8','1.8']]:
 a=solve(start,20,'.01','.02');b=solve(start,24,'.005','.01')
 for x,y in zip(a,b):
  assert max(abs(D(x[j])-D(y[j])) for j in [1,2])<D('1e-30'),(start,x,y)
  rows.append({'start':start,'time':y[0],'p':[y[1],y[2]]})
print(json.dumps({'method':'75-digit Decimal independent power-series order20/24; two step caps/relative-change limits agree within1e-30','rows':rows},indent=2))
