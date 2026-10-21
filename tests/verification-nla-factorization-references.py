import json,numpy as np
rng=np.random.default_rng(23517);rows=[]
for i in range(300):
 n=1+i%8;A=rng.integers(-8,9,(n,n))/4;A=(A+A.T)/2
 if i%7==0: A[-1,:]=0;A[:,-1]=0
 rows.append(dict(A=A.tolist(),values=np.linalg.eigvalsh(A).tolist()))
open('docs/verification/nla-factorization-references.json','w').write(json.dumps(dict(generator='NumPy eigvalsh, independent symmetric eigensolver; seed23517',rows=rows)))
import sys,json,math
from fractions import Fraction
import mpmath as mp
mp.mp.dps=90;rows=[]
for n in range(2,25):
 H=mp.matrix(n);V=mp.matrix(n)
 for i in range(n):
  for j in range(n):
   H[i,j]=mp.mpf(1)/(i+j+1)
   V[i,j]=(-1)**(i+j)*(i+j+1)*math.comb(n+i,n-j-1)*math.comb(n+j,n-i-1)*math.comb(i+j,i)**2
 for i in range(n):
  for j in range(n):assert sum(Fraction(int(V[k,j]),i+k+1) for k in range(n))==int(i==j)
 rows.append(dict(n=n,kappa=mp.nstr(mp.eigsy(H,eigvals_only=True)[n-1]*mp.eigsy(V,eigvals_only=True)[n-1],85)))
open('docs/verification/nla-inverse-references.json','w').write(json.dumps(dict(generator='mpmath1.3.0,90 digits; exact Fraction verification H*Hinv=I for every n2..24',rows=rows)))
