from decimal import Decimal as D,getcontext
import csv,json,sys
from pathlib import Path
getcontext().prec=80
root=Path('/tmp/atlas-worker-three');source=Path(sys.argv[1]) if len(sys.argv)>1 else root/'CIE_xyz_1931_2deg.csv'
rows={D(r[0]):[D(x)for x in r[1:]]for r in csv.reader(source.read_text().splitlines())}
M=[[D(x)for x in r.split()]for r in['.49 .31 .2','.17697 .8124 .01063','0 .01 .99']]
def cmf(l):
 l=D(str(l));a=l//1;b=l-a
 return [x*(1-b)+y*b for x,y in zip(rows[a],rows[min(D(830),a+1)])]
def solve(A,v):
 a=[r[:]+[x]for r,x in zip(A,v)]
 for j in range(3):
  k=max(range(j,3),key=lambda k:abs(a[k][j]));a[j],a[k]=a[k],a[j];q=a[j][j];a[j]=[x/q for x in a[j]]
  for k in range(3):
   if k!=j:
    q=a[k][j];a[k]=[x-q*y for x,y in zip(a[k],a[j])]
 return[r[-1]for r in a]
def prim(w):
 c=[cmf(l)for l in w];return[[x[r]/x[1]for x in c]for r in range(3)]
sets={'cie':M,'spread':prim([610,540,465]),'tight':prim([590,550,510])};out=[]
for key,P in sets.items():
 for l in[380,400,435,490,555,610,700,780]:out.append({'kind':'matching','key':key,'l':l,'amounts':[str(x)for x in solve(P,cmf(l))]})
for t in['0','.001','.1','.5','.8123456','.999999','1']:
 T=D(t);P=[[(1-T)*x+(T if i==j else 0)for j,x in enumerate(r)]for i,r in enumerate(M)]
 for l in[360,435,555,700,830]:out.append({'kind':'basis','t':float(T),'l':l,'amounts':[str(x)for x in solve(P,cmf(l))]})
path=Path('docs/verification/art-colorimetry-reference.json');path.write_text(json.dumps({'source':'CIE471 rows; independent80digit Decimal Gauss–Jordan, no production imports','rows':out},indent=2)+'\n');print('Wrote',len(out),'independentreference cases')
