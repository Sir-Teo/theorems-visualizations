"""Independent nodal/internodal geometry plus sparse BDF full nonlinear HH reference."""
import numpy as np,json
from scipy.integrate import solve_ivp
from scipy.sparse import lil_matrix
def rates(v):
 def trap(x,s):
  den=-np.expm1(-x/s);return np.divide(x,den,out=np.full_like(np.asarray(x,dtype=float),s),where=np.abs(x)>1e-9)
 return (.1*trap(v+40,10),4*np.exp(-(v+65)/18),.07*np.exp(-(v+65)/20),1/(1+np.exp(-(v+35)/10)),.01*trap(v+55,10),.125*np.exp(-(v+65)/80))
refs=[]
for D,g,ratio,sheath,mInt in [(4,.65,100,'full',3),(4,.65,100,'full',6),(20,.85,20,'full',6),(.5,.65,100,'none',6),(4,.65,100,'none',6)]:
 natural=max(1,int(np.floor((1-g)*D*.5*1000/8.5+.5)));nb=1 if sheath=='none' else max(1,int(np.floor(natural/10+.5))) if sheath=='thin' else natural
 d=g*D;L=ratio*D;lens=[];node=[]
 for k in range(12):
  lens.append(1);node.append(True)
  if k<11:lens.extend([L/mInt]*mInt);node.extend([False]*mInt)
 lens=np.array(lens);node=np.array(node);N=len(lens);area=np.pi*d*lens*1e-8;scale=area*1000;C=scale*np.where(node,1,1/nb);gL=.3*np.where(node,30,1/nb);gNa=120*np.where(node,30,0);gK=36*np.where(node,30,0);R=4*35.4*lens*1e-4/(np.pi*(d*1e-4)**2);gc=1e6/(.5*(R[1:]+R[:-1]));xs=np.cumsum(lens)-lens/2;idx=np.where(node)[0];probe=idx[[3,9]];phi=3**((18.5-6.3)/10)
 a=rates(np.array([-65.]));y=np.concatenate([np.full(N,-65),np.full(N,a[0][0]/(a[0][0]+a[1][0])),np.full(N,a[2][0]/(a[2][0]+a[3][0])),np.full(N,a[4][0]/(a[4][0]+a[5][0]))]);J=lil_matrix((4*N,4*N))
 for i in range(N):
  for j in [i,max(0,i-1),min(N-1,i+1),N+i,2*N+i,3*N+i]:J[i,j]=1
  for k in range(1,4):J[k*N+i,i]=J[k*N+i,k*N+i]=1
 J=J.tocsr();arr=[]
 def e1(t,y):return y[probe[0]]
 def e2(t,y):return y[probe[1]]
 e1.direction=e2.direction=1;e2.terminal=True
 for lo,hi,stim in [(0,.3,True),(.3,12,False)]:
  def f(t,y):
   v,m,h,n=y.reshape(4,N);am,bm,ah,bh,an,bn=rates(v);flow=gc*np.diff(v);ax=np.zeros(N);ax[:-1]+=flow;ax[1:]-=flow;dv=ax-scale*(gNa*m**3*h*(v-50)+gK*n**4*(v+77)+gL*(v+54.387))
   if stim:dv[0]+=4000*scale[0]
   return np.concatenate([dv/C,node*phi*(am*(1-m)-bm*m),node*phi*(ah*(1-h)-bh*h),node*phi*(an*(1-n)-bn*n)])
  q=solve_ivp(f,(lo,hi),y,method='BDF',jac_sparsity=J,rtol=1e-9,atol=1e-11,max_step=.01,events=[e1,e2]);y=q.y[:,-1];arr.extend((k,float(t))for k,ts in enumerate(q.t_events)for t in ts)
  if q.status==1:break
 times=[next((t for k,t in arr if k==j),None)for j in range(2)];speed=None if None in times else float((xs[probe[1]]-xs[probe[0]])*.001/(times[1]-times[0]))
 refs.append(dict(D=D,g=g,ratio=ratio,sheath=sheath,mInt=mInt,nb=nb,n=N,xs=xs.tolist(),area=area.tolist(),gc=gc.tolist(),arrivals=times,speed=speed));print(refs[-1]|dict(xs='omitted',area='omitted',gc='omitted'),flush=True)
with open('tests/fixtures/neuro-myelin-reference.json','w')as o:json.dump(dict(refs=refs),o,indent=2)
