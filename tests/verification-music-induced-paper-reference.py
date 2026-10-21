"""Independent90-digit original1993 product model, exact exponent lists and source ratios."""
from pathlib import Path
from decimal import Decimal as D,localcontext
import json
with localcontext() as ctx:
 ctx.prec=90;c4=D('261.6256');ln2=D(2).ln();ten=[0,10,17,20,25,28,30];beam=['1','2.758','5.406','8.936','13.35','18.645','24.82']
 def score(fs,s):
  p=sorted((f*h,a) for f in fs for h,a in s);v=D(0)
  for j,(f,a) in enumerate(p):
   for g,b in p[j+1:]:
    x=D('.24')*(g-f)/(D('.021')*f+19);v+=a*b*((-D('3.5')*x).exp()-(-D('5.75')*x).exp())
  return v
 rows=[]
 for n in [8,10,11,12]:
  for moved in range(7):
   exponents=[int((D(j).ln()/ln2*n+D('.5')).to_integral_value(rounding='ROUND_FLOOR')) for j in range(1,8)]
   s=[((ln2*exponents[j-1]/n).exp() if j-1<=moved else D(j),D('.88')**(j-1)) for j in range(1,8)]
   means=[score([c4,c4*(ln2*k/n).exp()],s) for k in range(1,n)]
   rows.append(dict(n=n,moved=moved,mode='snap',s=[[float(h),float(a)] for h,a in s],mean=float(sum(means)/(n-1))))
 s=[((ln2*k/10).exp(),D('.88')**j) for j,k in enumerate(ten)]
 rows.append(dict(n=10,moved=6,mode='source',s=[[float(h),float(a)] for h,a in s],mean=float(sum(score([c4,c4*(ln2*k/10).exp()],s) for k in range(1,10))/9)))
 paper=[]
 for name,r in [('two','1.01'),('two','1.15'),('two','1.86'),('two','2.123456789'),('two','2.2'),('beam','1.86'),('stretched','1.86'),('ten','1.86')]:
  if name=='two':s=[(D(1),D(1)),(D(r),D(1))];f0=D(500);cmax=1300
  elif name=='beam':s=[(D(h),D('.88')**j) for j,h in enumerate(beam)];f0=c4/2;cmax=2450
  elif name=='stretched':s=[((D('2.1').ln()*D(j).ln()/ln2).exp(),D('.88')**(j-1)) for j in range(1,8)];f0=c4;cmax=1350
  else:s=[((ln2*k/10).exp(),D('.88')**j) for j,k in enumerate(ten)];f0=c4;cmax=1250
  values=[]
  for q in ['0','.2718281828','.5','1']:
   c=D(q)*cmax;f1=f0*(ln2*c/1200).exp();values.append(dict(fraction=float(q),cents=float(c),frequencies=[float(f0),float(f1)],score=float(score([f0,f1],s))))
  paper.append(dict(name=name,ratio=float(r),s=[[float(h),float(a)] for h,a in s],f0=float(f0),cmax=cmax,values=values))
 result=dict(method='90-digit Decimal original1993 coefficients/product; sorted unordered pairs; independent nearest exponent rounding; exact source lists',ten=ten,beam=beam,induced=rows,paper=paper)
p=Path(__file__).resolve().parents[1]/'docs/verification/music-induced-paper-reference.json';p.write_text(json.dumps(result,indent=2)+'\n');print('PASS29induced rows and32paper dyads, independently computed90-digit source-model fixtures')
