# Independent FHN DOP853 and local bifurcation calculations; run with Python + SciPy.
import json,math,scipy
import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import brentq
from pathlib import Path
out={'provenance':{'solver':'SciPy '+scipy.__version__+' DOP853 rtol1e-10 atol1e-12 maxstep.1; dense sampling every.1','a':.7,'b':.8,'initial':'equilibrium plus(.1,0)','primary':'https://izhikevich.org/publications/dsn.pdf'},'cases':[]}
for eps,I in [(1,0),(1,.735),(1,.75),(1,.9),(1,1.6),(.08,.32),(.08,.332),(.08,.34),(.08,.9),(.08,1.6)]:
 v=brentq(lambda x:x-x**3/3-(x+.7)/.8+I,-4,4,xtol=1e-14);w=(v+.7)/.8;T=1500 if eps<.5 else 800
 sol=solve_ivp(lambda t,y:[y[0]-y[0]**3/3-y[1]+I,eps*(y[0]+.7-.8*y[1])],[0,T],[v+.1,w],method='DOP853',rtol=1e-10,atol=1e-12,max_step=.1,dense_output=True)
 Y=sol.sol(np.arange(round(T*10)+1)/10)[0];q=len(Y)//4;A=float(np.ptp(Y[3*q:]));previous=float(np.ptp(Y[2*q:3*q]));half=Y[2*q:];level=np.mean(half);events=[]
 for j in range(1,len(half)):
  if half[j-1]<level<=half[j]:events.append((j-1+(level-half[j-1])/(half[j]-half[j-1]))*.1)
 passed=A>.05 and A>=.9*previous and len(events)>=3
 out['cases'].append({'eps':eps,'I':I,'T':T,'rate':(len(events)-1)/(events[-1]-events[0]) if passed else None,'amp':A,'previous':previous,'crossings':len(events),'equilibrium':[v,w],'final':sol.y[:,-1].tolist()})
Path('tests/fixtures/neuro-hopf-reference.json').write_text(json.dumps(out,indent=2)+'\n')
print([(r['eps'],r['I'],r['rate']) for r in out['cases']])
