import mpmath as m,json
from pathlib import Path
m.mp.dps=65
h=m.mpf('6.62607015e-34');me=m.mpf('9.1093837015e-31');k=m.mpf('1.380649e-23');ev=m.mpf('1.602176634e-19');chi=m.mpf('13.598434')
rows=[]
for T in [3000,5772,10000,40000]:
 for N in [8,10,80]:
  weights=[m.mpf(n*n)*m.exp(-chi*(1-m.mpf(1)/(n*n))*ev/(k*T)) for n in range(1,N+1)];Z=sum(weights)
  rows.append(dict(T=T,N=N,ratio=str(weights[1]),fraction=str(weights[1]/Z),Z=str(Z)))
saha=[]
for T in[4000,9500,26000]:
 # Direct classical free-electron momentum integral; electron spin2 cancels neutral spin2.
 integral=4*m.pi*(2*me*k*T)**m.mpf('1.5')*m.quad(lambda q:q*q*m.exp(-q*q),[0,1,3,m.inf])/h**3
 for P in['.05','20','2000']:
  R=integral*m.exp(-chi*ev/(k*T))*k*T/m.mpf(P);saha.append(dict(T=T,P=P,R=str(R),x=str(R/(1+R))))
Path('docs/verification/astro-source-audit-atmospheres-reference.json').write_text(json.dumps(dict(precision=65,levels=rows,saha=saha,method='explicit65digit level sums and independent free-electron phase-space quadrature'),indent=2)+'\n')
