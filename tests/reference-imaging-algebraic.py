"""Independent rectangle-slab rays, dense linear algebra and SVD references."""
import numpy as np,json
from scipy.linalg import svdvals,lstsq
from pathlib import Path

def system(n,na,nd,half):
 A=np.zeros((na*nd,n*n));h=2/n
 # Intersect each pixel rectangle separately; no ray grid-crossing algorithm.
 for k in range(na):
  th=k*np.pi/na;normal=np.array([np.cos(th),np.sin(th)]);direction=np.array([-normal[1],normal[0]])
  for j in range(nd):
   p=(-half+(j+.5)*2*half/nd)*normal
   for iy in range(n):
    for ix in range(n):
     bounds=[[-1+ix*h,-1+(ix+1)*h],[1-(iy+1)*h,1-iy*h]];lo=-np.inf;hi=np.inf
     for a in range(2):
      if abs(direction[a])<1e-14:
       if not bounds[a][0]<=p[a]<=bounds[a][1]:lo=1;hi=0;break
      else:
       z=(np.array(bounds[a])-p[a])/direction[a];lo=max(lo,min(z));hi=min(hi,max(z))
     A[k*nd+j,iy*n+ix]=max(0,hi-lo)
 return A

def iterate(A,b,na,nd,kind,lam,loops,start=None):
 x=np.zeros(A.shape[1])if start is None else np.array(start,dtype=float);rows=A.sum(axis=1);cols=A.sum(axis=0);out=[]
 for t in range(loops):
  if kind=='art':
   for k in [(i*7)%na for i in range(na)]:
    for j in range(nd):
     i=k*nd+j;a=A[i];ss=a@a
     if ss>0:x+=lam*(b[i]-a@x)*a/ss
  elif kind=='sirt':
   residual=np.divide(b-A@x,rows,out=np.zeros(len(b)),where=rows>0)
   x+=lam*np.divide(A.T@residual,cols,out=np.zeros(len(x)),where=cols>0)
  else:
   for k in [(i*7)%na for i in range(na)]:
    B=A[k*nd:(k+1)*nd];r=B.sum(axis=1);c=B.sum(axis=0)
    z=np.divide(b[k*nd:(k+1)*nd]-B@x,r,out=np.zeros(nd),where=r>0)
    x+=lam*np.divide(B.T@z,c,out=np.zeros(len(x)),where=c>1e-12)
  if t in [0,1,4,19,29]:out.append(dict(k=t+1,x=x.tolist()))
 return out
small=[]
for n,na,nd,half in [(4,9,10,1.42),(5,8,9,1.42)]:
 A=system(n,na,nd,half);x=np.sin(np.arange(n*n)*.4)*.3;b=A@x+.03*np.sin(np.arange(na*nd)+1)
 records=[]
 for lam in [.2,1,1.5]:
  for kind in ['art','sirt','sart']:records.append(dict(kind=kind,lam=lam,steps=iterate(A,b,na,nd,kind,lam,30)))
 small.append(dict(n=n,na=na,nd=nd,half=half,A=A.tolist(),b=b.tolist(),records=records))
A=system(24,18,36,1.42);r=A.sum(axis=1);c=A.sum(axis=0);mask=r>0;B=(A[mask]/np.sqrt(r[mask])[:,None])/np.sqrt(c)[None,:];sigma=svdvals(A);s=svdvals(B)
# Same chosen ellipse amplitudes/3x3 supersampling, independently rasterized.
base=[[1,.69,.92,0,0,0],[-.8,.6624,.874,0,-.0184,0],[-.2,.11,.31,.22,0,-18],[-.2,.16,.41,-.22,0,18],[.1,.21,.25,0,.35,0],[.1,.046,.046,0,.1,0],[.1,.046,.046,0,-.1,0],[.1,.046,.023,-.08,-.605,0],[.1,.023,.023,0,-.606,0],[.1,.023,.046,.06,-.605,0]]
x=np.zeros(576)
for iy in range(24):
 for ix in range(24):
  for py in range(3):
   for px in range(3):
    xx=-1+(ix+(px+.5)/3)*2/24;yy=1-(iy+(py+.5)/3)*2/24
    for amp,a,b,cx,cy,deg in base:
     al=np.deg2rad(deg);u=(xx-cx*.9)*np.cos(al)+(yy-cy*.9)*np.sin(al);v=-(xx-cx*.9)*np.sin(al)+(yy-cy*.9)*np.cos(al)
     if (u/(a*.9))**2+(v/(b*.9))**2<=1:x[iy*24+ix]+=amp/9
b=A@x;closest=lstsq(A,b,cond=1e-12)[0]
full=dict(n=24,na=18,nd=36,half=1.42,rank=int(np.sum(sigma>sigma[0]*1e-12)),empty=int(np.sum(~mask)),unobserved=int(np.sum(c==0)),maxSingular=float(sigma[0]),normalizedMax=float(s[0]),truthRMS=float(np.sqrt(np.mean(x*x))),closestTruthRMSE=float(np.sqrt(np.mean((closest-x)**2))),b=b.tolist())
# Full-system method errors at actual finite checkpoints with deterministic non-Gaussian test perturbation.
full['records']=[];bn=b+.03*b.mean()*np.sin(np.arange(len(b))+1)
for kind in ['art','sirt','sart']:
 steps=iterate(A,bn,18,36,kind,1,30);full['records'].append(dict(kind=kind,steps=[dict(k=q['k'],rmse=float(np.sqrt(np.mean((np.array(q['x'])-x)**2))))for q in steps]))
Path('tests/fixtures/imaging-algebraic-reference.json').write_text(json.dumps(dict(small=small,full=full),indent=2))
print({k:v for k,v in full.items()if k not in ['b','records']})
