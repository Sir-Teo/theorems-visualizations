# Independent implementation of the declared modified author teaching model; Python + SciPy.
import math,json,scipy
from scipy.integrate import solve_ivp
from scipy.optimize import brentq
from pathlib import Path

def rates(V):
 def trap(x):return 10 if abs(x)<1e-12 else x/math.expm1(x/10)
 return[.1*trap(-(V+29.7)),4*math.exp(-(V+54.7)/18),.07*math.exp(-(V+48)/20),1/(1+math.exp(-(V+18)/10)),.01*trap(-(V+45.7)),.125*math.exp(-(V+55.7)/80)]
def A(V):return(.0761*math.exp((V+94.22)/31.84)/(1+math.exp((V+1.17)/28.93)))**(1/3)
def B(V):return 1/(1+math.exp((V+53.3)/14.54))**4
def steady(V):
 am,bm,ah,bh,an,bn=rates(V);return[V,am/(am+bm),ah/(ah+bh),an/(an+bn),A(V),B(V)]
def ionic(y,g,EL):V,m,h,n,a,b=y;return .3*(V-EL)+120*m**3*h*(V-55)+20*n**4*(V+72)+g*a**3*b*(V+75)
V0=brentq(lambda V:ionic(steady(V),47.7,-17),-80,-50,xtol=1e-13);y0=steady(V0)
out={'provenance':{'solver':'SciPy '+scipy.__version__+' DOP853 rtol1e-11 atol1e-12 maxstep.1, exact inputsplit20ms','scope':'retuned-leak teachingvariant, exactcube-rootactivation, not1971experimentalfit','primary':'https://sites.pitt.edu/~phase/bard/bardware/classes/compneuro/model/cs.ode','primarySha256':'1223b83c1079903c0f3487e155baa71eaf839fc7500635a23a448985425c9527'},'rest':V0,'cases':[]}
for g in[0,15,30,47.7]:
 EL=V0+ionic(y0,g,V0)/.3
 for I in[7,8.5,10,14]:
  def F(t,y):
   V,m,h,n,a,b=y;am,bm,ah,bh,an,bn=rates(V)
   return[I-ionic(y,g,EL),3.8*(am*(1-m)-bm*m),3.8*(ah*(1-h)-bh*h),1.9*(an*(1-n)-bn*n),(A(V)-a)/(.3632+1.158/(1+math.exp((V+55.96)/20.12))),(B(V)-b)/(1.24+2.678/(1+math.exp((V+50)/16.027)))]
  def event(t,y):return y[0]+20
  event.direction=1
  q=solve_ivp(F,[20,620],y0,method='DOP853',rtol=1e-11,atol=1e-12,max_step=.1,events=event);sp=[float(x) for x in q.t_events[0]];late=[t for t in sp if t>=120]
  out['cases'].append({'gA':g,'I':I,'EL':EL,'events':sp,'rate':1000/(late[-1]-late[-2]) if len(late)>=3 else None,'latency':sp[0]-20 if len(sp) else None,'final':q.y[:,-1].tolist()})
Path('tests/fixtures/neuro-connor-stevens-reference.json').write_text(json.dumps(out,indent=2)+'\n');print([(c['gA'],c['I'],len(c['events'])) for c in out['cases']])
