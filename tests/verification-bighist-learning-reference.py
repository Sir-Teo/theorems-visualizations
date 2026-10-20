"""Independent65-digit full group updates and source-free Gumbel identity oracle."""
from decimal import Decimal as D,getcontext,ROUND_HALF_UP
from pathlib import Path
import json,sys
getcontext().prec=65;mask=2**32-1;gamma=D('0.5772156649015328606065120900824024310421593359399235988057672348848677')
def integers(seed):
 a=seed&mask
 while True:
  a=(a+0x6d2b79f5)&mask;t=((a^(a>>15))*(a|1))&mask;t=(t^((t+((t^(t>>7))*(t|61)&mask))&mask))&mask;yield(t^(t>>14))&mask
cases=[(50,'.3','1',3,True),(1,'0','.5',0,True),(1250,'1','2',9999,False),(7,'.5','.8',17,False),(11,'.35','1.7',2718,True),(3,'.05','.5',41,False),(2,'.95','2',17,True),(1250,'.55','.55',0,False)]
out=[]
for m,c,beta,seed,bound in cases:
 c=D(c);beta=D(beta);q=int((c*m).to_integral_value(rounding=ROUND_HALF_UP));own=m-q;sc=[]
 for si,alpha in enumerate([3,5,7]):
  runs=[];final=[]
  for ri in range(10):
   rng=integers(seed+1013*ri+7919*si);z=[D(12)]*4;states=[dict(g=0,z=list(map(str,z)))];lastbest=D(12)
   for g in range(1,121):
    glob=max(z);nxt=[]
    for local in z:
     candidates=[]
     for count,model in [(own,local),(q,glob)]:
      if count:
       u=(D(next(rng))+D('.5'))/D(2**32);error=beta*(D(count).ln()-(-u.ln()).ln());candidates.append(model-alpha+error)
     value=max(candidates);nxt.append(max(D(0),value) if bound else value)
    z=nxt
    if g in [1,2,20,60,120]:states.append(dict(g=g,z=list(map(str,z))))
   final.append(max(z));runs.append(states)
  sc.append(dict(alpha=alpha,runs=runs,meanFinal=str(sum(final)/10),threshold=str((D(alpha)/beta-gamma).exp()),drift=str(-D(alpha)+beta*(D(4*m).ln()+gamma))))
 out.append(dict(m=m,c=float(c),beta=float(beta),seed=seed,bound=bound,q=q,scenarios=sc))
dest=Path(sys.argv[1])if len(sys.argv)>1 else Path('docs/verification/bighist-learning-reference.json');dest.write_text(json.dumps(out,indent=2)+'\n')
