"""Independent dense matrix-exponential passive-circuit references, no JS helpers."""
import numpy as np,json
from scipy.linalg import expm
segs=[dict(parent=-1,len=20,dia=20,soma=True),dict(parent=0,len=120,dia=2),dict(parent=1,len=100,dia=1),dict(parent=1,len=80,dia=1.4)]
refs=[]
for dx in [60,30,15]:
 par=[];area=[];lens=[];dias=[];pos=[];seg=[];first=[];last=[]
 for k,s in enumerate(segs):
  m=1 if s.get('soma',False) else int(np.ceil(s['len']/dx));l=s['dia'] if s.get('soma',False) else s['len']/m;first.append(len(par))
  for j in range(m):
   par.append((last[s['parent']] if s['parent']>=0 else -1) if j==0 else len(par)-1);lens.append(l);dias.append(s['dia']);pos.append((j+.5)*l);seg.append(k);area.append(np.pi*l*s['dia']*1e-8)
  last.append(len(par)-1)
 n=len(par);C=np.array(area)*1000;G=np.diag(C*.05);Ra=4*100*np.array(lens)*1e-4/(np.pi*(np.array(dias)*1e-4)**2)
 for i in range(1,n):
  p=par[i];g=1e6/(.5*(Ra[i]+Ra[p]));G[i,i]+=g;G[p,p]+=g;G[i,p]-=g;G[p,i]-=g
 # fixed physical source on segment2, center=.73*100, width30 =>[58,88]µm
 weights=np.zeros(n)
 for i in range(first[2],last[2]+1):weights[i]=max(0,min(pos[i]+lens[i]/2,88)-max(pos[i]-lens[i]/2,58))/30
 A=-G/C[:,None];b=.01*weights/C;eq=np.linalg.solve(G,.01*weights)
 times=np.arange(0,40.01,.1);values=[]
 for t in times:
  z=np.zeros(n) if t<=1 else (np.eye(n)-expm(A*(t-1)))@eq if t<=4 else expm(A*(t-4))@(np.eye(n)-expm(A*3))@eq
  values.append([float(z[0]),float(z@weights)])
 refs.append(dict(dx=dx,n=n,weights=weights.tolist(),G=G.tolist(),C=C.tolist(),times=times.tolist(),values=values))
with open('tests/fixtures/neuro-compartments-reference.json','w')as o:json.dump(dict(segs=segs,refs=refs),o,indent=2)
