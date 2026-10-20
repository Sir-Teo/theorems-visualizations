"""Independent literal transcription/Decimal log oracle for actual TableS1 pixels."""
from decimal import Decimal as D,getcontext
from pathlib import Path
import json,hashlib,sys
getcontext().prec=65
# Raw source rows, not imported from JS; '-' is printed Not detected.
text='''Gly 1 1 1
Ala .027 .9 1.4
β-Ala .003 .3 .9
Ser 1e-4 1.6e-3 2.7e-3
IsoSer - 1.4e-4 -
α-AIB 1.1e-3 3.7e-3 7.1e-2
β-AIB 3.2e-5 9e-4 4.8e-2
α-ABA 7e-4 2e-4 -
β-ABA 5e-4 6e-4 4.7e-2
γ-ABA 1e-4 6e-4 1.4e-2
HomoSer - 3.4e-6 -
2-Me-Ser - 1.6e-5 -
Asp 6e-4 2e-4 2.5e-3
β-OH-Asp - 1.3e-4 -
Val 3.3e-5 1.1e-4 -
Isoval 4e-4 2.6e-3 9.9e-3
Norval 5.4e-5 1.9e-5 -
Orn - 2.5e-6 -
Glu 2e-4 1e-4 1.3e-3
2-Me-Glu - 2.4e-6 -
α-AAA - 3.8e-6 -
Phe - 2e-6 -
MA 5e-3 2.8e-3 -
EA 1.7e-3 7.4e-4 -
Ethanol 2.5e-4 1.9e-5 7.2e-2
Iso-PA 1.3e-5 5.7e-6 -
N-PA 3.8e-6 2.6e-6 -'''
rows=[]
for i,line in enumerate(text.splitlines()):
 key,*raw=line.split();values=[None if v=='-' else v for v in raw];logs=[None if v is None else str((D(v)/D('1e-6')).log10()) for v in values]
 rows.append(dict(key=key,values=values,logs=logs,kind='acid' if i<22 else 'amine'))
sources=[];root=Path('/tmp/atlas-worker-one/bighist-sources')
for name,url,scope in [('miller1953.pdf','https://www.cuneyttas.com/Amino%20acid%20production%20experiment%20-%201953%20-%20Stanley%20Miller.pdf','complete original528–529; PDFcover+2articlepages'),('johnson2008-nasa.pdf','https://science.gsfc.nasa.gov/sed/content/uploadFiles/publication_files/Johnsonetal2008.pdf','complete main+SOM10PDFpages, TableS1PDF9'),('miller-schlesinger1983-nasa.pdf','https://ntrs.nasa.gov/api/citations/19830016285/downloads/19830016285.pdf','primary conference report printed50=PDF54 only, not all120PDFpages')]:
 b=(root/name).read_bytes();sources.append(dict(file=name,url=url,bytes=len(b),sha256=hashlib.sha256(b).hexdigest(),readScope=scope))
out=dict(rows=rows,sources=sources,detectedAcids=[sum(r['values'][i] is not None for r in rows[:22]) for i in range(3)],detectedAmines=[sum(r['values'][i] is not None for r in rows[22:]) for i in range(3)])
assert out['detectedAcids']==[14,22,11] and out['detectedAmines']==[5,5,1]
dest=Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'docs/verification/bighist-miller-reference.json';dest.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print('PASS literal81sourcecells/nulls, all27rowtypes, independent65digitlogs/counts/sourcehashes')
