"""Independent exact ratio / 90-digit logarithm and original-1994 score oracle."""
from fractions import Fraction as F
from decimal import Decimal as D,localcontext
from pathlib import Path
import json
pairs=[(1,1),(27,25),(25,21),(9,7),(7,5),(75,49),(5,3),(9,5),(49,25),(15,7),(7,3),(63,25),(25,9),(3,1)]
with localcontext() as ctx:
 ctx.prec=90;ln2=D(2).ln();ln3=D(3).ln();c4=D('261.6256');step=1200*ln3/ln2/13;bp=[];ideal=[];scores=[]
 def cents(r):return 1200*(D(r.numerator).ln()-D(r.denominator).ln())/ln2
 for k,(p,q) in enumerate(pairs):
  r=F(p,q);value=cents(r);bp.append(dict(k=k,p=p,q=q,just=float(value),equal=float(k*step),error=float(k*step-value),justHz=float(c4*p/q),equalHz=float(c4*(k*ln3/13).exp())))
  assert abs(k*step-value)<=D('13.066656')
 for k in range(25):
  r=F(80,81)**(k//4)*[F(1),F(5,3),F(10,9),F(40,27)][k%4]
  ideal.append(dict(k=k,p=str(r.numerator),q=str(r.denominator),offset=float(cents(r)-100*[0,9,2,7][k%4]),hz=float(c4*D(r.numerator)/D(r.denominator))))
 inputs=[['261.6256','261.6256'],['261.6256','392.4384'],['261.6256','523.2512'],['261.6256','784.8768'],['261.6256','327.032','392.4384'],['261.6256','436.0426666666667','610.4597333333334'],['247.123456789','333.987654321','481.012345678']]
 for name in ['h8','odd','all']:
  hs=[h for h in range(1,9 if name=='h8' else 12) if name!='odd' or h%2]
  for values in inputs:
   partials=[(D(f)*h,D(1)/h) for f in values for h in hs];score=D(0)
   for j,(f,a) in enumerate(partials):
    for g,b in partials[j+1:]:
     x=D('.24')*abs(g-f)/(D('.021')*min(f,g)+19);score+=a*b*((D('-3.5')*x).exp()-(D('-5.75')*x).exp())
   scores.append(dict(name=name,frequencies=[float(f) for f in values],score=float(score)))
 result=dict(method='Exact Fraction ratios and 90-digit Decimal logarithms/exponentials, original Sethares1994 product formula',bp=bp,ideal=ideal,scores=scores,step=float(step),tritave=float(13*step),prime5=float(13*D(5).ln()/ln3),prime7=float(13*D(7).ln()/ln3))
p=Path(__file__).resolve().parents[1]/'docs/verification/music-adaptive-bp-reference.json';p.write_text(json.dumps(result,indent=2)+'\n');print('PASS all14 BP source ratios/errors, exact25-root held chain and21 independent 90-digit spectral-score fixtures')
