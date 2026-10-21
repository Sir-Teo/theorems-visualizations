"""Independent70-digit individual-Bernoulli DP for six exact displayed-share half ties."""
from decimal import Decimal as D,getcontext
from pathlib import Path
import json,sys
getcontext().prec=70
cases=[(25,580),(45,700),(75,820),(85,700),(165,700),(175,700)]
out=[]
for N,tick in cases:
 whole,remainder=divmod(tick*N,1000);F=whole+int(2*remainder>=1000)
 a=D(13)/20;u=D(1)/2;mass=[D(1)]
 for accuracy in [a]*F+[u]*(N-F):
  nxt=[D(0)]*(len(mass)+1)
  for k,w in enumerate(mass):nxt[k]+=w*(1-accuracy);nxt[k+1]+=w*accuracy
  mass=nxt
 mean=sum(D(k)*w for k,w in enumerate(mass));variance=sum((D(k)-mean)**2*w for k,w in enumerate(mass))
 out.append(dict(N=N,tick=tick,requested=tick/1000,F=F,a=str(a),u=str(u),mean=str(mean),variance=str(variance),right=str(sum(mass[(N+1)//2:])),wrong=str(sum(mass[:(N+1)//2])),mass=list(map(str,mass))))
p=Path(sys.argv[1]) if len(sys.argv)>1 else Path('docs/verification/polsci-aggregation-rounding-reference.json');p.write_text(json.dumps(out,indent=2)+'\n')
