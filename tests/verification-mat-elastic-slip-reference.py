"""65digit Fourier-series force maximum, independently differentiated and solved."""
import mpmath as m,json
from pathlib import Path
m.mp.dps=65;out=[];nu=m.mpf('.3')
for rs in ['.5','.82','1.4']:
 r=m.mpf(rs);z=r/(2*(1-nu));q=m.exp(-2*m.pi*z)
 def force(y):return sum(n*q**n*m.sin(2*m.pi*n*y)for n in range(1,100))/(1-nu)
 y=m.findroot(lambda y:m.diff(force,y),(.15,.25));out.append(dict(r=rs,y=str(y),stress=str(force(y))))
Path(__file__).resolve().parents[1].joinpath('docs/verification/mat-elastic-slip-reference.json').write_text(json.dumps(dict(precision=65,FourierTerms=99,PN=out),indent=2)+'\n')
