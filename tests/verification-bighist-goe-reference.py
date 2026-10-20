"""Independent100digit monotone bisection and rational source chronology."""
from decimal import Decimal as D,getcontext
from fractions import Fraction as F
from pathlib import Path
import json,hashlib,sys
getcontext().prec=100
cases=[]
for S in map(D,('.2','.4','.98','.99','1','1.01','1.4','2.5')):
 for k in map(D,('.3','1','3')):
  lo=D(0);hi=S/k
  for _ in range(400):
   x=(lo+hi)/2
   if x/(x+D('0.00001'))+k*x<S:lo=x
   else:hi=x
  cases.append(dict(S=str(S),k=str(k),x=str((lo+hi)/2)))
root=Path('/tmp/atlas-worker-one/bighist-sources');sources=[]
for name,url,scope in [('farquhar2000.pdf','https://www.eoas.ubc.ca/~mjelline/212_website/212_live/resources/Required-Reading/Farquar_2000_Atmospheric-Influence-of-Earth%E2%80%99s-Earliest-Sulfur-Cycle.pdf','complete3pageoriginal756–758/Figs1–3; wrapperpage4notarticle'),('bekker2004.html','https://www.nature.com/articles/nature02260','actualpublisherauthorabstractonly; subscriptionbodyunavailable'),('philippot2018.html','https://pmc.ncbi.nlm.nih.gov/articles/PMC5993798/','actualmainresults/Figs1–2/regionalmemorydiscussionandMethods; noSI/rawisotope/isochronreanalysis'),('lyons2014.pdf','https://www.eoas.ubc.ca/~mjelline/212_website/resources/Required-Reading/Lyons_2014_The-rise-of-oxygen-in-Earth%E2%80%99s-early-ocean-and-atmosphere.pdf','actualreview307–310/proxy/source-sink/Fig1; notallunderlyingoriginals')]:
 b=(root/name).read_bytes();sources.append(dict(file=name,url=url,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),readScope=scope))
chronology=dict(farquhar=dict(older=2450,younger=2090,widthMyr=360,x=[str(-F(2450,1000)),str(-F(2090,1000))]),bekker=dict(age=2320,x=str(-F(2320,1000))),philippot=dict(older=2450,youngerLimit=2310,x=[str(-F(2450,1000)),str(-F(2310,1000))],termination=None),diamictite=dict(age='2312.7',uncertainty='5.6',unit='Myr'))
p=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'docs/verification/bighist-goe-reference.json';p.write_text(json.dumps(dict(digits=100,cases=cases,chronology=chronology,sources=sources),ensure_ascii=False,indent=2)+'\n');print('PASS24independent100digit400-stepbisections/sourcechronologyrationalunits/4actualsourcehashes')
