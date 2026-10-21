"""Independent80digit Decimal allometry via repeated square roots, JSON to stdout."""
import json
from decimal import Decimal as D,getcontext
getcontext().prec=80
out=[]
for vs in ['350','1300','1800']:
 for ms in ['25','65','90']:
  for ds in ['.95','1','1.1']:
   v,m,d=map(D,[vs,ms,ds]);mass=v*d/1000;brain=D('11.2')*mass;total=D('3.39')*(m*m*m).sqrt().sqrt()
   out.append(dict(volume=float(v),body=float(m),density=float(d),mass=str(mass),brain=str(brain),total=str(total),remaining=str(total-brain),share=str(100*brain/total)))
print(json.dumps(out,indent=2))
