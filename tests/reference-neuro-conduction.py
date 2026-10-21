"""Independent semidiscrete HH chain, BDF solve with sparse finite-difference Jacobian."""
import numpy as np,json
from scipy.integrate import solve_ivp
from scipy.sparse import lil_matrix

def rates(v):
 def trap(x,s):
  den=-np.expm1(-x/s);return np.divide(x,den,out=np.full_like(np.asarray(x,dtype=float),s),where=np.abs(x)>1e-9)
 return (.1*trap(v+40,10),4*np.exp(-(v+65)/18),.07*np.exp(-(v+65)/20),1/(1+np.exp(-(v+35)/10)),.01*trap(v+55,10),.125*np.exp(-(v+65)/80))
refs=[]
for d,T in [(10,18.5),(476,6.3),(476,18.5)]:
 dx=100;N=300;D=d*1e-4/(4*35.4)*1000/(dx*1e-4)**2;phi=3**((T-6.3)/10);a=rates(np.array([-65.]));y=np.concatenate([np.full(N,-65),np.full(N,a[0][0]/(a[0][0]+a[1][0])),np.full(N,a[2][0]/(a[2][0]+a[3][0])),np.full(N,a[4][0]/(a[4][0]+a[5][0]))])
 J=lil_matrix((4*N,4*N))
 for i in range(N):
  for j in [i,max(0,i-1),min(N-1,i+1),N+i,2*N+i,3*N+i]:J[i,j]=1
  for k in range(1,4):J[k*N+i,i]=J[k*N+i,k*N+i]=1
 J=J.tocsr();arr=[]
 def measure(y,x):
  z=x/dx-.5;i=int(np.floor(z));w=z-i;return(1-w)*y[i]+w*y[i+1]
 def e1(t,y):return measure(y,10000)
 def e2(t,y):return measure(y,24000)
 e1.direction=e2.direction=1;e2.terminal=True
 for lo,hi,stim in [(0,.5,True),(.5,80,False)]:
  def f(t,y):
   v,m,h,n=y.reshape(4,N);am,bm,ah,bh,an,bn=rates(v);lap=np.concatenate(([v[1]-v[0]],np.diff(v,2),[v[-2]-v[-1]]));dv=D*lap-120*m**3*h*(v-50)-36*n**4*(v+77)-.3*(v+54.387)
   if stim:dv[:10]+=500
   return np.concatenate([dv,phi*(am*(1-m)-bm*m),phi*(ah*(1-h)-bh*h),phi*(an*(1-n)-bn*n)])
  q=solve_ivp(f,(lo,hi),y,method='BDF',jac_sparsity=J,rtol=2e-9,atol=1e-11,max_step=.025,events=[e1,e2]);y=q.y[:,-1]
  arr.extend((k,float(t)) for k,ts in enumerate(q.t_events) for t in ts)
  if q.status==1:break
 times=[next((t for k,t in arr if k==j),None) for j in range(2)]
 refs.append(dict(d=d,T=T,dx=dx,arrivals=times,speed=14/(times[1]-times[0])))
 print(refs[-1],flush=True)
with open('tests/fixtures/neuro-conduction-reference.json','w')as o:json.dump(dict(refs=refs),o,indent=2)
