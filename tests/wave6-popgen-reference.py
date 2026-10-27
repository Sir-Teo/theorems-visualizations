"""Independent mpmath Lambert-W/precision arithmetic and SciPy binomial linear solves."""
import json,mpmath as mp,numpy as np
from scipy.stats import binom
from scipy.linalg import solve
from scipy.integrate import quad
mp.mp.dps=120
out={'method':'mpmath120-digit Lambert W with adaptive subnormal branch-point precision and analytic continuation; SciPy binomial PMFs and dense absorption solves; adaptive hazard quadrature','survival':[],'fixation':[],'chain':[],'rescue':[]}
def rho(s):
 s=mp.mpf(str(s))
 if s<=0:return mp.mpf(0)
 with mp.workdps(max(120,int(-2*mp.log10(s))+80)):
  m=1+s;return 1+mp.lambertw(-m*mp.exp(-m),0).real/m
for s in [-.1,-1e-16,0,5e-324,1e-30,1e-16,1e-12,1e-8,.0001,.001,.01,.02,.05,.1,.2,.5,1]:
 out['survival'].append([s,float(rho(s))])
for N in [2,10,1000,1e6,1e9]:
 for s in [-.1,-1e-10,0,1e-15,.0001,.1]:
  for p in [0,1/(2*N),.2,.9999,1]:
   a=4*mp.mpf(str(N))*mp.mpf(str(s));pp=mp.mpf(str(p));u=pp if a==0 else mp.expm1(-a*pp)/mp.expm1(-a)
   out['fixation'].append([p,N,s,float(u)])
for N in [2,5,10,30,60]:
 for s in [-.1,-1e-10,0,.01,.1]:
  M=2*N;p=np.arange(M+1)/M;post=p*(1+s)/(1+s*p);P=binom.pmf(np.arange(M+1)[None,:],M,post[:,None]);Q=P[1:M,1:M];A=np.eye(M-1)-Q
  u=solve(A,P[1:M,M]);g=solve(A,u);tau=solve(A,np.ones(M-1))
  out['chain'].append(dict(N=N,s=s,u=[0,*u.tolist(),1],conditional=[None,*(g/u).tolist(),0],absorption=[0,*tau.tolist(),0]))
for g in [0,.00001,.05,.1]:
 for k in [0,1,10]:
  for t in [0,30,120]:
   N0=10000;d=.03;mu=.00001;r=rho(g);q=1-r;m=1+mp.mpf(str(g));H=quad(lambda x:mu*N0*float(r)*np.exp(-d*x),0,t,epsabs=1e-13)[0]
   ps=1-q**k;pt=1-q**k*mp.exp(-mp.mpf(str(mu*N0/d))*r);cond=None if k==0 or g==0 else float((k*m**t-k*q**k*(m*q)**t)/ps)
   out['rescue'].append(dict(params=dict(N0=N0,d=d,g=g,mu=mu,k=k,t=t),rho=float(r),stand=float(ps),newByT=float(-mp.expm1(-mp.mpf(str(H)))),total=float(pt),conditional=cond))
out['dfe']=[];out['nearly']=[]
def fix(N,s):
 a=4*mp.mpf(str(N))*mp.mpf(str(s));p=1/(2*mp.mpf(str(N)))
 return p if a==0 else mp.expm1(-a*p)/mp.expm1(-a)
for N in [10,1000,1e6]:
 for a in [0,.0001,.005]:
  for b in [0,.25]:
   for n in [0,.7]:
    h=1-mp.mpf(str(b))-mp.mpf(str(n));aa=mp.mpf(str(a));effects=[-10*aa,-aa,-aa/10,mp.mpf(0),aa/10,aa,10*aa];weights=[mp.mpf('.2')*h,mp.mpf('.5')*h,mp.mpf('.3')*h,mp.mpf(str(n)),mp.mpf('.5')*b,mp.mpf('.35')*b,mp.mpf('.15')*b];v=[w*fix(N,e) for w,e in zip(weights,effects)];total=sum(v)
    out['dfe'].append(dict(N=N,a=a,b=b,n=n,logTotal=float(mp.log(total)),fixed=[float(x/total) for x in v]))
 for a in [0,.0001,.003]:
  for n in [0,.2]:
   aa=mp.mpf(str(a));nn=mp.mpf(str(n));effects=[0,-aa/10,-aa,-10*aa];weights=[nn,mp.mpf('.2')*(1-nn),mp.mpf('.5')*(1-nn),mp.mpf('.3')*(1-nn)];rate=sum(w*2*mp.mpf(str(N))*fix(N,e) for w,e in zip(weights,effects))
   out['nearly'].append(dict(N=N,a=a,n=n,rate=float(rate),logRate=float(mp.log(rate))))
print(json.dumps(out,indent=2,allow_nan=False))
