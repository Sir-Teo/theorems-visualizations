"""Independent SciPy eigen/ODE/linear solves, inverse-beta and120-digit references."""
import json,math,mpmath as mp,numpy as np
from scipy.integrate import solve_ivp,quad
from scipy.linalg import eigvals,eig as scipy_eig
from scipy.stats import beta as beta_distribution
mp.mp.dps=120
R={'method':'Independent Python uint32 generator, SciPy eigenvalues/DOP853/linear solves/inverse-beta/quadrature and mpmath120-digit geometry and condition-triggered eigenvalues','trophic':[],'space':[],'spaceRun':[],'cascade':[],'exploitation':[],'community':[],'random':[],'ensemble':[],'attack':[],'niche':[],'chain':[],'omnivory':[],'insurance':[]}
class Generator:
 def __init__(self,seed):self.state=seed;self.mask=2**32-1
 def next(self):
  self.state=(self.state+0x6D2B79F5)&self.mask;t=((self.state^(self.state>>15))*(1|self.state))&self.mask;t=(((t+(((t^(t>>7))*(61|t))&self.mask))&self.mask)^t)&self.mask
  return ((t^(t>>14))&self.mask)/2**32
 def normal(self):return math.sqrt(-2*math.log(1-self.next()))*math.cos(2*math.pi*self.next())
 def integer(self,a,b):return math.floor(a+(b-a+1)*self.next())
R['spectralAudit']={'multiprecisionCases':[]}
def spectrum(A):
 values,left,right=scipy_eig(A,left=True,right=True)
 condition=max(np.linalg.norm(left[:,i])*np.linalg.norm(right[:,i])/max(abs(np.vdot(left[:,i],right[:,i])),np.finfo(float).tiny) for i in range(len(values)))
 if condition>1e6:
  values=mp.eig(mp.matrix([[mp.mpf(float(x)) for x in row] for row in A]),left=False,right=False)
  R['spectralAudit']['multiprecisionCases'].append({'dimension':len(A),'binary64ConditionEstimate':str(float(condition)),'precisionDigits':mp.mp.dps})
  return [[float(mp.re(z)),float(mp.im(z))] for z in values]
 return [[float(z.real),float(z.imag)] for z in values]
def integrate(fn,initial,times,atol=1e-13,max_step=.2):
 z=solve_ivp(fn,[0,max(times)],initial,method='DOP853',t_eval=times,rtol=1e-11,atol=atol,max_step=max_step)
 if not z.success:raise RuntimeError(z.message)
 return z.y.T.tolist()
def space_equilibrium(P):
 c=list(map(mp.mpf,['1','1.5','9']));p=list(map(mp.mpf,['.75','.02','.02']));x=[]
 for ci,pi in zip(c,p):x.append(max(mp.mpf(0),1-sum(x)-(sum(cj*xj for cj,xj in zip(c,x))+mp.mpf('.1')+pi*mp.mpf(P))/ci))
 return [float(z) for z in x]
def space_field(P,x):
 c=np.array([1,1.5,9]);p=np.array([.75,.02,.02]);return np.array([x[i]*(c[i]*(1-sum(x[:i+1]))-sum(c[:i]*x[:i])-.1-p[i]*P) for i in range(3)])
for rho in [0,.5,.9,1-1e-12,1-2**-52,1]:
 q=mp.mpf(rho);levels=[1,None,None] if rho==1 else [1,float(2/(1-q)),float(1+2/(1-q))];R['trophic'].append(dict(rho=rho,levels=levels))
for P in np.linspace(0,1,21).tolist():R['space'].append(dict(P=P,equilibrium=space_equilibrium(P)))
for pressure in [0,.35,1]:
 for restore in [False,True]:
  for returnTime in [50,50.1234567]:
   ends=[(10,1),(returnTime if restore else 120,pressure)]+([(120,1)] if restore else[]);initial=space_equilibrium(1);start=0;allrows=[[0,*initial]]
   times=sorted(set([0,5,10,20,40,50,60,80,100,120]+([returnTime] if restore else [])))
   for end,P in ends:
    samples=[t for t in times if start<t<=end]
    targets=sorted(set(samples+[end]));values=integrate(lambda t,z:space_field(P,z),initial,[start]+targets,atol=1e-50) if start==0 else None
    if start:
     sol=solve_ivp(lambda t,z:space_field(P,z),[start,end],initial,method='DOP853',t_eval=targets,rtol=1e-11,atol=1e-50,max_step=.2)
     if not sol.success:raise RuntimeError(sol.message)
     values=sol.y.T.tolist()
    else:values=values[1:]
    for t,z in zip(targets,values):
     if t in times:allrows.append([t,*z])
    initial=values[-1];start=end
   R['spaceRun'].append(dict(params=dict(pressure=pressure,restore=restore,returnTime=returnTime),times=[r[0] for r in allrows],values=[r[1:] for r in allrows]))
for P in [0,.3,1,2]:
 for K in [.2,.7,2,5]:
  rr=(mp.mpf('.25')+mp.mpf('.5')*P)/mp.mpf('.36');x=[float(rr),float((1-rr/K)/mp.mpf('.6'))] if rr<K else[K,0];R['cascade'].append(dict(P=P,K=K,values=x))
for K in [.2,.7,1,2,5]:
 for levels in [1,2,3]:
  a=mp.mpf('.6');e=a;m=mp.mpf('.25');c=mp.mpf('.5');eta=mp.mpf('.7');d=mp.mpf('.2');R2=m/(a*e);H3=d/(eta*c);fraction=1-a*H3;boundary=R2/fraction;x=[mp.mpf(K),0,0]
  if levels>=2 and K>R2:x=[R2,(1-R2/K)/a,0]
  if levels==3 and K>boundary:x=[K*fraction,H3,(e*a*K*fraction-m)/c]
  R['exploitation'].append(dict(K=K,levels=levels,values=list(map(float,x)),herbivoreBoundary=float(R2),topBoundary=float(boundary)))
for mode in ['symmetric','asymmetric']:
 for a in [0,.5,1-2**-52,1,1+2**-52,1.5,2,2.5,3]:
  aa=mp.mpf(a);b=aa if mode=='symmetric' else mp.mpf('.5')
  if mode=='asymmetric' and a==2:equilibrium=None;eigen=[]
  else:
   eq=[1/(1+aa)]*2 if mode=='symmetric' else[(1-aa)/(1-aa/2),mp.mpf('.5')/(1-aa/2)];equilibrium=list(map(float,eq));J=np.diag(equilibrium)@np.array([[-1,-a],[-float(b),-1]]);eigen=[[-1,0],[float((aa-1)/(aa+1)),0]] if mode=='symmetric' else spectrum(J)
  times=[0,1,5,20,40,60];values=integrate(lambda t,z:np.array([z[0]*(1-z[0]-a*z[1]),z[1]*(1-float(b)*z[0]-z[1])]),[.4,.6],times)
  R['community'].append(dict(a=a,mode=mode,equilibrium=equilibrium,eigen=eigen,times=times,values=values))
cache={}
def random_case(S,C,seed):
 key=(S,C,seed)
 if key in cache:return cache[key]
 g=Generator(seed);A=np.zeros((S,S));links=0
 for i in range(48):
  for j in range(48):
   if i==j:continue
   on=g.next()<C;z=g.normal()
   if i<S and j<S and on:A[i,j]=z;links+=1
 eigen=spectrum(A);abscissa=max(x[0] for x in eigen);cache[key]=(A,eigen,abscissa,links);return cache[key]
for S in [4,12,24,48]:
 for C in [0,.05,.25,1]:
  for seed in [1,17]:
   A,eigen,alpha,links=random_case(S,C,seed);R['random'].append(dict(S=S,C=C,seed=seed,matrix=A.tolist(),eigen=eigen,abscissa=alpha,links=links))
for S in [4,24,48]:
 for C in [0,.25,1]:
  for trials in [16,64]:
   seed=3;alphas=[random_case(S,C,1+(seed-1+i*7919)%99999)[2] for i in range(trials)];R['ensemble'].append(dict(params=dict(S=S,C=C,trials=trials,seed=seed),abscissae=alphas))
for a in [.2,.25,.4,7/15,.6,.8,1]:
 aa=mp.mpf(a);rr=mp.mpf('.2')/(aa*mp.mpf('.3'));hh=(1-rr/5)*(1+aa*rr)/aa;J=np.array([[1-2*float(rr)/5-a*float(hh)/(1+a*float(rr))**2,-a*float(rr)/(1+a*float(rr))],[.5*a*float(hh)/(1+a*float(rr))**2,0.]])
 times=[0,.1,1,5,20,60,120,200,240]
 def attack_rhs(t,z):
  x,y=z;flux=a*x*y/(1+a*x);return[x*(1-x/5)-flux,.5*flux-.2*y]
 R['attack'].append(dict(a=a,equilibrium=[float(rr),float(hh)],trace=float(np.trace(J)),det=float(np.linalg.det(J)),times=times,values=integrate(attack_rhs,[2,1],times)))
for S in [4,12,24,48]:
 for C in [.05,.15,.25]:
  for seed in [1,77]:
   g=Generator(seed);positions=sorted(g.next() for i in range(S));beta=1/(2*C)-1;intervals=[]
   for n in positions:
    width=n*beta_distribution.ppf(g.next(),1,beta);center=width/2+(n-width/2)*g.next();intervals.append(dict(n=n,width=width,center=center,lo=center-width/2,hi=center+width/2))
   M=[[int(x['lo']<=n<=x['hi']) for n in positions] for x in intervals];R['niche'].append(dict(params=dict(S=S,C=C,seed=seed),positions=positions,intervals=intervals,matrix=M))
for S in [4,12,28]:
 for p in [0,.2,1]:
  for seed in [1,88]:
   for mode in ['random cascade','chain','star']:
    g=Generator(seed);A=np.zeros((S,S),dtype=int)
    for i in range(1,S):
     if mode=='chain':A[i,i-1]=1
     elif mode=='star':A[i,0]=1
     else:
      A[i,g.integer(0,i-1)]=1
      for j in range(i):
       if g.next()<p:A[i,j]=1
    D=A.astype(float);counts=A.sum(axis=1);D[counts>0]/=counts[counts>0,None];levels=np.linalg.solve(np.eye(S)-D,np.ones(S));power=np.eye(S,dtype=bool);longest=1
    for k in range(1,S):
     power=(power.astype(int)@A)>0
     if power.any():longest=k+1
    R['chain'].append(dict(params=dict(S=S,p=p,seed=seed,mode=mode),matrix=A.tolist(),links=int(A.sum()),longest=longest,levels=levels.tolist()))
for b in [0,.2,.4,.7,1]:
 times=[0,.1,1,5,20,40,80,120]
 def rhs(t,z):
  x,y,w=z;return[x*(1-x/2)-x*y-b*x*w,y*(.8*x-.3-.7*w),w*(.2*b*x+.42*y-.3)]
 R['omnivory'].append(dict(b=b,times=times,values=integrate(rhs,[1,.4,.3],times)))
for S in [1,2,8,24]:
 for rho in [0,.3,1]:
  for cv in [.02,.2,.3]:
   rr=mp.mpf(rho);vv=mp.mpf(cv);aggregate=float(vv*mp.sqrt((1+(S-1)*rr)/S));times=[0,.125,.5,.99999,1];values=[]
   for t in times:
    tt=mp.mpf(t);values.append([float(1+mp.sqrt(2)*vv*(mp.sqrt(rr)*mp.cos(2*mp.pi*tt)+mp.sqrt(1-rr)*mp.cos(2*mp.pi*(i+2)*tt))) for i in range(S)])
   def total(t):return sum(1+math.sqrt(2)*cv*(math.sqrt(rho)*math.cos(2*math.pi*t)+math.sqrt(1-rho)*math.cos(2*math.pi*(i+2)*t)) for i in range(S))
   mean=quad(total,0,1,epsabs=1e-11,epsrel=1e-11)[0];variance=quad(lambda t:(total(t)-mean)**2,0,1,epsabs=1e-11,epsrel=1e-11)[0]
   R['insurance'].append(dict(S=S,rho=rho,cv=cv,times=times,values=values,aggregateCV=aggregate,quadratureCV=math.sqrt(variance)/mean))
print(json.dumps(R,indent=2,allow_nan=False))
