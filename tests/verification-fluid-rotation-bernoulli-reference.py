"""Independent80-digit quadrature of the unequal-arm first-integral period."""
import json
from pathlib import Path
import mpmath as m
m.mp.dps=80
rows=[]
for L in ['0.8','1.6','3.2']:
 for a in ['0.4','1','2.5']:
  for f in ['0','0.5','0.9']:
   ll,aa,ff=map(m.mpf,[L,a,f]);he=(ll-m.mpf('.5'))/2;A=ff*he*min(1,aa);I=he+m.mpf('.5')+he/aa;c=1-1/aa**2;k=m.mpf('9.81')*(1+1/aa)
   # x=A*cos(theta),0..2pi traverses the full orbit. Exact energy gives dt.
   T=m.quad(lambda t:m.sqrt(I+c*A*m.cos(t))/m.sqrt(k),[0,m.pi,2*m.pi])
   rows.append(dict(L=L,a=a,f=f,period=m.nstr(T,65)))
Path('docs/verification/fluid-rotation-bernoulli-reference.json').write_text(json.dumps({'precision':80,'method':'independent energy integral over full cosine orbit','rows':rows},indent=2)+'\n')
