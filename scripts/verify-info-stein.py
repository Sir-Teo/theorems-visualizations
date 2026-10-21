"""Independent 100-digit finite randomized Neyman–Pearson references."""
from decimal import Decimal, getcontext
from math import comb
from pathlib import Path
import json

getcontext().prec=100
rows=[]
for n,p,q,e in [(1,'.5','.2','.1'),(5,'.05','.95','.01'),(60,'.5','.2','.1'),(300,'.05','.95','.01'),(300,'.95','.05','.45'),(300,'.2','.8','.3'),(300,'.5','.5','.1'),(60,'.2','.21','.01')]:
    p,q,e=map(Decimal,(p,q,e))
    P=[Decimal(comb(n,k))*p**k*(1-p)**(n-k) for k in range(n+1)]
    Q=[Decimal(comb(n,k))*q**k*(1-q)**(n-k) for k in range(n+1)]
    budget=1-e
    beta=Decimal(0)
    if p==q:
        beta=budget
        boundary=None
        f=budget
    else:
        # An independent linear-program vertex: buy P-mass by smallest Q/P cost.
        for k in sorted(range(n+1),key=lambda k:Q[k]/P[k]):
            take=min(budget,P[k])
            beta+=take*Q[k]/P[k]
            budget-=take
            if not budget:
                boundary=k
                f=take/P[k]
                break
    rows.append(dict(n=n,p=str(p),q=str(q),epsilon=str(e),logBeta=str(beta.ln()/Decimal(2).ln()),boundary=boundary,probability=str(f)))
out=Path(__file__).resolve().parents[1]/'docs/verification/info-stein-references.json'
out.write_text(json.dumps({'precision':100,'method':'exact integer binomial coefficients and Decimal fractional cost optimization','rows':rows},indent=2)+'\n')
print(f'{len(rows)} independent references written')
