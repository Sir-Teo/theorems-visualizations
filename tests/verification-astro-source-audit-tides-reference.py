import mpmath as m,json
from pathlib import Path
m.mp.dps=65
G=m.mpf('6.6743e-11');k=m.mpf('1.380649e-23');Y=m.mpf('31557600');amu=m.mpf('1.66053907e-27')
rows=[]
for name,M,R in [('earth','5.9722e24','6878137'),('moon','.07346e24','1737400')]:
 for T in [100,1000,3000]:
  for u in ['1.008','4.0026','28.014','44.009']:
   mass=m.mpf(M);r=m.mpf(R);pm=m.mpf(u)*amu;v0=m.sqrt(2*k*T/pm);lam=2*G*mass/r/v0**2
   # Direct outward angular integral gives pi; substitute v^2/v0^2=lambda+z only to avoid underflow.
   integral=m.quad(lambda z:(lam+z)*m.exp(-z),[0,1,4,16,m.inf]);angular=m.quad(lambda c:c,[0,1])*2*m.pi
   logflux=m.log(angular*v0/(2*m.pi**m.mpf('1.5'))*integral)-lam
   logyears=(m.log(r/lam)-logflux-m.log(Y))/m.log(10)
   rows.append(dict(body=name,mass=M,radius=R,T=T,u=u,logFlux=str(logflux),logYears=str(logyears)))
Path('docs/verification/astro-source-audit-tides-reference.json').write_text(json.dumps(dict(precision=65,method='outward angular quadrature and scaled speed-square quadrature, not the closed-form Jeans helper',rows=rows),indent=2)+'\n')
