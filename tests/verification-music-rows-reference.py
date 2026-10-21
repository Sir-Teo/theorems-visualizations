"""Independent direct affine/reversal action on ordered rows; no matrix traversal used."""
from pathlib import Path
import random,json,hashlib
rng=random.Random(816431);base=[[7,10,2,6,9,0,4,8,11,1,3,5],list(range(12)),[0,11,1,10,2,9,3,8,4,7,5,6],[0,7,2,9,4,11,6,1,8,3,10,5]]
for _ in range(500):
 p=list(range(12));rng.shuffle(p);base.append(p)
# Deliberately symmetric rows with a T6R stabilizer.
for _ in range(50):
 p=list(range(6));rng.shuffle(p);p=[x+6*rng.randrange(2) for x in p];base.append(p+[((x+6)%12) for x in p[::-1]])
rows=[];sha=hashlib.sha256()
for p in base:
 orbit={tuple(((s*x+n)%12) for x in (p[::-1] if r else p)) for n in range(12) for s in [1,-1] for r in [False,True]}
 stable=sum(all((s*x+n)%12==y for x,y in zip(p[::-1] if r else p,p)) for n in range(12) for s in [1,-1] for r in [False,True])
 assert len(orbit)*stable==48 and len(orbit) in [24,48]
 # Forms indexed by FIRST NOTE of their associated unreversed row, independent of matrix indexing.
 forms={}
 for t in ['P','R','I','RI']:
  forms[t]=[]
  for first in range(12):
   f=[((x-p[0] if t in ['P','R'] else p[0]-x)+first)%12 for x in p]
   if t in ['R','RI']:f.reverse()
   forms[t].append(f)
 record=dict(p=p,forms=forms,distinct=len(orbit),stabilizer=stable,successive=[(b-a)%12 for a,b in zip(p,p[1:])]);rows.append(record);sha.update((json.dumps(record,separators=(',',':'))+'\n').encode())
result=dict(method='Direct affine operations x↦±x+n with independent order reversal; forms keyed by first pitch of unreversed partner',count=len(rows),transcriptSHA256=sha.hexdigest(),rows=rows)
p=Path(__file__).resolve().parents[1]/'docs/verification/music-rows-reference.json';p.write_text(json.dumps({k:v for k,v in result.items() if k!='rows'},indent=2)[:-2]+',\n  "rows": [\n'+',\n'.join('    '+json.dumps(r,separators=(',',':')) for r in rows)+'\n  ]\n}\n');print('PASS',len(rows),'direct group-action fixtures, including50 engineered T6R-symmetric rows; SHA256',sha.hexdigest())
