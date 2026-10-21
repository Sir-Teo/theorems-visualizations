"""Independent cyclotomic-ring / bitset oracle for all4096 sets, plus certified sqrt3 comparisons."""
from pathlib import Path
from math import isqrt
from decimal import Decimal as D,localcontext
import json,hashlib
N=4095;scale=10**90;lo=isqrt(3*scale*scale);assert lo*lo<3*scale*scale<(lo+1)*(lo+1)
def cmp(p,q):
 a,b=p[0]-q[0],p[1]-q[1]
 if not a and not b:return 0
 low=a*scale+b*(lo if b>=0 else lo+1);high=a*scale+b*(lo+1 if b>=0 else lo)
 assert low>0 or high<0
 return 1 if low>0 else -1
def rotate(m,n):return ((m<<n)|(m>>(12-n)))&N
def invert(m):return sum(1<<((-j)%12) for j in range(12) if m>>j&1)
def canon(m):return min(rotate(x,n) for x in [m,invert(m)] for n in range(12))
# Ring Z[z]/(z^4-z^2+1). Multiplication by z replaces z^4 with z^2-1.
roots=[[1,0,0,0]]
for j in range(12):
 a,b,c,d=roots[-1];roots.append([-d,a,b+d,c])
assert roots[-1]==roots[0]
records=[];sha=hashlib.sha256();maxima=[[None]*7 for _ in range(13)];winners=[[[] for _ in range(7)] for _ in range(13)];groups={}
for mask in range(4096):
 m=mask.bit_count();IF=[(mask&rotate(mask,d)).bit_count() for d in range(12)];iv=IF[1:6]+[IF[6]//2];powers=[]
 for k in range(12):
  p=[sum(IF[d]*roots[k*d%12][j] for d in range(12)) for j in range(4)]
  assert p[2]==0 and p[1]==-2*p[3] and p[1]%2==0
  powers.append([p[0],p[1]//2])
 row=[mask,m,IF,iv,powers];records.append(row);sha.update((json.dumps(row,separators=(',',':'))+'\n').encode())
 assert [sum(p[j] for p in powers) for j in range(2)]==[12*m,0]
 key=(m,*iv);groups.setdefault(key,[]).append(mask)
 for k in range(7):
  comparison=1 if maxima[m][k] is None else cmp(powers[k],maxima[m][k])
  if comparison>0:maxima[m][k]=powers[k];winners[m][k]=[mask]
  elif comparison==0:winners[m][k].append(mask)
ME=[]
for m in range(2,11):
 floor=sum(1<<((12*j)//m) for j in range(m));expected=sorted({rotate(floor,n) for n in range(12)});k=min(m,12-m);assert winners[m][k]==expected;ME.append(dict(m=m,k=k,power=maxima[m][k],masks=expected))
canons=[canon(mask) for mask in range(4096)];mates=[None]*4096
for group in groups.values():
 for mask in group:mates[mask]=next((q for q in group if canons[q]!=canons[mask]),None)
selected=[0,1,3,7,15,39,83,137,273,585,1365,1453,1709,2741,4094,4095]
fixtures=[]
with localcontext() as ctx:
 ctx.prec=90;sqrt3=D(3).sqrt();ln2=D(2).ln()
 for mask in selected:
  pcs=[j for j in range(12) if mask>>j&1];F=[]
  for k in range(12):
   p=[sum(roots[k*j%12][t] for j in pcs) for t in range(4)]
   F.append([float(D(p[0])+D(p[1])*sqrt3/2+D(p[2])/2),float(-D(p[1])/2-D(p[2])*sqrt3/2-D(p[3]))])
  fixtures.append(dict(mask=mask,F=F,frequencies=[float(D('261.6256')*(ln2*j/12).exp()) for j in pcs]))
result=dict(method='All4096 bitset intersection autocorrelations; cyclotomic ring Z[z]/(z^4-z^2+1); exact90-digit rational sqrt3 enclosure comparisons; independent floor/transposition maximally-even inventory;90-digit complex/frequency fixtures',count=4096,transcriptSHA256=sha.hexdigest(),maxPowers=maxima,winners=winners,maximallyEven=ME,zMates=mates,fixtures=fixtures)
p=Path(__file__).resolve().parents[1]/'docs/verification/music-fourier-reference.json';p.write_text(json.dumps(result,indent=2)+'\n');print('PASS all4096 exact spectral/interval rows, all maxima/ties/MEsets/Zmates and16highprecision complex/register fixtures; transcript SHA256',sha.hexdigest())
