import mpmath as m,json
from pathlib import Path
m.mp.dps=65
h=m.mpf('6.62607015e-34');c=m.mpf('299792458');k=m.mpf('1.380649e-23')
def band(b,T):
 center,width=(440,100)if b=='B' else(550,88)
 return m.quad(lambda nm:2*h*c*c/((nm*m.mpf('1e-9'))**5*m.expm1(h*c/(nm*m.mpf('1e-9')*k*T)))*m.exp(-m.mpf('.5')*((nm-center)/(m.mpf(width)/m.mpf('2.3548')))**2)*m.mpf('1e-9'),[250,400,550,700,900])
anchor=m.mpf('.65')+m.mpf('2.5')*m.log10(band('B',5772)/band('V',5772));rows=[]
for T in[2500,3000,5000,5772,10000,20000,30000]:
 B,V=band('B',T),band('V',T);rows.append(dict(T=T,B=str(B),V=str(V),colour=str(-m.mpf('2.5')*m.log10(B/V)+anchor)))
Path('docs/verification/astro-source-audit-photometry-reference.json').write_text(json.dumps(dict(precision=65,method='adaptive mpmath spectral energy quadrature over displayed250–900nm, independent from Simpson production rule',rows=rows),indent=2)+'\n')
