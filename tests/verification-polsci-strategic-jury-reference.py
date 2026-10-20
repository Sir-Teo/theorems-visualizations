from decimal import Decimal as D, localcontext
from pathlib import Path
import json, math
with localcontext() as ctx:
 ctx.prec=90;p=D('.8');q=D('.9')
 def pmf(n,k,a):return D(math.comb(n,k))*a**k*(1-a)**(n-k) if 0<a<1 else D(int(k==(n if a==1 else 0)))
 def trial(n,k,si,sg):
  g=p*sg+(1-p)*si;i=(1-p)*sg+p*si;pg=pmf(n-1,k-1,g);pi=pmf(n-1,k-1,i)
  postg=p*pg/(p*pg+(1-p)*pi);posti=(1-p)*pg/((1-p)*pg+p*pi)
  return g,i,postg,posti
 def compute(n,k):
  si=D(0);sg=D(1);_,_,pg,pi=trial(n,k,si,sg)
  if pi>q:
   lo=D(0);hi=1-D('1e-80')
   for _ in range(320):
    mid=(lo+hi)/2
    if trial(n,k,mid,D(1))[3]>q:lo=mid
    else:hi=mid
   si=(lo+hi)/2
  elif pg<q:
   if k==1:sg=D(0)
   else:
    lo=D('1e-80');hi=D(1)
    for _ in range(320):
     mid=(lo+hi)/2
     if trial(n,k,D(0),mid)[2]>q:lo=mid
     else:hi=mid
    sg=(lo+hi)/2
  g=p*sg+(1-p)*si;i=(1-p)*sg+p*si
  ci=sum(pmf(n,j,i) for j in range(k,n+1));ag=sum(pmf(n,j,g) for j in range(k));return dict(n=n,k=k,gi=float(si),gg=float(sg),ci=float(ci),ag=float(ag))
 rows=[compute(12,k) for k in range(1,13)]+[compute(n,n) for n in [2,3,4,5,12,31,51,101]]
 f=(1-q)*(1-p)/(q*p);result=dict(method='90-digit Decimal posterior bisection and separately summed binomial probabilities; no analytic branch formula imported',rows=rows,limitCI=float((p/(2*p-1)*f.ln()).exp()),limitAG=float(1-((1-p)/(2*p-1)*f.ln()).exp()))
 dest=Path(__file__).resolve().parents[1]/'docs/verification/polsci-strategic-jury-reference.json';dest.write_text(json.dumps(result,indent=2)+'\n');print('PASS independent90-digit posterior-root20fixtures/limits')
