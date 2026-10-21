"""Independent65digit derivative roots and published base-ten power laws."""
import json,mpmath as m
from pathlib import Path
m.mp.dps=65
k=m.mpf('1.380649e-23')/m.mpf('1.602176634e-19');chi=m.mpf('13.598434');me=m.mpf('9.1093837015e-31');h=m.mpf('6.62607015e-34');kb=m.mpf('1.380649e-23')
def terms(T,P):
 w=[m.mpf(n*n)*m.exp(-chi*(1-m.mpf(1)/(n*n))/(k*T)) for n in range(1,11)]
 R=(2*m.pi*me*kb*T/h**2)**m.mpf('1.5')*kb*T/P*m.exp(-chi/(k*T))
 E=[chi*(1-m.mpf(1)/(n*n)) for n in range(1,11)]
 deriv=E[1]*(sum(w)+R)-sum(v*e for v,e in zip(w,E))-R*(chi+m.mpf('2.5')*k*T)
 return deriv,w[1]/(sum(w)+R)
peaks=[]
for p,guess in [('.5',8200),('20',9850),('2000',13000)]:
 P=m.mpf(p);T=m.findroot(lambda t:terms(t,P)[0],(guess-500,guess+500));peaks.append(dict(P=p,T=str(T),fraction=str(terms(T,P)[1])))
fits=[]
for lo,hi,a,b in [('.179','.45','2.028','-.976'),('.45','.72','4.572','-.102'),('.72','1.05','5.743','-.007'),('1.05','2.4','4.329','.010'),('2.4','7','3.967','.093'),('7','31','2.865','1.105')]:
 M=m.sqrt(m.mpf(lo)*m.mpf(hi));fits.append(dict(M=str(M),L=str(m.power(10,m.mpf(a)*m.log10(M)+m.mpf(b)))))
p=Path(__file__).resolve().parents[1]/'docs/verification/astro-source-audit-stellar-models-reference.json';p.write_text(json.dumps(dict(precision=65,peaks=peaks,fits=fits),indent=2)+'\n')
