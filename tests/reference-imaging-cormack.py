"""Independent quadrature of circular material rays and exact piecewise-linear Abel data integrals."""
import numpy as np,json
from scipy.integrate import quad
from scipy.special import eval_chebyt
from pathlib import Path
R=[.565,5,10];MU=[.150,.161,.0340]
def ray(s):
 s=abs(s)
 if s>=10:return 0.
 bounds=[-np.sqrt(100-s*s),np.sqrt(100-s*s)];points=[]
 for rad in R[:-1]:
  if s<rad:points.extend([-np.sqrt(rad*rad-s*s),np.sqrt(rad*rad-s*s)])
 def f(t):
  rr=np.hypot(t,s)
  return .150 if rr<.565 else .161 if rr<5 else .0340
 return quad(f,*bounds,points=sorted(points),epsabs=1e-12)[0]
def beam(s,w):
 if w==0:return ray(s)
 points=[z-s for rad in R for z in [-rad,rad]if -w/2<z-s<w/2]
 return -np.log(quad(lambda u:np.exp(-ray(s+u)),-w/2,w/2,points=points,epsabs=1e-11)[0]/w)
rays=[dict(s=float(s),p=ray(s))for s in [0,.3,.565,1,4.9,5,7,9.9,10,11]]
records=[]
for w in [0,.7,1.4]:
 for h in [.5,.25,.1]:
  ss=np.linspace(0,12.5,round(12.5/h)+1);pp=np.array([beam(s,w)for s in ss]);rr=[0,.1,.565,1,4.9,5,7,9.9,10]
  records.append(dict(w=w,h=h,offsets=ss.tolist(),data=pp.tolist(),J=[dict(r=r,J=float(quad(lambda th:np.interp(r/np.cos(th),ss,pp),0,np.arccos(r/10),points=[np.arccos(r/s)for s in ss if s>r and s<10],epsabs=2e-12,epsrel=2e-12,limit=300)[0]/np.pi) if r>0 and r<10 else pp[0]/2 if r==0 else 0.,exact=quad(lambda t:.150 if t<.565 else .161 if t<5 else .0340,r,10,points=[p for p in R[:-1]if p>r],epsabs=1e-12)[0])for r in rr]))
identity=[]
for n in range(6):
 for z,r in[(.2,.8),(.6,.9)]:
  f=lambda th:(r*z/(z*z+(r*r-z*z)*np.sin(th)**2))*eval_chebyt(n,np.sqrt(z*z+(r*r-z*z)*np.sin(th)**2)/z)*eval_chebyt(n,np.sqrt(z*z+(r*r-z*z)*np.sin(th)**2)/r)
  identity.append(dict(n=n,z=z,r=r,I=quad(f,0,np.pi/2,epsabs=1e-10,epsrel=1e-10)[0]))
Path('tests/fixtures/imaging-cormack-reference.json').write_text(json.dumps(dict(rays=rays,records=records,identity=identity),indent=2))
