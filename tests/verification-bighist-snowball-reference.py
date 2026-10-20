"""Independent80digit dense-LU fixed-point solve, exact rational cell integration."""
import json
from decimal import Decimal as D,getcontext
getcontext().prec=80
n=24;A=D('203.3');B=D('2.09');C=D(10);Q=D('340.25');diff=D('.649')*n*n
faces=[D(i)/n for i in range(n+1)]
left=[1-faces[i]**2 if i else D(0) for i in range(n)];right=[1-faces[i+1]**2 for i in range(n)]
S=[1-D('.477')*((faces[i+1]**3-faces[i]**3)*n-1)/2 for i in range(n)]
M=[[D(0)for j in range(n)]for i in range(n)]
for i in range(n):
 M[i][i]=C+B+diff*(left[i]+right[i])
 if i:M[i][i-1]=-diff*left[i]
 if i+1<n:M[i][i+1]=-diff*right[i]
# Generic dense LU, deliberately independent of production tridiagonal Thomas.
for k in range(n):
 for i in range(k+1,n):
  M[i][k]/=M[k][k]
  for j in range(k+1,n):M[i][j]-=M[i][k]*M[k][j]
def solve(rhs):
 y=[]
 for i in range(n):y.append(rhs[i]-sum(M[i][j]*y[j]for j in range(i)))
 x=[D(0)]*n
 for i in reversed(range(n)):x[i]=(y[i]-sum(M[i][j]*x[j]for j in range(i+1,n)))/M[i][i]
 return x
out=[]
for age,logc in [(0,'-.5'),(0,'0'),(700,'0'),(700,'1'),(1000,'0'),(1000,'4.5')]:
 for branch in ['warm','frozen']:
  L=1/(1+D('.4')*age/D(4570));F=D('5.35')*D(10).ln()*D(logc);T=[D(120 if branch=='warm'else-120)]*n
  for step in range(12000):
   alpha=[]
   for t in T:
    e=(t+10).exp();alpha.append(D('.32')+D('.15')*(1-(e-1)/(e+1)))
   rhs=[C*t+Q*L*s*(1-a)+F-A for t,s,a in zip(T,S,alpha)]
   z=solve(rhs);delta=max(abs(x-y)for x,y in zip(T,z));T=z
   if delta<D('1e-28'):break
  else:raise RuntimeError('independent reference did not converge')
  out.append(dict(age=age,logC=float(logc),branch=branch,T=[str(t)for t in T],mean=str(sum(T)/n)))
print(json.dumps(out,indent=2))
