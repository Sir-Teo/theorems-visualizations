# Independent HH repeated-input reference. Python + SciPy; no JS model imported.
import math,json,scipy
from pathlib import Path
from scipy.integrate import solve_ivp
from scipy.optimize import brentq
import numpy as np

def rates(V):
 def trap(x,d):return d if abs(x)<1e-10 else x/math.expm1(x/d)
 return [.1*trap(-(V+40),10),4*math.exp(-(V+65)/18),.07*math.exp(-(V+65)/20),1/(1+math.exp(-(V+35)/10)),.01*trap(-(V+55),10),.125*math.exp(-(V+65)/80)]
a,b,c,d,e,f=rates(-65);initial=[-65,a/(a+b),c/(c+d),e/(e+f)]
def field(I,T):
 phi=3**((T-6.3)/10)
 def F(t,y):
  V,m,h,n=y;am,bm,ah,bh,an,bn=rates(V)
  return[I-120*m**3*h*(V-50)-36*n**4*(V+77)-.3*(V+54.387),phi*(am*(1-m)-bm*m),phi*(ah*(1-h)-bh*h),phi*(an*(1-n)-bn*n)]
 return F

def solve(I,T,start,duration):
 def event(t,y):return y[0]
 event.direction=1
 q=solve_ivp(field(I,T),[0,duration],start,method='DOP853',rtol=1e-11,atol=1e-12,max_step=.025,events=event)
 return q,[float(t) for t in q.t_events[0]]
out={'provenance':{'solver':'SciPy '+scipy.__version__+' DOP853 rtol1e-11 atol1e-12 maxstep.025','threshold':'upward0mV events, allreferencecasesrepolarizebelow-20betweenacceptedspikes','initial':initial,'scope':'chosen stated atlas squid-HH constants'},'cases':[]}
for T in[6.3,18.5]:
 warm,_=solve(20,T,initial,100)
 for I in[0,6.5,8,10,20,150]:
  for name,y in [('rest',initial),('spiking',warm.y[:,-1])]:
   q,sp=solve(I,T,y,150);keep=[t for t in sp if t>50]
   out['cases'].append({'T':T,'I':I,'start':name,'initial':[float(x) for x in y],'events':sp,'rate':1000/(keep[-1]-keep[-2]) if len(keep)>=3 else None,'final':q.y[:,-1].tolist()})
# Independent local-equilibrium eigenvalues at I8, contrasted with a finite spiking launch.
def equilibrium_current(V):
 am,bm,ah,bh,an,bn=rates(V);m,h,n=am/(am+bm),ah/(ah+bh),an/(an+bn)
 return 120*m**3*h*(V-50)+36*n**4*(V+77)+.3*(V+54.387)
V=brentq(lambda V:equilibrium_current(V)-8,-80,-40);am,bm,ah,bh,an,bn=rates(V);y=np.array([V,am/(am+bm),ah/(ah+bh),an/(an+bn)]);h=1e-5;J=np.column_stack([(np.array(field(8,6.3)(0,y+np.eye(4)[j]*h))-np.array(field(8,6.3)(0,y-np.eye(4)[j]*h)))/(2*h) for j in range(4)])
out['equilibrium8']={'state':y.tolist(),'eigenvalues':[[float(x.real),float(x.imag)] for x in np.linalg.eigvals(J)]}
Path('tests/fixtures/neuro-hh-firing-reference.json').write_text(json.dumps(out,indent=2)+'\n');print([(c['T'],c['I'],c['start'],len(c['events'])) for c in out['cases']])
