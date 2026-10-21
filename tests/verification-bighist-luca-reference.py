"""Literal source intervals + independent exact rational unit/geometry reference."""
from pathlib import Path
from fractions import Fraction as F
import json,hashlib,sys
ages=[3300,4089,4090,4179,4180,4200,4320,4330,4331,4500]
cases=[]
for key,lo,hi,body_hi in [('iln',4090,4330,4320),('gbm',4180,4330,4330)]:
 for a in ages:
  cases.append(dict(clock=key,ageMyr=a,lo=lo,hi=hi,bodyHi=body_hi,widthMyr=hi-lo,ageGa=str(F(a,1000)),trialX=str(-F(a,1000)),bandX=[str(-F(hi,1000)),str(-F(lo,1000))],relation='younger' if a<lo else 'older' if a>hi else 'inside',distanceMyr=max(lo-a,a-hi,0)))
r=Path('/tmp/atlas-worker-one/bighist-sources');sources=[]
for n,u,scope in [('woese1977.pdf','https://courses.physics.illinois.edu/phys498ebp/sp2020/readings/phylogenetics/WoseAndFox_PNAS_1977.pdf','complete3page original5088–5090; all body and Table1'),('woese1990-epa.pdf','https://chemview.epa.gov/chemview/proxy?filename=ncn%2F20211130%2FJ-21-0020%2F2%2F09022526804d01f5_Woese+C+R+et+al+1990.pdf','complete4page original4576–4579 incl Fig1 and domain proposal'),('moody2024-pmc.html','https://pmc.ncbi.nlm.nih.gov/articles/PMC11383801/','dating results/Fig1/caption; calibration, timetree and cross-bracing methods; no SI calibration dossier/raw alignments/pipeline audit'),('ncbi-genetic-codes.html','https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi','official overview and standard/variant code tables only, not all taxonomy assignments')]:
 b=(r/n).read_bytes();sources.append(dict(file=n,url=u,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),readScope=scope))
dest=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'docs/verification/bighist-luca-reference.json';dest.write_text(json.dumps(dict(cases=cases,calibrationBasis=[[4510,10],[2954,9]],sources=sources),ensure_ascii=False,indent=2)+'\n');print('PASS20independent exactFraction boundary/unit/position fixtures; literal Fig1/body mismatch preserved;4sourcehashes')
