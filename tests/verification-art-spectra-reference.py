"""Independent80digit coefficient-antiderivative integration, no JS model imports."""
from decimal import Decimal as D,getcontext
import csv,json,sys,pathlib
getcontext().prec=80
rows={int(r[0]):list(map(D,r[1:]))for r in csv.reader(open(sys.argv[1]if len(sys.argv)>1 else'/tmp/atlas-worker-three/CIE_xyz_1931_2deg.csv'))}
L=list(range(380,781));one=[D(1)]*401

def mul(a,b):
 out=[D(0)]*(len(a)+len(b)-1)
 for i,x in enumerate(a):
  for j,y in enumerate(b):out[i+j]+=x*y
 return out

def integral(S,R=one):
 result=[D(0)]*3
 for i,l in enumerate(L[:-1]):
  p=mul([S[i],S[i+1]-S[i]],[R[i],R[i+1]-R[i]])
  for j in range(3):result[j]+=sum(x/D(k+1)for k,x in enumerate(mul(p,[rows[l][j],rows[l+1][j]-rows[l][j]])))
 return result

def solve(A,b):
 a=[r[:]+[x]for r,x in zip(A,b)]
 for j in range(3):
  p=max(range(j,3),key=lambda i:abs(a[i][j]));a[p],a[j]=a[j],a[p];q=a[j][j];a[j]=[x/q for x in a[j]]
  for k in range(3):
   if k!=j:
    q=a[k][j];a[k]=[x-q*y for x,y in zip(a[k],a[j])]
 return[r[-1]for r in a]
hats=[[max(D(0),1-abs(D(l-c))/22)for l in L]for c in[430,500,570,650]];cols=list(map(integral,hats));a=solve([[cols[j][i]for j in range(3)]for i in range(3)],[-x for x in cols[3]])+[D(1)];scale=sum(map(abs,a))*(1+D('1e-12'));a=[x/scale for x in a];h=[sum(a[k]*hats[k][j]for k in range(4))for j in range(401)]
c2=D('6.62607015e-34')*299792458/D('1.380649e-23')*10**9
planck=lambda l,T:(D(555)/l)**5*((c2/D(555*T)).exp()-1)/((c2/D(l*T)).exp()-1)
g=lambda l,c,w:(-D('.5')*(D(l-c)/w)**2).exp()
sig=lambda x:1/(1+(-x).exp())
R=[one,[D('.05')+D('.8')*sig(D(l-595)/10)for l in L],[D('.05')+D('.45')*g(l,540,35)for l in L],[D('.05')+D('.6')*g(l,450,25)for l in L],[D('.05')+D('.8')*sig(D(l-515)/12)for l in L]]
S={'sun':[planck(l,5772)for l in L],'tung':[planck(l,2856)for l in L],'led':[D('1.8')*g(l,450,22)+g(l,570,120)for l in L],'eq':one,'na':[D(0)]*401}
def interpolation(a,l):
 k=int(l)-380;t=l-int(l);return a[k]*(1-t)+a[k+1]*t
out=[]
for key in['sun','tung','led','na','eq','pair']:
 for u in([D(0),D('.3'),D('.8123456'),D(1)]if key=='pair'else[D(1)]):
  spectra=[[1+u*x for x in h],[1-u*x for x in h]]if key=='pair'else[S[key]];raw=[];whites=[]
  for sp in spectra:
   V=[]
   for r in R:
    X=integral(sp,r)
    if key=='na':
     for l,p in[(D('588.995'),D(1)),(D('589.5924'),D('.5'))]:
      c=[rows[int(l)][j]*(1-(l-int(l)))+rows[int(l)+1][j]*(l-int(l))for j in range(3)]
      X=[x+p*interpolation(r,l)*y for x,y in zip(X,c)]
    V.append(X)
   whites.append(V[0]);raw.append([[x/V[0][1]for x in X]for X in V])
  out.append(dict(key=key,strength=str(u),raw=[[[str(x)for x in X]for X in row]for row in raw],white=[[str(x)for x in X]for X in whites]))
path=pathlib.Path('docs/verification/art-spectra-reference.json');path.write_text(json.dumps(dict(source='Actual CIE CSV;80digit analytic cubic antiderivatives and independent GaussJordan nullvector',coefficients=list(map(str,a)),rows=out),indent=2)+'\n');print('Wrote',len(out),'independent complete spectral/card cases')
