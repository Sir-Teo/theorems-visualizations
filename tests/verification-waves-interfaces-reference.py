"""Reproduce independent 70-digit pulse references and source hashes.
Requires mpmath; run from repo root with the downloaded source PDFs at the
/tmp paths named below. This script writes only the dedicated evidence JSON.
Download URLs and precise source anchors are included in that JSON.
"""
from pathlib import Path
import json,hashlib,urllib.request
import mpmath as m
m.mp.dps=70
D=m.mpf
cases=[]
for n1,n2,L,cone,sigma,x in [('1.48','1.46','1','20','1','0'),('1.48','1.46','1','40','0.1','20'),('1.7','1.3','20','40','0.08493218002880191','500'),('1.48','1.46','0','40','1','0'),('1.48','1.46','20','40','0.08493218002880191','1')]:
 n1,n2,L,cone,sigma,x=map(D,[n1,n2,L,cone,sigma,x]);ang=cone*m.pi/180;accept=m.asin(min(1,m.sqrt(n1*n1-n2*n2)));limit=min(ang,accept);t0=L*1000*n1/D(299792458)*10**9
 if not t0:y=m.exp(-x*x/(2*sigma*sigma))*limit/ang
 else:
  # Independent delay-density integral: transform d=u^2 to remove the axial inverse-square-root singularity.
  dmax=t0*(1/m.sqrt(1-(m.sin(limit)/n1)**2)-1);umax=m.sqrt(dmax)
  def density(u):
   s2=n1*n1*u*u*(2*t0+u*u)/(t0+u*u)**2
   return 2*n1*t0*t0/((t0+u*u)**2*m.sqrt(2*t0+u*u)*m.sqrt(1-s2))
  fun=lambda u:m.exp(-((x-u*u)/sigma)**2/2)*density(u)/ang
  lo=m.sqrt(max(0,x-14*sigma));hi=m.sqrt(max(0,min(dmax,x+14*sigma)))
  y=m.quad(fun,[lo,(lo+hi)/2,hi])if hi>lo else 0
 cases.append(dict(n1=str(n1),n2=str(n2),L=str(L),cone=str(cone),sigma=str(sigma),x=str(x),pulse=str(y)))
sources=[]
for name,url,anchors in [
 ('steck-author','https://atomoptics.uoregon.edu/~dsteck/teaching/optics/optics-notes.pdf','Revision1.8.6,1May2026;physicalPDF=printedpage;full§5.3pp85–86,§§9.1–9.3pp153–161,full§10.2pp176–180'),
 ('tatum','https://www.astro.uvic.ca/~tatum/goptics/geomop1.pdf','physicalPDF=printedpage;full§1.6pp19–22 and§1.7pp22–31, equations1.6.1–5 and1.7.1–10'),
 ('kimerling','https://ocw.mit.edu/courses/3-46-photonic-materials-and-devices-spring-2006/2229d0701ea240ed993e2a499432519b_3_46l5_waveguide.pdf','full5-pagelecturedownloaded;guidance/NA derivationpp1–2,coreusesn2inthissource(oppositetotheatlas)'),
 ('almeida','https://www.lehigh.edu/imi/teched/OPG/lecture25.pdf','full16-pagelecturedownloaded;readmodal/material/waveguidedispersionpp10–15;first-orderdelayonlyatp10,exactmeridionalboundderivedindependently')]:
 p=Path('/tmp/atlas-waves-'+name+'.pdf');sources.append(dict(name=name,url=url,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),anchors=anchors))
for node in [58,59,60]:
 url=f'https://farside.ph.utexas.edu/teaching/315/Waveshtml/node{node}.html';b=urllib.request.urlopen(url).read();Path(f'/tmp/atlas-waves-fitzpatrick{node}.html').write_bytes(b);sources.append(dict(name=f'Fitzpatrick{node}',url=url,sha256=hashlib.sha256(b).hexdigest(),anchors={58:'full§7.8,equations7.40–49',59:'full§7.9,equations7.50–101',60:'full§7.10,equations7.102–135,Figures7.9–12'}[node]))
Path('docs/verification/waves-interfaces-data.json').write_text(json.dumps(dict(precisionDigits=70,method='mpmath delay-density integral after d=u^2,14sigma Gaussian tail cutoff; distinct from UI angle-Simpson quadrature',pulse=cases,sources=sources),indent=2)+'\n')
