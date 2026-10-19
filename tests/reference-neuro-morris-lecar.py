# Independently implemented ML equilibrium curves and DOP853 event times; Python + SciPy.
import json,math,scipy
from scipy.integrate import solve_ivp
from scipy.optimize import brentq
from pathlib import Path
out={'provenance':{'solver':'SciPy '+scipy.__version__+' DOP853 rtol1e-10 atol1e-12 maxstep.5','initial':'V=-60,w=w_inf(-60)','retention':'upward zero crossings afterT/3','scope':'chosen atlas parameter sets, not original1981 empirical table'},'models':{}}
for name,gca,phi,v3,v4 in [('snic',4,.067,12,17.4),('hopf',4.4,.04,2,30)]:
 def m(V):return .5*(1+math.tanh((V+1.2)/18))
 def w(V):return .5*(1+math.tanh((V-v3)/v4))
 def dm(V):return .5/18/math.cosh((V+1.2)/18)**2
 def dw(V):return .5/v4/math.cosh((V-v3)/v4)**2
 def current(V):return 2*(V+60)+gca*m(V)*(V-120)+8*w(V)*(V+84)
 def derivative(V):return 2+gca*(dm(V)*(V-120)+m(V))+8*(dw(V)*(V+84)+w(V))
 folds=[]
 for j in range(1800):
  a=-100+j*.1;b=a+.1
  if derivative(a)*derivative(b)<0:
   V=brentq(derivative,a,b,xtol=1e-13);folds.append({'V':V,'I':current(V)})
 rows=[]
 cases=[(0,2500),(38,2500),(40,6000),(45,2500),(60,2500),(112,2500)] if name=='snic' else[(0,2500),(90,2500),(94,2500),(100,2500),(112,2500)]
 for I,T in cases:
  def F(t,y):V,W=y;return[(I-2*(V+60)-gca*m(V)*(V-120)-8*W*(V+84))/20,phi*(w(V)-W)*math.cosh((V-v3)/(2*v4))]
  def event(t,y):return y[0]
  event.direction=1
  q=solve_ivp(F,[0,T],[-60,w(-60)],method='DOP853',rtol=1e-10,atol=1e-12,max_step=.5,events=event)
  events=[float(t) for t in q.t_events[0] if t>=T/3]
  rows.append({'I':I,'T':T,'events':events,'rate':1000*(len(events)-1)/(events[-1]-events[0]) if len(events)>=3 else None,'final':q.y[:,-1].tolist()})
 out['models'][name]={'folds':folds,'rows':rows}
Path('tests/fixtures/neuro-morris-lecar-reference.json').write_text(json.dumps(out,indent=2)+'\n')
print({name:[(r['I'],len(r['events'])) for r in v['rows']] for name,v in out['models'].items()})
