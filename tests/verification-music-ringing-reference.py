"""Independent bell-to-place trajectories; whole-lead closure without cycle decomposition."""
from pathlib import Path
from itertools import product
from collections import Counter
from math import factorial
import random,json,hashlib

def legal(n):
 out=[]
 for mask in range(1,1<<(n-1)):
  if mask&(mask<<1):continue
  edges=[j for j in range(n-1) if mask>>j&1];used={p for j in edges for p in [j,j+1]};token=''.join(str(j+1) for j in range(n) if j not in used) or 'x';out.append((token,edges))
 return out

def oracle(n,method):
 initial=tuple(range(n));positions=initial;rows=[list(range(1,n+1))];i=0;visited=set()
 while True:
  assert (positions,i%len(method)) not in visited;visited.add((positions,i%len(method)))
  edges=method[i%len(method)][1];positions=tuple(next((b+1 if x==b else b if x==b+1 else x for b in edges if x in [b,b+1]),x) for x in positions)
  row=[0]*n
  for bell,pos in enumerate(positions):row[pos]=bell+1
  rows.append(row);i+=1
  if i%len(method)==0 and positions==initial:break
 assert i<=720
 counts=Counter(tuple(r) for r in rows[:-1]);fixed=[j for j in range(n) if all(r[j]==j+1 for r in rows)];eff=n-len(fixed);E=factorial(eff)
 # Remove complete layers explicitly, unlike the production min/max formula.
 layer=0
 while len(counts)==E and min(counts.values())>0:
  counts=Counter({r:k-1 for r,k in counts.items() if k>1});layer+=1
 true=all(k==1 for k in counts.values());original=Counter(tuple(r) for r in rows[:-1]);minimum=min(original.values()) if len(original)==E else 0;maximum=max(original.values())
 return dict(n=n,pn='.'.join(t for t,_ in method),order=i//len(method),length=i,distinct=len(original),effective=eff,minimum=minimum,maximum=maximum,trueTouch=true,complete=not counts,fullExtent=i==factorial(n) and len(original)==i,rowsSHA256=hashlib.sha256(json.dumps(rows,separators=(',',':')).encode()).hexdigest()),rows
records=[]
for n in [4,5,6]:
 choices=legal(n)
 for length in [1,2,3]:
  for m in product(choices,repeat=length):records.append(oracle(n,m)[0])
rng=random.Random(821434)
for n in [4,5,6]:
 choices=legal(n)
 for _ in range(10):records.append(oracle(n,[rng.choice(choices) for _ in range(120)])[0])
pn=['x','14','x','14','x','14','x','12'];d=dict(legal(4));bob,rows=oracle(4,[(p,d[p]) for p in pn]);assert rows==[[int(x) for x in r] for r in ['1234','2143','2413','4231','4321','3412','3142','1324','1342','3124','3214','2341','2431','4213','4123','1432','1423','4132','4312','3421','3241','2314','2134','1243','1234']]
for n,pn in [(4,['x','14']),(5,['5','1']),(6,['x','16'])]:
 d=dict(legal(n));r,_=oracle(n,[(p,d[p]) for p in pn]);assert r['length']==2*n and r['trueTouch'];records.append(r)
records.append(bob)
for text in [['14','14','x'],['14','14']]:records.append(oracle(4,[(p,dic) for p in text for token,dic in legal(4) if token==p])[0])
result=dict(method='All nonempty path-matchings; independent bell-to-place trajectories with whole-lead phase closure; explicit removal of complete effective-extent layers for truth',count=len(records),legal={str(n):[p for p,_ in legal(n)] for n in [4,5,6]},plainBobRows=rows,records=records)
p=Path(__file__).resolve().parents[1]/'docs/verification/music-ringing-reference.json';p.write_text(json.dumps({k:v for k,v in result.items() if k!='records'},indent=2)[:-2]+',\n  "records": [\n'+',\n'.join('    '+json.dumps(r,separators=(',',':')) for r in records)+'\n  ]\n}\n');print('PASS',len(records),'independent complete-course/truth trajectories; exact25row Benson Plain Bob table; all length1..3 legal methods plus30 maximum120-change methods')
