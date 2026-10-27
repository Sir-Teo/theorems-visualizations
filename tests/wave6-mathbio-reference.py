"""Independent DOP853/Radau, matrix exponentials, quadrature and120-digit phase geometry."""
import json,math,mpmath as mp,numpy as np
from scipy.integrate import solve_ivp,quad
from scipy.linalg import expm
mp.mp.dps=120
R={'method':'SciPy original-coordinate DOP853, Radau, matrix exponential and adaptive polar quadrature; mpmath120-digit geometry and thresholds','vdp':[],'selkov':[],'goodwin':[],'secant':[],'modes':[],'switch':[],'excitable':[],'oregonator':[],'phase':[],'circle':[],'flux':[]}
def ode(fun,initial,times,method='DOP853',atol=1e-13,max_step=np.inf):
 r=solve_ivp(fun,[0,max(times)],initial,t_eval=times,method=method,rtol=1e-11,atol=atol,max_step=max_step)
 if not r.success:raise RuntimeError(r.message)
 return r.y.T.tolist()
for mu in [.2,.5,1,3,8]:
 times=[0,.2,1,2,5,10,20,40,60,80]
 def rhs(t,z):
  x,v=z;return[v,mu*(1-x*x)*v-x]
 def event(t,z):return z[0]
 event.direction=1
 sol=solve_ivp(rhs,[0,80],[2,-2*mu/3],method='DOP853',rtol=1e-12,atol=1e-14,t_eval=times,events=event)
 values=[[float(x),float(x-x**3/3-v/mu)] for x,v in sol.y.T];cross=sol.t_events[0];cross=cross[cross>=40];period=float(np.mean(np.diff(cross)))
 R['vdp'].append(dict(mu=mu,times=times,values=values,period=period))
for b in [.25,.35,.4198,.45,.6,.78,.79,.85,.95]:
 times=[0,.1,1,10,30,60,120,200,240]
 def rhs(t,z):
  x,y=z;flux=(.1+x*x)*y;return[-x+flux,b-flux]
 R['selkov'].append(dict(b=b,times=times,values=ode(rhs,[1,.25],times)))
for h in [4,8,16-2**-46,16,16+2**-46,20,24]:
 times=[0,.1,1,5,20,60,120,240]
 def rhs(t,z):
  x,y,z=z;return[2/(1+z**h)-x,x-y,y-z]
 sigma=mp.root(mp.mpf(h)/2,3)/2-1
 R['goodwin'].append(dict(h=h,times=times,values=ode(rhs,[1.1,.9,1],times),sigma=float(sigma)))
for n in range(3,11):
 critical=mp.sec(mp.pi/n)**n;c=float(critical)
 for gain in [0,1e-30,.1,1,4,8,20,c-1e-13,c,c+1e-13]:
  sigma=mp.mpf(-1) if gain==0 else mp.root(mp.mpf(gain),n)*mp.cos(mp.pi/n)-1
  R['secant'].append(dict(n=n,gain=gain,critical=float(critical),sigma=float(sigma)))
for n in [3,4,6,10]:
 for gain in [0,.1,8,20]:
  r=gain**(1/n);J=-np.eye(n)
  for i in range(1,n):J[i,i-1]=r
  J[0,-1]=-r;x0=np.cos(np.pi*np.arange(n)/n)
  for t in [.1,2,10]:R['modes'].append(dict(n=n,gain=gain,t=t,values=(expm(J*t)@x0).tolist()))
for A in [1,math.nextafter(2,0),2,math.nextafter(2,3),2.5,3]:
 for u in [0,.4,1]:
  for duration in [0,8,8.1234567,20]:
   times=[0,1,5,10,20,30,60];values={0:.05};state=[.05];offset=0
   for length,inp in [(5,0),(duration,u),(55-duration,0)]:
    if length==0:continue
    def rhs(t,z):return[inp+A*z[0]**2/(1+z[0]**2)-z[0]]
    sol=solve_ivp(rhs,[offset,offset+length],state,method='DOP853',rtol=1e-11,atol=1e-35,dense_output=True,max_step=.2)
    for t in times:
     if offset<=t<=offset+length:values[t]=float(sol.sol(t)[0])
    state=sol.y[:,-1];offset+=length
   aa=mp.mpf(A);roots=[0] if A<2 else [0,1] if A==2 else [0,float((aa-mp.sqrt(aa*aa-4))/2),float((aa+mp.sqrt(aa*aa-4))/2)]
   R['switch'].append(dict(A=A,input=u,duration=duration,times=times,values=[values[t] for t in times],roots=roots))
restx=mp.findroot(lambda x:mp.mpf('.8')*x**3/3+mp.mpf('.2')*x+mp.mpf('.7'),-1.2);rest=[float(restx),float((restx+mp.mpf('.7'))/mp.mpf('.8'))]
for kick in [0,.1,.8,1.2,3]:
 for eps in [.03,.08,.15]:
  times=[0,.1,1,5,10,20,50,100,200]
  def rhs(t,z):
   x,y=z;return[x-x**3/3-y,eps*(x+.7-.8*y)]
  R['excitable'].append(dict(kick=kick,eps=eps,times=times,values=ode(rhs,[rest[0]+kick,rest[1]],times,max_step=.25)))
for eps in [.04,.08,.2]:
 for delta in [.002,.01,.02]:
  for f in [.7,1,1.4]:
   times=[0,.05,.2,1,5,10,20,40]
   def rhs(t,s):
    x,y,z=s;return[(.0008*y-x*y+x*(1-x))/eps,(-.0008*y-x*y+f*z)/delta,x-z]
   R['oregonator'].append(dict(params=dict(eps=eps,delta=delta,f=f),times=times,values=ode(rhs,[.2,.1,.1],times,'Radau',1e-14)))
def reset(p,A,beta):
 pp=mp.mpf(p);aa=mp.mpf(A);bb=mp.mpf(beta)
 if p in [0,.25,.5,.75,1]:c,s={0:(1,0),.25:(0,1),.5:(-1,0),.75:(0,-1),1:(1,0)}[p];c=mp.mpf(c);s=mp.mpf(s)
 else:c=mp.cos(2*mp.pi*pp);s=mp.sin(2*mp.pi*pp)
 x=c+aa;y=s;r=mp.sqrt(x*x+y*y)
 if r==0:return dict(point=[0,0],radius=0,newPhase=None,shift=None,recovery=None)
 angle=mp.atan2(y,x)/(2*mp.pi)
 if A<1 and (angle<0 or p==1):angle+=1
 new=angle-bb*mp.log(r)/(2*mp.pi);shift=2*mp.pi*(new-pp)
 if A==0:new=pp;shift=mp.mpf(0)
 recovery=mp.mpf(0)
 if r<mp.mpf('.9'):recovery=mp.log((1/(r*r)-1)/(1/mp.mpf('.9')**2-1))/2
 elif r>mp.mpf('1.1'):recovery=mp.log((1-1/(r*r))/(1-1/mp.mpf('1.1')**2))/2
 return dict(point=[float(x),float(y)],radius=float(r),newPhase=float(new),shift=float(shift),recovery=float(recovery))
for A in [0,1e-15,.25,.6,1-2**-46,1,1+2**-46,2]:
 for p in [0,.125,.25,.5-2**-52,.5,.5+2**-52,.75,1]:
  for b in [-1,0,1]:R['phase'].append(dict(phase=p,amplitude=A,shear=b,**reset(p,A,b)))
R['phaseFlow']=[]
for A in [.25,.6]:
 for p in [0,.25,.5,.75]:
  for beta in [-1,0,1]:
   times=[0,.5,2,6,12];initial=reset(p,A,beta)['point']
   def rhs(t,z):
    x,y=z;r2=x*x+y*y;growth=1-r2;angular=1+beta*growth;return[growth*x-angular*y,growth*y+angular*x]
   R['phaseFlow'].append(dict(phase=p,amplitude=A,shear=beta,times=times,values=ode(rhs,initial,times,max_step=.1)))
for omega in [.5,2/3,.67,1]:
 for K in [0,.2,.6,1]:
  phase=mp.mpf(.13);initial=phase
  for j in range(1024):phase=phase+mp.mpf(omega)-mp.mpf(K)/(2*mp.pi)*mp.sin(2*mp.pi*phase)
  R['circle'].append(dict(omega=omega,K=K,steps=1024,estimate=float((phase-initial)/1024),last=float(phase)))
for mode in ['rotation','predator–prey']:
 for weighted in [False,True]:
  for damping in [0,.01,.2,.8]:
   for radius in [.05,.3,.8]:
    c=0 if mode=='rotation' else 1
    def angular(t):
     def radial(r):
      x=c+r*math.cos(t);y=c+r*math.sin(t)
      div=-2*damping if mode=='rotation' else -damping/y if weighted else (1-2*damping)*x-y
      return div*r
     return quad(radial,0,radius,epsabs=1e-12,epsrel=1e-12)[0]
    value=quad(angular,0,2*math.pi,epsabs=1e-12,epsrel=1e-12)[0]
    R['flux'].append(dict(params=dict(mode=mode,weighted=weighted,damping=damping,radius=radius),value=value))
print(json.dumps(R,indent=2,allow_nan=False))
