# Independently implemented continuous ML/Ca-like bursting reference; Python + SciPy.
import math,json,scipy
from pathlib import Path
from scipy.integrate import solve_ivp
out={'provenance':{'solver':'SciPy '+scipy.__version__+' DOP853 rtol1e-10 atol1e-12 maxstep.5','warm':12000,'T':8000,'initial':[-50,'w_inf(-50)',.1],'scope':'chosen atlas model, no experimental or homoclinic classification'},'cases':[]}
for eps,I in[(.001,50),(.0003,44),(.0003,60),(.003,44),(.003,60)]:
 def winf(V):return .5*(1+math.tanh((V-12)/17.4))
 def F(t,y):
  V,w,z=y;m=.5*(1+math.tanh((V+1.2)/18));ica=4*m*(V-120)
  return[(I-2*(V+60)-ica-8*w*(V+84)-.5*z/(1+z)*(V+84))/20,.23*(winf(V)-w)*math.cosh((V-12)/34.8),eps*(-.02*ica-z)]
 def event(t,y):return y[0]
 event.direction=1
 q=solve_ivp(F,[0,20000],[-50,winf(-50),.1],method='DOP853',rtol=1e-10,atol=1e-12,max_step=.5,events=event)
 out['cases'].append({'eps':eps,'I':I,'events':[float(t-12000) for t in q.t_events[0] if t>=12000],'final':q.y[:,-1].tolist()})
Path('tests/fixtures/neuro-bursting-reference.json').write_text(json.dumps(out,indent=2)+'\n');print([(c['eps'],c['I'],len(c['events'])) for c in out['cases']])
out['frozen']=[]
for z in [.3,.6,.8,1,1.2,3]:
 def w(V):return .5*(1+math.tanh((V-12)/17.4))
 def F(t,y):V,W=y;m=.5*(1+math.tanh((V+1.2)/18));return[(50-2*(V+60)-4*m*(V-120)-8*W*(V+84)-.5*z/(1+z)*(V+84))/20,.23*(w(V)-W)*math.cosh((V-12)/34.8)]
 def event(t,y):return y[0]
 event.direction=1
 q=solve_ivp(F,[0,1500],[0,w(0)],method='DOP853',rtol=1e-10,atol=1e-12,max_step=.5,events=event,dense_output=True)
 values=q.sol([750+j*.25 for j in range(3001)])[0];events=[float(t) for t in q.t_events[0] if t>=750]
 out['frozen'].append({'z':z,'I':50,'lo':float(min(values)),'hi':float(max(values)),'events':events})
Path('tests/fixtures/neuro-bursting-reference.json').write_text(json.dumps(out,indent=2)+'\n')
