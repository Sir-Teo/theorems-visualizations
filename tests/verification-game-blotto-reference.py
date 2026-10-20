"""Reconstruct feasible rational certificates, then prove every payoff inequality exactly."""
import json,subprocess,itertools
from pathlib import Path
from fractions import Fraction as F
root=Path(__file__).resolve().parents[1]
script="import{blottoGame}from'./content/game/blotto-audit.js';console.log(JSON.stringify(Array.from({length:10},(_,i)=>{const g=blottoGame(i+3);return{N:i+3,x:g.solution.x,y:g.solution.y};})));"
raw=json.loads(subprocess.check_output(['node','--input-type=module','-e',script],cwd=root));out=[];checks=0
for row in raw:
 n=row['N'];a=[t for t in itertools.product(range(n+1),repeat=3) if sum(t)==n];x=[F(q).limit_denominator(1000000)for q in row['x']];y=[F(q).limit_denominator(1000000)for q in row['y']]
 assert sum(x)==sum(y)==1 and min(x+y)>=0
 def pay(u,v):return F(sum(1 if p>q else -1 if p<q else 0 for p,q in zip(u,v)),2)
 lo=min(sum(x[i]*pay(u,v)for i,u in enumerate(a))for v in a);hi=max(sum(y[j]*pay(u,v)for j,v in enumerate(a))for u in a)
 assert lo==hi==0,(n,lo,hi);checks+=2*len(a)
 out.append({'N':n,'x':[[str(q.numerator),str(q.denominator)]for q in x],'y':[[str(q.numerator),str(q.denominator)]for q in y],'minimumRowPayoff':str(lo),'maximumColumnPayoff':str(hi)})
(root/'docs/verification/game-blotto-reference.json').write_text(json.dumps(out,indent=2)+'\n');print(f'PASS {len(out)} exact rational strategy pairs, {checks} complete security inequalities and20 exact simplex/positivity certificates')
