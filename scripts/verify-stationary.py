#!/usr/bin/env python3
"""Independent exact finite chains and 70-digit reflected-walk tail references."""
from fractions import Fraction as F
from pathlib import Path
import json
import mpmath as mp
mp.mp.dps=70
chains={
 'gen5':[[1,6,1,1,1],[3,1,4,1,1],[1,1,1,6,1],[2,2,1,1,4],[5,1,1,2,1]],
 'bd5':[[4,6,0,0,0],[3,2,5,0,0],[0,3,2,5,0],[0,0,4,2,4],[0,0,0,7,3]],
 'wea3':[[7,2,1],[3,4,3],[2,3,5]],
}
def solve(A,b):
 a=[list(row)+[v] for row,v in zip(A,b)];n=len(b)
 for i in range(n):
  k=next(k for k in range(i,n) if a[k][i]);a[i],a[k]=a[k],a[i]
  d=a[i][i];a[i]=[x/d for x in a[i]]
  for j in range(n):
   if j!=i:
    d=a[j][i];a[j]=[x-d*y for x,y in zip(a[j],a[i])]
 return [row[-1] for row in a]
finite={}
for key,raw in chains.items():
 P=[[F(x,10) for x in row] for row in raw];n=len(P)
 A=[[P[j][i]-(i==j) for j in range(n)] for i in range(n-1)]+[[F(1)]*n]
 pi=solve(A,[F(0)]*(n-1)+[F(1)]);means=[]
 for x in range(n):
  others=[i for i in range(n) if i!=x]
  h=solve([[F(i==j)-P[i][j] for j in others] for i in others],[F(1)]*(n-1))
  means.append(1+sum(P[x][i]*v for i,v in zip(others,h)))
 assert all(pi[i]*means[i]==1 for i in range(n))
 finite[key]={'pi':[str(x) for x in pi],'returnMean':[str(x) for x in means]}
rows=[]
for ps in ['.3','.4','.49','.5','.51','.6','.7']:
 p=mp.mpf(ps);q=1-p
 for cap in [200,5000]:
  m=cap//2;n=m+1
  first=mp.binomial(2*n-2,n-1)/n*p**(n-1)*q**n
  tail=max(0,1-q/p)+first*mp.hyp2f1(1,mp.mpf(m)+mp.mpf('.5'),m+2,4*p*q)
  f=q;mean=mp.mpf(0)
  for n in range(1,m+1):
   mean+=2*n*f;f*=mp.mpf(4*n-2)/(n+1)*p*q
  mean+=cap*tail
  rows.append({'p':ps,'cap':cap,'tail':mp.nstr(tail,60),'cappedMean':mp.nstr(mean,60)})
Path('docs/verification/stationary-references.json').write_text(json.dumps({'precision':70,'finiteMethod':'exact Fraction linear equations: invariant law and independent first-step hitting equations','tailMethod':'Catalan binomial coefficient and Gauss hypergeometric tail, with finite weighted first-return sum','finite':finite,'reflecting':rows},indent=2)+'\n')
print('Wrote',len(finite),'exact chain references and',len(rows),'reflecting-tail references')
