"""Independent exact-Fraction calculation for the explicitly authored score exercise."""
from fractions import Fraction as F
from itertools import product
from pathlib import Path
import json, hashlib, sys, random
ratings=((2,3,1,1,2),(2,0,1,2,1),(1,0,3,2,1),(3,1,1,2,2))
cases=list(product((0,30),repeat=5))
for i in range(5):
 for t in range(31):
  c=[10]*5;c[i]=t;cases.append(tuple(c))
rng=random.Random(3182026)
for _ in range(500):cases.append(tuple(rng.randrange(31) for _ in range(5)))
cases=list(dict.fromkeys(cases));out=[]
for ticks in cases:
 den=sum(ticks);nums=[sum(a*b for a,b in zip(r,ticks)) for r in ratings]
 means=[None if den==0 else str(F(n,den)) for n in nums]
 leaders=[] if not den else [i for i,n in enumerate(nums) if n==max(nums)]
 out.append(dict(ticks=ticks,denominator=den,numerators=nums,means=means,leaders=leaders))
assert [r['leaders'] for r in out if r['ticks']==(10,10,10,10,10)]==[[0,3]]
assert [r['leaders'] for r in out if r['ticks']==(0,0,0,0,0)]==[[]]
# Weak dominance follows coefficientwise, including every canonical weight tuple.
difference=[a-b for a,b in zip(ratings[3],ratings[1])];assert difference==[1,1,0,0,1]
root=Path('/tmp/atlas-worker-one/bighist-sources');sources=[]
for name,url,scope in [('wachtershauser1988.pdf','https://complexityexplorer.s3.amazonaws.com/supplemental_materials/1.2%20Life/microrev00047-0066.pdf','central thesis printed452–453 only; complete33pagePDF cached'),('patel2015.html','https://pmc.ncbi.nlm.nih.gov/articles/PMC4568310/','actual main-author manuscript Results/scenario/Conclusions; SI not independently audited'),('horning2016.html','https://pmc.ncbi.nlm.nih.gov/articles/PMC5024611/','amplification/Fig4/Discussion/materials and methods; not all SI tables'),('russell2019-pmc.html','https://pmc.ncbi.nlm.nih.gov/articles/PMC6802131/','complete actual author-account body and both figure captions; underlying studies not reread'),('russell1997-europepmc.json','https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A11541234+AND+SRC%3AMED&format=json&resultType=core','actual original author abstract only; complete original body not obtained'),('kelley2001-europepmc.json','https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID%3A11449263+AND+SRC%3AMED&format=json&resultType=core','actual original author abstract only; complete original body not obtained')]:
 b=(root/name).read_bytes();sources.append(dict(file=name,url=url,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),readScope=scope))
dest=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'docs/verification/bighist-origins-reference.json';dest.write_text(json.dumps(dict(ratings=ratings,cases=out,weakDominanceDifference=difference,sources=sources),ensure_ascii=False,indent=2)+'\n');print(f'PASS {len(cases)} independent exact rational fixtures, 5×31weight sweeps/32corners/500seeded inputs; symbolic dominance and zero/ties; sourcehashes')
