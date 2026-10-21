"""Independent exact-rational p-bit ties-even elimination oracle; stdin matrices."""
from fractions import Fraction as F
import json,sys

def rnd(x,p):
 x=F(x)
 if not x:return x
 a=abs(x);e=a.numerator.bit_length()-a.denominator.bit_length()
 if a<F(2)**e:e-=1
 q=F(2)**(e-p+1);t=a/q;k=t.numerator//t.denominator;d=t-k
 if d>F(1,2)or(d==F(1,2)and k%2):k+=1
 return (1 if x>0 else -1)*k*q

def solve(rows,p):
 a=[[rnd(F(x),p)for x in row]for row in rows];n=len(a)
 b=[[F(i==j)for j in range(n)]for i in range(n)]
 for k in range(n):
  j=max(range(k,n),key=lambda j:abs(a[j][k]));a[k],a[j]=a[j],a[k];b[k],b[j]=b[j],b[k]
  if not a[k][k]:return None
  for i in range(k+1,n):
   m=rnd(a[i][k]/a[k][k],p)
   for j in range(k+1,n):a[i][j]=rnd(a[i][j]-rnd(m*a[k][j],p),p)
   for j in range(n):b[i][j]=rnd(b[i][j]-rnd(m*b[k][j],p),p)
   a[i][k]=F(0)
 x=[[F(0)for _ in range(n)]for _ in range(n)]
 for j in range(n):
  for i in reversed(range(n)):
   s=b[i][j]
   for t in range(i+1,n):s=rnd(s-rnd(a[i][t]*x[t][j],p),p)
   x[i][j]=rnd(s/a[i][i],p)
 return [[float(v)for v in row]for row in x]
print(json.dumps([solve(row['A'],row['p'])for row in json.load(sys.stdin)]))
