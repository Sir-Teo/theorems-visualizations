"""80-digit independent Decimal logistic odds, pulses and inverse witnesses."""
from decimal import Decimal as D, getcontext
from pathlib import Path
import json
getcontext().prec=80
ages=[443,359,251,200,65]
cases=[]
inputs=[['.5','.86','.75','.96','.8','.76'],['.372819456','.05','.1','.123456789','.987654321','.995']]
inputs += [[str(r),*[str(D('.995') if mask>>i&1 else D('.05')) for i in range(5)]] for r in ['.1','2'] for mask in range(32)]
for a in inputs:
 r,*fs=map(D,a);stock=D('.04');age=D(550);events=[]
 for t,f in zip(ages,fs):
  # Evolve log-odds additively, independently of JS reciprocal recurrence.
  odds=(stock/(1-stock)).ln()+r*(age-D(t))
  pre=1/(1+(-odds).exp());post=pre*(1-f);target=D('.9')*pre
  tau=max(D(0),((target/(1-target)).ln()-(post/(1-post)).ln())/r)
  events.append([str(pre),str(post),str(tau)]);stock=post;age=D(t)
 cases.append(dict(input=a,events=events))
out=Path(__file__).resolve().parents[1]/'docs/verification/bighist-extinction-reference.json'
out.write_text(json.dumps(cases,indent=1)+'\n')
print('66 cases: all64 rate/five-loss corners, default and continuous off-grid, at80digits')
