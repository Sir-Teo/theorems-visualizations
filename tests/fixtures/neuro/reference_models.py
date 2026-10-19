import numpy as np,json
from scipy.integrate import solve_ivp
from scipy.optimize import brentq

def exprel(x):return 1+x/2+x*x/12 if abs(x)<1e-5 else x/(-np.expm1(-x))
def rates(v):return np.array([exprel((v+40)/10),.07*np.exp(-(v+65)/20),.1*exprel((v+55)/10)]),np.array([4*np.exp(-(v+65)/18),1/(1+np.exp(-(v+35)/10)),.125*np.exp(-(v+65)/80)])
def hh(t,z,I,T):
 v,m,h,n=z;a,b=rates(v);return [(I-120*m**3*h*(v-50)-36*n**4*(v+77)-.3*(v+54.387))/1,*((a*(1-z[1:])-b*z[1:])*3**((T-6.3)/10))]
def event(t,z):return z[0]
event.direction=1
v=-65;a,b=rates(v);z0=[v,*(a/(a+b))]
out={'method':'Independent SciPy DOP853, rtol 1e-10, atol 1e-11; original HH equations, maximal step .1 ms','hh':[]}
for T,I in [(6.3,8),(6.3,10),(6.3,150),(18.5,8),(18.5,20),(18.5,150)]:
 r=solve_ivp(lambda t,z:hh(t,z,I,T),(0,300),z0,method='DOP853',events=event,rtol=1e-10,atol=1e-11,max_step=.1);sp=r.t_events[0];late=sp[sp>200];out['hh'].append({'T':T,'I':I,'spikes':sp.tolist(),'lateRate':1000/(late[-1]-late[-2]) if len(late)>1 else 0,'end':r.y[:,-1].tolist()})
open('tests/fixtures/neuro/independent-hh.json','w').write(json.dumps(out,indent=2)+'\n');print([(r['T'],r['I'],len(r['spikes']),r['lateRate']) for r in out['hh']],flush=True)
