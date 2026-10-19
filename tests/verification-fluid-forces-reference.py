"""Independent high-precision surface-pressure integral; no production imports."""
import json
from pathlib import Path
import mpmath as m
m.mp.dps=65
rows=[]
shapes=[dict(c='0',R='1',x='0',y='0'),dict(c='.85',R='1',x='0',y='0'),dict(c='1',round='.4',x='-.12',y='.12'),dict(c='1',round='.12',x='-.1',y='.38')]
for i,s in enumerate(shapes):
 for U,G,degrees in [('0.5','0','-20'),('2','4','20'),('1','2.4','6')]:
  c=m.mpf(s['c']);z0=m.mpc(s['x'],s['y']);R=m.mpf(s['R']) if 'R'in s else max(abs(z0-c),abs(z0+c))*(1+m.mpf(s['round']));u=m.mpf(U);g=m.mpf(G);a=m.mpf(degrees)*m.pi/180
  def integrand(t):
   b=R*m.exp(1j*t);z=z0+b;d=1-c*c/z**2;dtheta=d*1j*b;q=(u*(m.exp(-1j*a)-R**2*m.exp(1j*a)/b**2)+1j*g/(2*m.pi*b))/d;p=(u*u-abs(q)**2)/2
   return -p*dtheta.imag+1j*p*dtheta.real
  F=m.quad(integrand,[j*m.pi/8 for j in range(17)])
  rows.append(dict(shape=i,U=U,G=G,degrees=degrees,Fx=m.nstr(F.real,55),Fy=m.nstr(F.imag,55)))
Path('docs/verification/fluid-forces-reference.json').write_text(json.dumps(dict(precision=65,method='independent adaptive surface-pressure quadrature using complex analytic parametrization',rows=rows),indent=2)+'\n')
