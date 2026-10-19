"""Independent continuous-time generator exponential and DOP853 HH references."""
import numpy as np, json
from scipy.linalg import expm
from scipy.integrate import solve_ivp

def rates(v):
 def trap(x,s):return s if abs(x)<1e-10 else x/(-np.expm1(-x/s))
 return (.1*trap(v+40,10),4*np.exp(-(v+65)/18),.07*np.exp(-(v+65)/20),1/(1+np.exp(-(v+35)/10)),.01*trap(v+55,10),.125*np.exp(-(v+65)/80))
def generator(n,a,b):
 Q=np.zeros((n+1,n+1))
 for k in range(n+1):
  if k<n: Q[k,k+1]=(n-k)*a
  if k>0: Q[k,k-1]=k*b
  Q[k,k]=-Q[k].sum()
 return Q
cases=[]
for v in [-85,-65,-55,-40,-20,0,30,55]:
 am,bm,ah,bh,an,bn=rates(v)
 Qna=np.kron(np.eye(2),generator(3,am,bm))+np.kron(generator(1,ah,bh),np.eye(4))
 for dt in [.0125,.025,.1,1]:cases.append(dict(V=v,dt=dt,K=expm(generator(4,an,bn)*dt).tolist(),Na=expm(Qna*dt).tolist()))
a=rates(-65);y0=[-65,a[0]/sum(a[:2]),a[2]/sum(a[2:4]),a[4]/sum(a[4:])]
def f(t,y,I):
 v,m,h,n=y;am,bm,ah,bh,an,bn=rates(v)
 return [I-120*m**3*h*(v-50)-36*n**4*(v+77)-.3*(v+54.387),am*(1-m)-bm*m,ah*(1-h)-bh*h,an*(1-n)-bn*n]
refs=[]
for mode in ['pulse','I2','I6']:
 T=12 if mode=='pulse' else 30
 knots=[(0,2,0),(2,3,9),(3,T,0)] if mode=='pulse' else [(0,T,int(mode[1:]))]
 y=y0.copy();ts=[];vs=[];events=[]
 for lo,hi,I in knots:
  def e(t,y):return y[0]
  e.direction=1
  sol=solve_ivp(lambda t,y:f(t,y,I),(lo,hi),y,method='DOP853',rtol=2e-12,atol=1e-13,dense_output=True,events=e,max_step=.01)
  grid=np.arange(round(lo/.1),round(hi/.1)+1)*.1
  if ts: grid=grid[1:]
  ts.extend(grid.tolist());vs.extend(sol.sol(grid)[0].tolist());events.extend(sol.t_events[0].tolist());y=sol.y[:,-1]
 refs.append(dict(mode=mode,t=ts,V=vs,events=events))
with open('tests/fixtures/neuro-channel-noise-reference.json','w')as out:json.dump(dict(generators=cases,hh=refs),out,indent=2)
