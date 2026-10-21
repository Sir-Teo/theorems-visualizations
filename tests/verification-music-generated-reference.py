"""Independent exact generic spans and rational/90-digit nearest-neighbour gap oracle."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal as D,localcontext,ROUND_FLOOR
from hashlib import sha256
import json,random,math

def spans(S,c):
 n=len(S); out=[]
 # Accumulate adjacent scale steps, independently of the direct endpoint formula.
 steps=[(S[(i+1)%n]-S[i])%c for i in range(n)]
 for k in range(1,n):
  vals=[sum(steps[(i+j)%n] for j in range(k)) for i in range(n)]
  sizes=sorted(set(vals));out.append([k,vals,sizes,[vals.count(x) for x in sizes]])
 return out
sha=sha256();count=0;myhill_counts=[0]*13;even_counts=[0]*13
for mask in range(4096):
 S=[j for j in range(12) if mask>>j&1]
 if len(S)<2:continue
 rows=spans(S,12);n=len(S);myhill=all(len(r[2])==2 for r in rows);even=all(max(r[1])-min(r[1])<=1 for r in rows)
 myhill_counts[n]+=myhill;even_counts[n]+=even
 sha.update((json.dumps([mask,rows,myhill,even],separators=(',',':'))+'\n').encode());count+=1
# Verify the floor theorem including exact multiplicities over1,711 finite circles.
floor_cases=[]
for c in range(3,61):
 for n in range(2,c):
  S=[c*j//n for j in range(n)];rows=spans(S,c)
  for k,vals,sizes,counts in rows:
   lo=c*k//n;r=c*k%n;expect=[lo] if not r else[lo,lo+1]
   assert sizes==expect and counts==([n] if not r else[n-r,r])
  assert all(len(r[2])==2 for r in rows)==(math.gcd(c,n)==1)
  floor_cases.append([c,n])

def rotation(alpha,n,rational=False):
 raw=[(alpha*j)%1 for j in range(n)];P=sorted(set(raw));rank=[P.index(x) for x in raw];m=len(P)
 # Positive nearest-forward distances, not differences of consecutive sorted positions.
 gaps=[min((((y-x)%1+1)%1 or type(alpha)(1)) for y in P) for x in P]
 if rational:U=sorted(set(gaps))
 else:
  U=[]
  for g in sorted(gaps):
   if not U or g-U[-1]>D('1e-75'):U.append(g)
 counts=[sum(abs(g-u)<(F(1,10**75) if rational else D('1e-75')) for g in gaps) for u in U]
 assert len(U)<=3
 if len(U)==3:assert abs(U[2]-U[1]-U[0])<(F(1,10**75) if rational else D('1e-75'))
 step=rank[1] if n>1 else 0;order=m==n and all(rank[j]==j*step%n for j in range(n));well=order and len(U)>1 and n>1
 return dict(n=n,m=m,P=[float(x) for x in P],sizes=[float(x) for x in U],counts=counts,rank=rank,step=step,orderPreserved=order,wellFormed=well)
fixtures=[]
with localcontext() as ctx:
 ctx.prec=90;ln2=D(2).ln();generators=dict(fifth=(D(3)/2).ln()/ln2,gold=(3-D(5).sqrt())/2,third=(D(5)/4).ln()/ln2,fourth=(D(4)/3).ln()/ln2)
 for name,a in generators.items():
  for n in range(1,61):fixtures.append(dict(type=name,cents=701.955,**rotation(a,n)))
 assert [f['n'] for f in fixtures if f['type']=='fifth' and f['wellFormed']]==[2,3,5,7,12,17,29,41,53]
 for n in range(1,61):fixtures.append(dict(type='tet',cents=701.955,**rotation(F(7,12),n,True)))
rng=random.Random(712833)
for ticks in [0,1,25000,300000,400000,600000,700000,701955,1199999,1200000]+[rng.randrange(1200001) for _ in range(25)]:
 for n in [1,2,7,12,13,30,60]:fixtures.append(dict(type='custom',cents=ticks/1000,**rotation(F(ticks,1200000),n,True)))
# Rational stress family; exact residues and duplicate periods from reduced fractions.
rational=[]
for den in range(1,41):
 for num in range(den+1):
  if 1200000*num%den:continue
  for n in [1,2,7,12,60]:rational.append(dict(type='custom',cents=1200*num/den,**rotation(F(num,den),n,True)))
result=dict(method='Accumulated cyclic adjacent steps for every finite subset; exact Fraction nearest-forward distance gaps and90-digit Decimal irrational formula orbits; independent rank automorphism',setCount=count,transcriptSHA256=sha.hexdigest(),myhillCounts=myhill_counts,evenCounts=even_counts,floorCount=len(floor_cases),fixtures=fixtures,rational=rational)
p=Path(__file__).resolve().parents[1]/'docs/verification/music-generated-reference.json';header={k:v for k,v in result.items() if k not in ['fixtures','rational']};body=json.dumps(header,indent=2)[:-2]+',\n';body+='\n'.join('  '+json.dumps(key)+': [\n'+',\n'.join('    '+json.dumps(row,separators=(",",":")) for row in result[key])+'\n  ]'+(',' if key=='fixtures' else '') for key in ['fixtures','rational'])+'\n}\n';p.write_text(body);print('PASS',count,'all-subset span records;',len(floor_cases),'floor/coprimality/multiplicity cases;',len(fixtures),'irrational+slider fixtures;',len(rational),'exact rational family fixtures; SHA256',sha.hexdigest())
