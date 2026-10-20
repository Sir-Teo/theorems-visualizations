"""Independent32bit stream and literal Bernoulli sampling; rational post-founder H."""
import hashlib,json,math,struct
from decimal import Decimal as D,getcontext
from pathlib import Path
getcontext().prec=80
def stream(seed):
 a=(seed&0xffffffff) or 1
 while True:
  a=(a+0x6d2b79f5)&0xffffffff
  t=((a^(a>>15))*(1|a))&0xffffffff
  t^=(t+((t^(t>>7))*(61|t)&0xffffffff))&0xffffffff
  yield ((t^(t>>14))&0xffffffff)/4294967296
cases=[]
for N,K,seed in [(2,24,3),(10,3,4),(200,3,99)]:
 print('Independent founder reference',N,K,seed,flush=True)
 start=stream(seed*977+1);p0=[.01+.49*(1-math.cos(math.pi*next(start))) for _ in range(400)]
 H0=math.fsum(2*p*(1-p) for p in p0)/400;runs=[];raw=bytearray();n=2*N
 for c in range(20):
  r=stream(seed*977+N*13+c*104729+1);p=p0[:];hs=[str(H0)]
  for k in range(K):
   counts=[sum(next(r)<q for _ in range(n)) for q in p];p=[x/n for x in counts]
   hs.append(str(D(2*sum(x*(n-x) for x in counts))/D(n*n*400)))
  raw.extend(struct.pack('<'+'H'*400,*counts));runs.append(hs)
 cases.append(dict(N=N,K=K,seed=seed,p0=p0[:10],H0=str(H0),hs=runs,expected=[str(D(str(H0))*(D(n-1)/D(n))**k) for k in range(K+1)],finalCountsSHA256=hashlib.sha256(raw).hexdigest()))
out=Path(__file__).resolve().parents[1]/'docs/verification/bighist-founder-reference.json';out.write_text(json.dumps(cases,indent=1)+'\n')
